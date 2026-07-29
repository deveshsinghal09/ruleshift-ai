import { describe, expect, it } from "vitest";
import { createCustomAction } from "@/domain/game/actions";
import {
  createInitialGameState,
  processTurn,
} from "@/domain/game/engine";
import { GameEngineError } from "@/domain/game/errors";
import {
  goldenOfferLetterItem,
  localEventProvider,
} from "@/domain/game/local-event-provider";
import type {
  GameAction,
  GameState,
  InventoryItem,
  LocalGameEvent,
} from "@/domain/game/types";
import { ruleConflictMatrix } from "@/domain/rules/conflicts";
import {
  activateRule,
  getRuleActionAvailability,
} from "@/domain/rules/lifecycle";
import {
  registeredRuleKeys,
  ruleShiftRegistry,
} from "@/domain/rules/registry";
import type { RuleKey } from "@/domain/rules/types";

const profile = {
  archetype: "Placement Warrior",
  mood: "funny",
  name: "Devesh",
  title: "the Placement Warrior",
} as const;

function initialState(seed = "rules-test"): GameState {
  return createInitialGameState({
    difficulty: "normal",
    profile,
    seed,
    sessionId: `session-${seed}`,
  });
}

const moveAction: GameAction = {
  available: true,
  destination: "safe-corridor",
  effects: [],
  energyCost: 0,
  id: "safe-move",
  kind: "move",
  label: "Take the safe corridor",
  risk: "safe",
};

const inspectAction: GameAction = {
  available: true,
  effects: [],
  energyCost: 0,
  id: "safe-inspect",
  insight: 4,
  kind: "inspect",
  label: "Inspect the examiner",
  risk: "safe",
  targetId: "infinite-examiner",
};

const attackAction: GameAction = {
  available: true,
  baseDamage: 8,
  effects: [],
  energyCost: 0,
  id: "safe-attack",
  kind: "attack",
  label: "Attack with a correct answer",
  risk: "safe",
  targetId: "infinite-examiner",
};

function withEvent(
  state: GameState,
  kind: LocalGameEvent["kind"],
  choices: readonly GameAction[] = [moveAction, inspectAction],
): GameState {
  return {
    ...state,
    currentEvent: {
      badge: "Rule test",
      choices,
      dmAside: "A bounded registry test.",
      enemyId:
        kind === "combat" || kind === "puzzle"
          ? "infinite-examiner"
          : undefined,
      id: `rule-test-${kind}`,
      kind,
      narration: "The local rule fixture waits for a deterministic action.",
      npcId:
        kind === "dialogue" || kind === "reward"
          ? "dean-deferred-dreams"
          : undefined,
      title: "Rule lifecycle test",
    },
  };
}

function activate(
  state: GameState,
  key: RuleKey,
  options: {
    readonly duration?: number;
    readonly parameters?: unknown;
  } = {},
): GameState {
  return activateRule(state, {
    duration: options.duration ?? 2,
    id: `active-${key}`,
    key,
    parameters: options.parameters ?? {},
  }).state;
}

function inventoryItem(id: string): InventoryItem {
  return {
    consumable: false,
    description: `Deterministic item ${id}.`,
    effects: [],
    id,
    name: `Item ${id}`,
    quantity: 1,
    rarity: "common",
    stackable: false,
    usesPerItem: 0,
    usesRemaining: 0,
  };
}

describe("RuleShift registry and validation", () => {
  it("registers exactly the twelve approved rules with complete bounded definitions", () => {
    expect(registeredRuleKeys).toHaveLength(12);
    expect(new Set(registeredRuleKeys).size).toBe(12);

    for (const key of registeredRuleKeys) {
      const definition = ruleShiftRegistry[key];
      expect(definition.key).toBe(key);
      expect(definition.name.length).toBeGreaterThan(0);
      expect(definition.description.length).toBeGreaterThan(0);
      expect(definition.uiExplanation.length).toBeGreaterThan(0);
      expect(definition.maximumDuration).toBeLessThanOrEqual(5);
      expect(definition.compatibleEventTypes.length).toBeGreaterThan(0);
      expect(definition.parameterSchema.safeParse({}).success).toBe(true);
      expect(typeof definition.activationPredicate).toBe("function");
      expect(typeof definition.actionValidation).toBe("function");
      expect(typeof definition.beforeAction).toBe("function");
      expect(typeof definition.afterAction).toBe("function");
      expect(typeof definition.expirationBehavior).toBe("function");
      expect(ruleConflictMatrix[key]).toEqual(
        definition.conflictingRuleKeys,
      );
    }
  });

  it("rejects unsupported keys, malformed parameters, and excessive duration", () => {
    const state = initialState();
    expect(() =>
      activateRule(state, {
        duration: 2,
        id: "arbitrary-code",
        key: "execute_javascript",
        parameters: { code: "fetch('/admin')" },
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_RULE" }));

    expect(() =>
      activateRule(state, {
        duration: 2,
        id: "malformed-healing",
        key: "healing_hurts",
        parameters: { multiplier: Number.POSITIVE_INFINITY },
      }),
    ).toThrow(GameEngineError);

    expect(() =>
      activateRule(state, {
        duration: 6,
        id: "too-long",
        key: "no_repeat_action",
        parameters: {},
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_RULE" }));
  });

  it.each(registeredRuleKeys)(
    "activates and processes %s independently",
    (key) => {
      const definition = ruleShiftRegistry[key];
      const kind = definition.compatibleEventTypes[0];
      const state = withEvent(initialState(`independent-${key}`), kind);
      const activated = activate(state, key);

      expect(activated.activeRules).toHaveLength(1);
      expect(activated.activeRules[0].key).toBe(key);
      expect(() =>
        processTurn(activated, activated.currentEvent.choices[0], {
          eventProvider: localEventProvider,
        }),
      ).not.toThrow();
    },
  );
});

describe("RuleShift duration and conflict lifecycle", () => {
  it("keeps a newly announced rule at full duration until the following turn", () => {
    let state = initialState("new-rule-timing");
    state = processTurn(state, state.currentEvent.choices[0]).state;
    state = processTurn(state, state.currentEvent.choices[1]).state;

    expect(state.currentEvent.announcement?.ruleKey).toBe(
      "wrong_answers_hurt_enemies",
    );
    expect(state.activeRules[0]).toMatchObject({
      activatedAtTurn: 2,
      remainingTurns: 3,
      totalTurns: 3,
    });

    state = processTurn(state, state.currentEvent.choices[0]).state;
    expect(state.activeRules[0].remainingTurns).toBe(2);
  });

  it("expires a one-turn rule, reports expiration, and increments survival stats", () => {
    const state = activate(initialState("expiration"), "no_repeat_action", {
      duration: 1,
    });
    const result = processTurn(state, state.currentEvent.choices[0]);

    expect(result.state.activeRules).toHaveLength(0);
    expect(result.ruleEvents).toEqual([
      expect.objectContaining({
        ruleKey: "no_repeat_action",
        type: "expired",
      }),
    ]);
    expect(result.state.statistics.rulesSurvived).toBe(1);
    expect(result.state.history.at(-1)?.ruleEvents).toEqual(
      result.ruleEvents,
    );
  });

  it("expires remaining active rules when the adventure reaches a final outcome", () => {
    const base = initialState("terminal-expiration");
    const winningAction: GameAction = {
      available: true,
      effects: [
        {
          amount: 100,
          objectiveId: "golden-offer",
          type: "objective-progress",
        },
        {
          item: goldenOfferLetterItem,
          quantity: 1,
          type: "inventory-add",
        },
      ],
      energyCost: 0,
      id: "finish-with-rule",
      kind: "accept-quest",
      label: "Finish the objective",
      objectiveId: "golden-offer",
      risk: "safe",
    };
    const state = activate(
      withEvent(base, "quest", [winningAction, moveAction]),
      "no_repeat_action",
      { duration: 5 },
    );
    const result = processTurn(state, winningAction);

    expect(result.state.status).toBe("victory");
    expect(result.state.activeRules).toHaveLength(0);
    expect(result.state.statistics.rulesSurvived).toBe(1);
    expect(result.ruleEvents.at(-1)?.type).toBe("expired");
  });

  it("uses predictable priority to reject or replace conflicting rules", () => {
    const idle = activate(initialState("conflict-idle"), "idle_regeneration");
    const replaced = activate(idle, "healing_hurts");
    expect(replaced.activeRules.map((rule) => rule.key)).toEqual([
      "healing_hurts",
    ]);
    expect(replaced.ruleEvents.at(-2)?.type).toBe("replaced");

    const healing = activate(
      initialState("conflict-healing"),
      "healing_hurts",
    );
    expect(() => activate(healing, "idle_regeneration")).toThrowError(
      expect.objectContaining({ code: "RULE_CONFLICT" }),
    );
  });

  it("prevents a rule composition from removing every prepared action", () => {
    const state = withEvent(initialState("no-action"), "combat", [
      attackAction,
      { ...attackAction, id: "second-attack", label: "Attack again" },
    ]);
    expect(() => activate(state, "protect_the_enemy")).toThrowError(
      expect.objectContaining({ code: "INVALID_RULE" }),
    );
  });
});

describe("registered RuleShift behavior", () => {
  it("reverses prepared controls and blocks an exact repeated action", () => {
    const base = withEvent(initialState("reverse"), "exploration", [
      moveAction,
      {
        ...moveAction,
        destination: "danger",
        effects: [{ amount: -12, type: "player-health" }],
        id: "danger-move",
        label: "Take the dangerous corridor",
      },
    ]);
    const reversed = processTurn(
      activate(base, "reverse_controls"),
      moveAction,
    ).state;
    expect(reversed.player.health).toBeLessThan(base.player.health);

    const repeatedBase = {
      ...base,
      lastAction: moveAction.label,
    };
    const noRepeat = activate(repeatedBase, "no_repeat_action");
    expect(getRuleActionAvailability(noRepeat, moveAction)).toEqual(
      expect.objectContaining({ available: false }),
    );
    expect(() => processTurn(noRepeat, moveAction)).toThrowError(
      expect.objectContaining({ code: "UNAVAILABLE_ACTION" }),
    );
  });

  it("inverts healing and adds idle regeneration without bypassing health bounds", () => {
    const rest: GameAction = {
      available: true,
      effects: [],
      energyCost: 0,
      energyRecovery: 0,
      healthRecovery: 10,
      id: "rest",
      kind: "rest",
      label: "Rest",
      risk: "safe",
    };
    const base = withEvent(
      {
        ...initialState("healing"),
        player: { ...initialState("healing").player, health: 50 },
      },
      "reward",
      [rest, moveAction],
    );
    const harmed = processTurn(activate(base, "healing_hurts"), rest).state;
    expect(harmed.player.health).toBeLessThan(50);

    const potion: InventoryItem = {
      consumable: true,
      description: "A healing item that must obey the active rule.",
      effects: [{ amount: 12, type: "player-health" }],
      id: "rule-potion",
      name: "Rule Potion",
      quantity: 1,
      rarity: "common",
      stackable: true,
      usesPerItem: 1,
      usesRemaining: 1,
    };
    const usePotion: GameAction = {
      available: true,
      effects: [],
      energyCost: 0,
      id: "use-rule-potion",
      itemId: potion.id,
      kind: "use-item",
      label: "Use the Rule Potion",
      risk: "safe",
    };
    const itemBase = withEvent(
      {
        ...base,
        player: { ...base.player, inventory: [potion] },
      },
      "reward",
      [usePotion, moveAction],
    );
    const itemHarmed = processTurn(
      activate(itemBase, "healing_hurts"),
      usePotion,
    ).state;
    expect(itemHarmed.player.health).toBeLessThan(50);
    expect(itemHarmed.player.inventory).toHaveLength(0);

    const idleRest: GameAction = { ...rest, healthRecovery: 0, id: "idle-rest" };
    const idleBase = withEvent(base, "reward", [idleRest, moveAction]);
    const regenerated = processTurn(
      activate(idleBase, "idle_regeneration", {
        parameters: { healing: 8 },
      }),
      idleRest,
    ).state;
    expect(regenerated.player.health).toBe(58);
  });

  it("applies mirrored, weather, compliment, and wrong-answer combat effects", () => {
    const combat = withEvent(initialState("combat-rules"), "combat", [
      attackAction,
      inspectAction,
    ]);
    const baseline = processTurn(combat, attackAction).state;
    const mirrored = processTurn(
      activate(combat, "enemy_mirrors_action", {
        parameters: { reflectionRatio: 0.5 },
      }),
      attackAction,
    ).state;
    expect(mirrored.player.health).toBeLessThan(baseline.player.health);

    const weathered = processTurn(
      activate(combat, "weather_combat", {
        parameters: { bonusDamage: 10, weather: "code-hail" },
      }),
      attackAction,
    ).state;
    expect(weathered.enemies[0].health).toBeLessThan(
      baseline.enemies[0].health,
    );

    const compliment = createCustomAction(
      "compliment",
      "Admire the examiner's brilliant rubric.",
    );
    const plain = createCustomAction(
      "plain",
      "Ask the examiner about the rubric.",
    );
    const complimented = processTurn(
      activate(combat, "compliment_combat", {
        parameters: { damage: 18 },
      }),
      compliment,
    ).state;
    const plainResult = processTurn(combat, plain).state;
    expect(complimented.enemies[0].health).toBeLessThan(
      plainResult.enemies[0].health,
    );

    const wrong = createCustomAction(
      "wrong",
      "Give a spectacularly incorrect O(1) answer.",
    );
    const weaponized = processTurn(
      activate(combat, "wrong_answers_hurt_enemies", {
        parameters: { damage: 24 },
      }),
      wrong,
    ).state;
    expect(weaponized.enemies[0].health).toBeLessThan(
      plainResult.enemies[0].health,
    );
  });

  it("enforces inventory weight, deterministic inventory shuffle, and location shuffle", () => {
    const items = [
      inventoryItem("alpha"),
      inventoryItem("beta"),
      inventoryItem("gamma"),
    ];
    const base = {
      ...initialState("shuffle"),
      player: { ...initialState("shuffle").player, inventory: items },
    };
    const weighted = processTurn(
      activate(base, "inventory_weight_damage", {
        parameters: { damagePerItem: 3, freeWeight: 1 },
      }),
      base.currentEvent.choices[0],
    ).state;
    expect(weighted.player.health).toBeLessThan(base.player.health);

    const firstInventory = processTurn(
      activate(base, "inventory_shuffle"),
      base.currentEvent.choices[0],
    ).state;
    const secondInventory = processTurn(
      activate(base, "inventory_shuffle"),
      base.currentEvent.choices[0],
    ).state;
    expect(firstInventory.player.inventory).toEqual(
      secondInventory.player.inventory,
    );
    expect(
      firstInventory.player.inventory.map((item) => item.id).sort(),
    ).toEqual(items.map((item) => item.id).sort());

    const locationState = withEvent(initialState("locations"), "exploration", [
      moveAction,
      inspectAction,
      { ...moveAction, id: "third-location", label: "Take the third path" },
    ]);
    const firstLocations = activate(locationState, "locations_shuffle");
    const secondLocations = activate(locationState, "locations_shuffle");
    expect(firstLocations.currentEvent.choices).toEqual(
      secondLocations.currentEvent.choices,
    );
    expect(
      firstLocations.currentEvent.choices.map((choice) => choice.id).sort(),
    ).toEqual(
      locationState.currentEvent.choices.map((choice) => choice.id).sort(),
    );
  });

  it("protects the enemy and advances the active objective through safe choices", () => {
    const combat = withEvent(initialState("protect"), "combat", [
      attackAction,
      inspectAction,
    ]);
    const protectedState = activate(combat, "protect_the_enemy", {
      parameters: { objectiveProgress: 9 },
    });
    expect(() => processTurn(protectedState, attackAction)).toThrowError(
      expect.objectContaining({ code: "UNAVAILABLE_ACTION" }),
    );

    const progressed = processTurn(protectedState, inspectAction).state;
    expect(progressed.enemies[0].health).toBe(64);
    expect(progressed.objectives[0].progress).toBe(9);
  });
});
