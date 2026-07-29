import { describe, expect, it } from "vitest";
import { AiDirector } from "@/server/ai/director";
import { hashOwnerToken } from "@/server/auth/owner-token";
import type { CharacterPassport } from "@/features/adventure/types";
import { GameServiceError } from "@/server/game/errors";
import { GameService } from "@/server/game/service";
import type { ProcessActionRequest } from "@/server/game/schemas";
import { MemoryGameSessionRepository } from "@/server/repositories/memory-game-repository";

const passport: CharacterPassport = {
  archetype: "Placement Warrior",
  difficulty: "normal",
  mood: "funny",
  name: "Devesh",
  title: "the Placement Warrior",
};
const ownerHash = hashOwnerToken("owner-token");
const otherOwnerHash = hashOwnerToken("other-owner-token");

function createHarness(options?: {
  readonly difficulty?: CharacterPassport["difficulty"];
  readonly throwFromAi?: boolean;
}) {
  const repository = new MemoryGameSessionRepository();
  let idCounter = 0;
  const service = new GameService({
    aiDirector: options?.throwFromAi
      ? {
          generateEvent: () =>
            Promise.reject(new Error("Provider unavailable")),
        }
      : new AiDirector({ provider: null }),
    clock: () => new Date("2026-07-29T12:00:00.000Z"),
    idFactory: () => {
      idCounter += 1;
      return `00000000-0000-4000-8000-${idCounter
        .toString()
        .padStart(12, "0")}`;
    },
    rateLimiter: { consume: () => true },
    repository,
  });
  return {
    passport: {
      ...passport,
      difficulty: options?.difficulty ?? passport.difficulty,
    },
    repository,
    service,
  };
}

function action(
  actionId: string,
  expectedStateVersion: number,
  idempotencyKey: string,
): ProcessActionRequest {
  return {
    actionId,
    expectedStateVersion,
    idempotencyKey,
  };
}

describe("GameService", () => {
  it("starts, owns, lists, and restores a validated session", async () => {
    const { service, passport: input } = createHarness();
    const created = await service.startSession(ownerHash, input);

    expect(created.stateVersion).toBe(1);
    expect(created.state.sessionId).toMatch(
      /^[0-9a-f-]{36}$/u,
    );
    await expect(
      service.getSession(created.state.sessionId, ownerHash),
    ).resolves.toEqual(created);
    await expect(service.listSessions(ownerHash)).resolves.toMatchObject([
      {
        id: created.state.sessionId,
        status: "playing",
        turn: 0,
      },
    ]);
  });

  it("does not reveal a session to a different anonymous owner", async () => {
    const { service, passport: input } = createHarness();
    const created = await service.startSession(ownerHash, input);

    await expect(
      service.getSession(created.state.sessionId, otherOwnerHash),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });
  });

  it("processes and persists a deterministic authoritative turn", async () => {
    const { service, passport: input } = createHarness();
    const created = await service.startSession(ownerHash, input);
    const next = await service.processAction(
      created.state.sessionId,
      ownerHash,
      action("follow-bell", 1, "request-1"),
    );

    expect(next.state.turn).toBe(1);
    expect(next.stateVersion).toBe(2);
    expect(next.state.player.energy).toBe(88);
    expect(next.state.history).toHaveLength(1);
  });

  it("replays an idempotent response without applying a second turn", async () => {
    const { service, passport: input } = createHarness();
    const created = await service.startSession(ownerHash, input);
    const request = action("follow-bell", 1, "same-request");
    const first = await service.processAction(
      created.state.sessionId,
      ownerHash,
      request,
    );
    const replay = await service.processAction(
      created.state.sessionId,
      ownerHash,
      request,
    );

    expect(replay).toEqual(first);
    expect(replay.state.turn).toBe(1);
    expect(replay.stateVersion).toBe(2);
  });

  it("rejects stale optimistic state versions", async () => {
    const { service, passport: input } = createHarness();
    const created = await service.startSession(ownerHash, input);
    await service.processAction(
      created.state.sessionId,
      ownerHash,
      action("follow-bell", 1, "request-1"),
    );

    await expect(
      service.processAction(
        created.state.sessionId,
        ownerHash,
        action("binary-search", 1, "request-2"),
      ),
    ).rejects.toMatchObject({
      code: "STALE_VERSION",
      status: 409,
    });
  });

  it("rolls back the whole turn when persistence fails", async () => {
    const { repository, service, passport: input } = createHarness();
    const created = await service.startSession(ownerHash, input);
    repository.failNextPersist = true;

    await expect(
      service.processAction(
        created.state.sessionId,
        ownerHash,
        action("follow-bell", 1, "request-1"),
      ),
    ).rejects.toThrow("Simulated transaction failure");
    const restored = await service.getSession(
      created.state.sessionId,
      ownerHash,
    );
    expect(restored.state.turn).toBe(0);
    expect(restored.stateVersion).toBe(1);
  });

  it("persists fallback turns when the AI provider fails", async () => {
    const { service, passport: input } = createHarness({
      throwFromAi: true,
    });
    const created = await service.startSession(ownerHash, input);
    const next = await service.processAction(
      created.state.sessionId,
      ownerHash,
      action("follow-bell", 1, "request-1"),
    );

    expect(next.state.currentEvent.id).toBe("binary-examiner");
    expect(next.state.turn).toBe(1);
  });

  it("persists a complete four-turn victory and result", async () => {
    const { service, passport: input } = createHarness();
    let session = await service.startSession(ownerHash, input);
    session = await service.processAction(
      session.state.sessionId,
      ownerHash,
      action("follow-bell", 1, "request-1"),
    );
    session = await service.processAction(
      session.state.sessionId,
      ownerHash,
      action("binary-search", 2, "request-2"),
    );
    session = await service.processAction(
      session.state.sessionId,
      ownerHash,
      {
        customAction: "Convince the rubric that semicolons show leadership.",
        expectedStateVersion: 3,
        idempotencyKey: "request-3",
      },
    );
    session = await service.processAction(
      session.state.sessionId,
      ownerHash,
      action("open-letter", 4, "request-4"),
    );

    expect(session.state.status).toBe("victory");
    await expect(
      service.getResult(session.state.sessionId, ownerHash),
    ).resolves.toEqual(session);
  });

  it("persists a deterministic hard-mode defeat", async () => {
    const { service, passport: input } = createHarness({
      difficulty: "hard",
    });
    let session = await service.startSession(ownerHash, input);
    session = await service.processAction(
      session.state.sessionId,
      ownerHash,
      action("kick-door", 1, "request-1"),
    );
    session = await service.processAction(
      session.state.sessionId,
      ownerHash,
      action("binary-search", 2, "request-2"),
    );
    session = await service.processAction(
      session.state.sessionId,
      ownerHash,
      action("compliment-complexity", 3, "request-3"),
    );

    expect(session.state.status).toBe("defeat");
    expect(session.state.player.health).toBe(0);
  });

  it("abandons only active, owned sessions", async () => {
    const { service, passport: input } = createHarness();
    const created = await service.startSession(ownerHash, input);
    await service.abandonSession(created.state.sessionId, ownerHash);

    await expect(
      service.processAction(
        created.state.sessionId,
        ownerHash,
        action("follow-bell", 1, "request-1"),
      ),
    ).rejects.toBeInstanceOf(GameServiceError);
  });
});
