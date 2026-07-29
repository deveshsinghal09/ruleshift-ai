import { beforeEach, describe, expect, it } from "vitest";
import { createLocalAdventureTransport } from "@/features/adventure/engine-transport";
import { AI_FALLBACK_MESSAGE } from "@/lib/ai-messages";
import { validEventFixture } from "@/server/ai/__fixtures__/responses";
import { convertEventProposal } from "@/server/ai/policy";
import type { AiEventClient } from "@/features/adventure/ai-event-client";
import type { CharacterPassport } from "@/features/adventure/types";

const passport: CharacterPassport = {
  archetype: "Placement Warrior",
  difficulty: "normal",
  mood: "funny",
  name: "Devesh",
  title: "the Placement Warrior",
};

describe("local adventure transport", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("runs four engine-owned turns to victory", async () => {
    const transport = createLocalAdventureTransport({
      delayMs: 0,
      idFactory: () => "four-turn-demo",
      seedFactory: () => "victory-seed",
    });
    const initial = await transport.createSession(passport);

    expect(initial.turn).toBe(0);
    expect(initial.player.health).toBe(94);

    const encounter = await transport.submitAction(initial.sessionId, {
      actionId: "follow-bell",
      requestId: "request-1",
    });
    expect(encounter.turn).toBe(1);
    expect(encounter.player.energy).toBe(88);

    const anomaly = await transport.submitAction(initial.sessionId, {
      actionId: "binary-search",
      requestId: "request-2",
    });
    expect(anomaly.currentEvent.announcement?.type).toBe(
      "ruleshift-preview",
    );
    expect(anomaly.player.health).toBeLessThan(initial.player.health);

    const rewarded = await transport.submitAction(initial.sessionId, {
      customAction: "Convince the rubric that semicolons are leadership.",
      requestId: "request-3",
    });
    expect(rewarded.player.inventory[0]?.name).toBe(
      "Résumé of Questionable Experience",
    );
    expect(rewarded.history.some((event) => event.kind === "puzzle")).toBe(
      true,
    );

    const result = await transport.submitAction(initial.sessionId, {
      actionId: "open-letter",
      requestId: "request-4",
    });
    expect(result.status).toBe("victory");
    expect(result.objectives[0].progress).toBe(100);
    expect(result.statistics.turnsTaken).toBe(4);
  });

  it("rejects a repeated action id", async () => {
    const transport = createLocalAdventureTransport({
      delayMs: 0,
      idFactory: () => "duplicate-demo",
    });
    const initial = await transport.createSession(passport);
    const request = {
      actionId: "follow-bell",
      requestId: "same-request",
    };

    await transport.submitAction(initial.sessionId, request);
    await expect(
      transport.submitAction(initial.sessionId, request),
    ).rejects.toMatchObject({
      code: "DUPLICATE_ACTION",
    });
  });

  it("rejects corrupted local session data instead of casting it", async () => {
    window.localStorage.setItem(
      "ruleshift.session.corrupted",
      JSON.stringify({ sessionId: "corrupted", health: "unlimited" }),
    );
    const transport = createLocalAdventureTransport({ delayMs: 0 });

    await expect(transport.getSession("corrupted")).resolves.toBeNull();
  });

  it("installs a validated provider event only after deterministic turn resolution", async () => {
    const aiEventClient: AiEventClient = {
      async generateNextEvent({ state }) {
        expect(state.turn).toBe(1);
        expect(state.objectives[0]?.progress).toBe(20);
        return {
          event: convertEventProposal(validEventFixture, state),
          source: "provider",
          userMessage: null,
        };
      },
    };
    const transport = createLocalAdventureTransport({
      aiEventClient,
      delayMs: 0,
      idFactory: () => "provider-demo",
    });
    const initial = await transport.createSession(passport);
    const next = await transport.submitAction(initial.sessionId, {
      actionId: "follow-bell",
      requestId: "provider-request",
    });

    expect(next.turn).toBe(1);
    expect(next.currentEvent.id).toBe("ai-event-1");
    expect(next.player.energy).toBe(88);
  });

  it("keeps the deterministic event when the AI endpoint fails", async () => {
    const aiEventClient: AiEventClient = {
      generateNextEvent() {
        return Promise.reject(new Error("network unavailable"));
      },
    };
    const transport = createLocalAdventureTransport({
      aiEventClient,
      delayMs: 0,
      idFactory: () => "fallback-demo",
    });
    const initial = await transport.createSession(passport);
    const next = await transport.submitAction(initial.sessionId, {
      actionId: "follow-bell",
      requestId: "fallback-request",
    });

    expect(next.currentEvent.id).toBe("binary-examiner");
    expect(next.currentEvent.dmAside).toContain(AI_FALLBACK_MESSAGE);
    expect(next.turn).toBe(1);
  });
});
