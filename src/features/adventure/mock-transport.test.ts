import { beforeEach, describe, expect, it } from "vitest";
import { createMockAdventureTransport } from "@/features/adventure/mock-transport";
import type { CharacterPassport } from "@/features/adventure/types";

const passport: CharacterPassport = {
  archetype: "Placement Warrior",
  difficulty: "normal",
  mood: "funny",
  name: "Devesh",
  title: "the Placement Warrior",
};

describe("mock adventure transport", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("resolves four connected turns without placing calculations in UI code", async () => {
    const transport = createMockAdventureTransport({
      delayMs: 0,
      idFactory: () => "four-turn-demo",
    });
    const initial = await transport.createSession(passport);

    expect(initial.turnIndex).toBe(0);
    expect(initial.health).toBe(94);

    const encounter = await transport.submitAction(initial.sessionId, {
      actionId: "follow-bell",
      requestId: "request-1",
    });
    expect(encounter.turnIndex).toBe(1);
    expect(encounter.energy).toBe(88);

    const shifted = await transport.submitAction(initial.sessionId, {
      actionId: "binary-search",
      requestId: "request-2",
    });
    expect(shifted.showRuleShift).toBe(true);
    expect(shifted.activeRule?.remainingTurns).toBe(3);
    expect(shifted.health).toBe(88);

    const rewarded = await transport.submitAction(initial.sessionId, {
      customAction: "Convince the rubric that semicolons are leadership.",
      requestId: "request-3",
    });
    expect(rewarded.activeRule?.remainingTurns).toBe(2);
    expect(rewarded.inventory[0]?.name).toBe(
      "Résumé of Questionable Experience",
    );
    expect(rewarded.timeline.some((event) => event.tone === "reward")).toBe(
      true,
    );

    const result = await transport.submitAction(initial.sessionId, {
      actionId: "open-letter",
      requestId: "request-4",
    });
    expect(result.status).toBe("victory");
    expect(result.objectiveProgress).toBe(100);
    expect(result.rulesSurvived).toBe(1);
    expect(result.turnsTaken).toBe(4);
  });

  it("returns the same state for a repeated request id", async () => {
    const transport = createMockAdventureTransport({
      delayMs: 0,
      idFactory: () => "duplicate-demo",
    });
    const initial = await transport.createSession(passport);
    const request = {
      actionId: "follow-bell",
      requestId: "same-request",
    };

    const first = await transport.submitAction(initial.sessionId, request);
    const duplicate = await transport.submitAction(initial.sessionId, request);

    expect(duplicate.turnsTaken).toBe(first.turnsTaken);
    expect(duplicate.score).toBe(first.score);
  });

  it("rejects corrupted local session data instead of casting it", async () => {
    window.localStorage.setItem(
      "ruleshift.session.corrupted",
      JSON.stringify({ sessionId: "corrupted", health: "unlimited" }),
    );
    const transport = createMockAdventureTransport({ delayMs: 0 });

    await expect(transport.getSession("corrupted")).resolves.toBeNull();
  });
});
