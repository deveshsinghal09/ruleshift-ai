import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialGameState } from "@/domain/game/engine";
import { HttpAdventureTransport } from "@/features/adventure/http-transport";

function state() {
  return createInitialGameState({
    difficulty: "normal",
    profile: {
      archetype: "Placement Warrior",
      mood: "funny",
      name: "Devesh",
      title: "the Placement Warrior",
    },
    seed: "transport-seed",
    sessionId: "00000000-0000-4000-8000-000000000777",
  });
}

describe("HttpAdventureTransport", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("restores server state and submits its optimistic version", async () => {
    const initial = state();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            state: initial,
            stateVersion: 7,
            updatedAt: "2026-07-29T12:00:00.000Z",
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            state: initial,
            stateVersion: 8,
            updatedAt: "2026-07-29T12:01:00.000Z",
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const transport = new HttpAdventureTransport();

    await transport.getSession(initial.sessionId);
    await transport.submitAction(initial.sessionId, {
      actionId: "follow-bell",
      requestId: "request-1",
    });

    const options = fetchMock.mock.calls[1]?.[1];
    expect(JSON.parse(String(options?.body)) as unknown).toMatchObject({
      expectedStateVersion: 7,
      idempotencyKey: "request-1",
    });
  });

  it("returns null for an owned-session miss", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(null, { status: 404 }),
      ),
    );
    const transport = new HttpAdventureTransport();
    await expect(transport.getSession("missing")).resolves.toBeNull();
  });
});
