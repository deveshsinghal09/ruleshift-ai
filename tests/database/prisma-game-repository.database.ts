import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { hardenPostgresSslMode } from "@/server/db/connection";
import { AiDirector } from "@/server/ai/director";
import { hashOwnerToken } from "@/server/auth/owner-token";
import { GameService } from "@/server/game/service";
import { persistedSessionSchema } from "@/server/game/schemas";
import { PrismaGameSessionRepository } from "@/server/repositories/prisma-game-repository";

const databaseUrl =
  process.env.TEST_DATABASE_URL?.trim() ??
  process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error(
    "Set TEST_DATABASE_URL or DATABASE_URL to an explicitly identified test/development PostgreSQL database before running npm run db:test.",
  );
}
const parsedUrl = new URL(databaseUrl);
if (
  process.env.NODE_ENV === "production" ||
  /(^|[-_])prod(uction)?($|[-_])/u.test(parsedUrl.pathname.slice(1))
) {
  throw new Error("Database tests refuse production-like database names.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(hardenPostgresSslMode(databaseUrl)),
});
const repository = new PrismaGameSessionRepository(prisma);
const ownerHash = hashOwnerToken(
  `phase-7-database-test-${Date.now().toString(36)}`,
);
const sessionId = "00000000-0000-4000-8000-000000000701";
const service = new GameService({
  aiDirector: new AiDirector({ provider: null }),
  idFactory: () => sessionId,
  rateLimiter: { consume: () => true },
  repository,
});

describe("Prisma PostgreSQL persistence", () => {
  beforeAll(async () => {
    await prisma.gameSession.deleteMany({
      where: { ownerTokenHash: ownerHash },
    });
  });

  afterAll(async () => {
    await prisma.gameSession.deleteMany({
      where: { ownerTokenHash: ownerHash },
    });
    await prisma.$disconnect();
  });

  it("has the prepared migration applied", async () => {
    const rows = await prisma.$queryRaw<
      readonly { table_name: string | null }[]
    >`SELECT to_regclass('public.game_sessions')::text AS table_name`;
    expect(rows[0]?.table_name).toBe("game_sessions");
  });

  it("creates, owns, resumes, and atomically persists a turn", async () => {
    const created = await service.startSession(ownerHash, {
      archetype: "Placement Warrior",
      difficulty: "normal",
      mood: "funny",
      name: "Devesh",
      title: "the Placement Warrior",
    });
    expect(created.stateVersion).toBe(1);

    const unauthorized = await repository.findOwned(
      sessionId,
      hashOwnerToken("different-owner"),
    );
    expect(unauthorized).toBeNull();

    const next = await service.processAction(sessionId, ownerHash, {
      actionId: "follow-bell",
      expectedStateVersion: 1,
      idempotencyKey: "database-request-1",
    });
    expect(next.stateVersion).toBe(2);
    expect(next.state.turn).toBe(1);
    await expect(
      service.getSession(sessionId, ownerHash),
    ).resolves.toEqual(next);

    const event = await prisma.gameEvent.findUnique({
      where: { sessionId_turn: { sessionId, turn: 1 } },
    });
    expect(event?.beforeStateSnapshot).toBeTruthy();
    expect(event?.afterStateSnapshot).toBeTruthy();
  });

  it("replays duplicate idempotency keys", async () => {
    const replay = await service.processAction(sessionId, ownerHash, {
      actionId: "follow-bell",
      expectedStateVersion: 1,
      idempotencyKey: "database-request-1",
    });
    expect(replay.state.turn).toBe(1);
    expect(replay.stateVersion).toBe(2);
    await expect(
      prisma.turnRequest.count({ where: { sessionId } }),
    ).resolves.toBe(1);
  });

  it("rolls back the version increment when a later write fails", async () => {
    const stored = await repository.findOwned(sessionId, ownerHash);
    expect(stored).not.toBeNull();
    if (!stored) {
      throw new Error("Test session was not restored.");
    }
    const response = persistedSessionSchema.parse({
      state: stored.state,
      stateVersion: 3,
      updatedAt: new Date().toISOString(),
    });
    await expect(
      repository.persistTurn({
        action: stored.state.currentEvent.choices[0],
        afterState: stored.state,
        beforeState: stored.state,
        effects: [],
        expectedStateVersion: 2,
        idempotencyKey: "forced-rollback",
        ownerTokenHash: ownerHash,
        response,
        ruleEvents: [],
        sessionId,
      }),
    ).rejects.toThrow();
    const restored = await repository.findOwned(sessionId, ownerHash);
    expect(restored?.stateVersion).toBe(2);
    expect(restored?.state.turn).toBe(1);
  });
});
