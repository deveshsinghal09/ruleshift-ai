import { describe, expect, it } from "vitest";
import { createInitialGameState } from "@/domain/game/engine";
import { validateGameState } from "@/domain/game/schemas";
import { convertEventProposal } from "@/server/ai/policy";
import { validEventFixture } from "@/server/ai/__fixtures__/responses";

function createState() {
  return createInitialGameState({
    difficulty: "normal",
    profile: {
      archetype: "Placement Warrior",
      mood: "funny",
      name: "Devesh",
      title: "the Placement Warrior",
    },
    seed: "policy-seed",
    sessionId: "policy-session",
  });
}

describe("AI policy conversion", () => {
  it("creates inert, fixed-quantity items that cannot impersonate victory rewards", () => {
    const state = createState();
    const event = convertEventProposal(
      {
        ...validEventFixture,
        item: {
          description: "A suspiciously official-looking parchment.",
          name: "Golden Offer Letter",
          rarity: "legendary",
        },
      },
      state,
    );
    const itemEffect = event.choices[0]?.effects.find(
      (effect) => effect.type === "inventory-add",
    );

    expect(itemEffect?.type).toBe("inventory-add");
    if (itemEffect?.type === "inventory-add") {
      expect(itemEffect.quantity).toBe(1);
      expect(itemEffect.item.id).not.toBe("golden-offer-letter");
      expect(itemEffect.item.effects).toEqual([]);
      expect(itemEffect.item.consumable).toBe(false);
    }
  });

  it("accepts only registry-backed RuleShifts compatible with the event", () => {
    const state = createState();
    const event = convertEventProposal(
      {
        ...validEventFixture,
        rule: { key: "wrong_answers_hurt_enemies" },
      },
      state,
    );

    expect(event.announcement).toMatchObject({
      ruleKey: "wrong_answers_hurt_enemies",
      totalTurns: 3,
      type: "ruleshift-preview",
    });
    expect(() =>
      validateGameState({ ...state, currentEvent: event }),
    ).not.toThrow();
  });

  it("rejects a proposal that targets a missing NPC", () => {
    const state = { ...createState(), npcs: [] };
    expect(() =>
      convertEventProposal(
        {
          ...validEventFixture,
          choices: [
            {
              effects: [],
              kind: "talk",
              label: "Negotiate with nobody",
              risk: "safe",
            },
            validEventFixture.choices[0],
          ],
        },
        state,
      ),
    ).toThrow(/without an available NPC/);
  });
});
