import { describe, expect, it } from "vitest";
import { createInitialGameState } from "@/domain/game/engine";
import { buildTurnResolutionReceipt } from "@/features/game/turn-resolution";

const profile = {
  archetype: "Placement Warrior",
  mood: "funny" as const,
  name: "Devesh",
  title: "the Placement Warrior",
};

describe("buildTurnResolutionReceipt", () => {
  it("derives deterministic state changes without inventing calculations", () => {
    const before = createInitialGameState({
      difficulty: "normal",
      profile,
      seed: "receipt-seed",
      sessionId: "receipt-session",
    });
    const after = {
      ...before,
      currentEvent: {
        ...before.currentEvent,
        id: "ai-event-1",
      },
      history: [
        {
          actionId: "follow-bell",
          actionLabel: "Follow the bell",
          description: "The route advances.",
          effects: [],
          eventId: before.currentEvent.id,
          id: "history-1",
          kind: "exploration" as const,
          ruleEvents: [],
          title: "Route advanced",
          turn: 1,
        },
      ],
      lastAction: "follow-bell",
      player: {
        ...before.player,
        energy: before.player.energy - 8,
      },
      score: before.score + 12,
      turn: 1,
    };

    const receipt = buildTurnResolutionReceipt(before, after);

    expect(receipt).toMatchObject({
      actionLabel: "Follow the bell",
      creativeSource: "ai-provider",
      turn: 1,
    });
    expect(receipt.changes).toContainEqual({
      label: "Energy",
      tone: "warning",
      value: "-8",
    });
    expect(receipt.changes).toContainEqual({
      label: "Score",
      tone: "success",
      value: "+12",
    });
  });

  it("labels local continuity as deterministic fallback", () => {
    const before = createInitialGameState({
      difficulty: "easy",
      profile,
      seed: "fallback-seed",
      sessionId: "fallback-session",
    });
    const after = {
      ...before,
      currentEvent: {
        ...before.currentEvent,
        id: "local-dialogue-1",
      },
      turn: 1,
    };

    expect(buildTurnResolutionReceipt(before, after).creativeSource).toBe(
      "deterministic-fallback",
    );
  });
});
