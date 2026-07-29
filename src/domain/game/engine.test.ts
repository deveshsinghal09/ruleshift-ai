import { describe, expect, it } from "vitest";
import {
  createCustomAction,
} from "@/domain/game/actions";
import {
  difficultyRules,
  getActionEnergyCost,
} from "@/domain/game/difficulty";
import {
  createInitialGameState,
  processTurn,
} from "@/domain/game/engine";
import { GameEngineError } from "@/domain/game/errors";
import {
  addInventoryItem,
  consumeInventoryItem,
} from "@/domain/game/inventory";
import {
  DeterministicLocalEventProvider,
  localEventProvider,
} from "@/domain/game/local-event-provider";
import { updateObjectiveProgress } from "@/domain/game/objectives";
import { calculateActionScore } from "@/domain/game/scoring";
import { validateGameState } from "@/domain/game/schemas";
import { nextRandom } from "@/domain/game/seeded-random";
import type {
  GameAction,
  GameState,
  InventoryItem,
  LocalGameEvent,
} from "@/domain/game/types";

const profile = {
  archetype: "Placement Warrior",
  mood: "funny",
  name: "Devesh",
  title: "the Placement Warrior",
} as const;

const actionBase = {
  available: true,
  effects: [],
  energyCost: 5,
  risk: "safe",
} as const;

const fillerAction: GameAction = {
  ...actionBase,
  destination: "fallback-corridor",
  id: "filler-move",
  kind: "move",
  label: "Take the fallback corridor",
};

function initialState(
  seed = "engine-test-seed",
  difficulty: GameState["difficulty"] = "normal",
): GameState {
  return createInitialGameState({
    difficulty,
    profile,
    seed,
    sessionId: `session-${seed}-${difficulty}`,
  });
}

function stateWithEvent(
  action: GameAction,
  options: {
    readonly eventKind?: LocalGameEvent["kind"];
    readonly inventory?: readonly InventoryItem[];
    readonly objectiveStatus?: GameState["objectives"][number]["status"];
    readonly playerEnergy?: number;
    readonly playerHealth?: number;
    readonly randomState?: number;
  } = {},
): GameState {
  const state = initialState();
  const kind = options.eventKind ?? "exploration";
  return {
    ...state,
    currentEvent: {
      badge: "Test event",
      choices: [action, fillerAction],
      dmAside: "A deterministic test event.",
      enemyId:
        kind === "combat" || kind === "puzzle"
          ? "infinite-examiner"
          : undefined,
      id: `test-${kind}`,
      kind,
      narration: "A local test scene with explicit actions.",
      npcId:
        kind === "dialogue" || kind === "quest"
          ? "dean-deferred-dreams"
          : undefined,
      title: "Engine action test",
    },
    objectives: state.objectives.map((objective) => ({
      ...objective,
      status: options.objectiveStatus ?? objective.status,
    })),
    player: {
      ...state.player,
      energy: options.playerEnergy ?? state.player.energy,
      health: options.playerHealth ?? state.player.health,
      inventory: options.inventory ?? state.player.inventory,
    },
    randomState: options.randomState ?? state.randomState,
  };
}

function playVictory(seed = "complete-victory"): GameState {
  let state = initialState(seed);
  state = processTurn(
    state,
    state.currentEvent.choices.find((action) => action.id === "follow-bell")!,
  ).state;
  state = processTurn(
    state,
    state.currentEvent.choices.find(
      (action) => action.id === "binary-search",
    )!,
  ).state;
  state = processTurn(
    state,
    createCustomAction(
      "custom-victory",
      "Convince the rubric that semicolons demonstrate leadership.",
    ),
  ).state;
  return processTurn(
    state,
    state.currentEvent.choices.find((action) => action.id === "open-letter")!,
  ).state;
}

describe("game state validation and immutable processing", () => {
  it("rejects out-of-bounds and non-finite state values", () => {
    const state = initialState();
    const invalidItem: InventoryItem = {
      consumable: true,
      description: "Invalid inventory fixture.",
      effects: [],
      id: "invalid-item",
      name: "Invalid Item",
      quantity: -1,
      rarity: "common",
      stackable: true,
      usesPerItem: 1,
      usesRemaining: -1,
    };
    const invalidStates: readonly unknown[] = [
      {
        ...state,
        player: { ...state.player, health: state.player.maxHealth + 1 },
      },
      {
        ...state,
        player: { ...state.player, energy: state.player.maxEnergy + 1 },
      },
      {
        ...state,
        enemies: state.enemies.map((enemy) => ({
          ...enemy,
          health: enemy.maxHealth + 1,
        })),
      },
      {
        ...state,
        player: { ...state.player, inventory: [invalidItem] },
      },
      { ...state, score: Number.POSITIVE_INFINITY },
      { ...state, world: { ...state.world, stability: 101 } },
      { ...state, version: 2 },
      { ...state, turn: 1 },
    ];

    for (const invalidState of invalidStates) {
      expect(() => validateGameState(invalidState)).toThrow(GameEngineError);
    }
  });

  it("does not mutate the input and freezes the returned state", () => {
    const state = initialState();
    const before = JSON.stringify(state);
    const result = processTurn(state, state.currentEvent.choices[0]);

    expect(JSON.stringify(state)).toBe(before);
    expect(result.state).not.toBe(state);
    expect(Object.isFrozen(result.state)).toBe(true);
    expect(Object.isFrozen(result.state.player)).toBe(true);
    expect(Object.isFrozen(result.state.history)).toBe(true);
  });

  it("rejects duplicate actions and actions after completion", () => {
    const state = initialState();
    const action = state.currentEvent.choices[0];
    const once = processTurn(state, action).state;

    expect(() => processTurn(once, action)).toThrowError(
      expect.objectContaining({ code: "DUPLICATE_ACTION" }),
    );

    const victory = playVictory();
    expect(() =>
      processTurn(victory, createCustomAction("late", "Try one more action")),
    ).toThrowError(expect.objectContaining({ code: "POST_GAME_ACTION" }));
  });

  it("rejects unavailable actions and insufficient energy", () => {
    const unavailable: GameAction = {
      ...fillerAction,
      available: false,
      id: "unavailable",
      unavailableReason: "The path is sealed.",
    };
    expect(() =>
      processTurn(stateWithEvent(unavailable), unavailable),
    ).toThrowError(expect.objectContaining({ code: "UNAVAILABLE_ACTION" }));

    const expensive: GameAction = {
      ...fillerAction,
      energyCost: 80,
      id: "expensive",
    };
    expect(() =>
      processTurn(stateWithEvent(expensive, { playerEnergy: 2 }), expensive),
    ).toThrowError(expect.objectContaining({ code: "INSUFFICIENT_ENERGY" }));
  });

  it("validates custom actions as trimmed plain text up to 300 characters", () => {
    expect(() => createCustomAction("empty", "   ")).toThrowError(
      expect.objectContaining({ code: "INVALID_ACTION" }),
    );
    expect(() => createCustomAction("long", "x".repeat(301))).toThrowError(
      expect.objectContaining({ code: "INVALID_ACTION" }),
    );
    expect(() =>
      createCustomAction("markup", "<script>changeHealth()</script>"),
    ).toThrowError(expect.objectContaining({ code: "INVALID_ACTION" }));
    expect(createCustomAction("limit", "x".repeat(300)).text).toHaveLength(
      300,
    );
  });
});

describe("supported action types", () => {
  it("processes move, attack, defend, talk, and inspect actions", () => {
    const move: GameAction = {
      ...actionBase,
      destination: "archive",
      effects: [{ amount: -3, type: "world-stability" }],
      id: "move-test",
      kind: "move",
      label: "Move into the archive",
    };
    const moved = processTurn(stateWithEvent(move), move).state;
    expect(moved.world.stability).toBe(97);
    expect(moved.statistics.actionsByKind.move).toBe(1);

    const attack: GameAction = {
      ...actionBase,
      baseDamage: 20,
      id: "attack-test",
      kind: "attack",
      label: "Attack the examiner",
      targetId: "infinite-examiner",
    };
    const attacked = processTurn(
      stateWithEvent(attack, { eventKind: "combat" }),
      attack,
    ).state;
    expect(attacked.enemies[0].health).toBeLessThan(64);
    expect(attacked.player.health).toBeLessThan(94);
    expect(attacked.statistics.actionsByKind.attack).toBe(1);

    const defend: GameAction = {
      ...actionBase,
      armor: 18,
      id: "defend-test",
      kind: "defend",
      label: "Defend against the examiner",
    };
    const inspectUnderAttack: GameAction = {
      ...actionBase,
      id: "inspect-under-attack",
      insight: 4,
      kind: "inspect",
      label: "Inspect while exposed",
      targetId: "infinite-examiner",
    };
    const defended = processTurn(
      stateWithEvent(defend, { eventKind: "combat", randomState: 0 }),
      defend,
    ).state;
    const exposed = processTurn(
      stateWithEvent(inspectUnderAttack, {
        eventKind: "combat",
        randomState: 0,
      }),
      inspectUnderAttack,
    ).state;
    expect(defended.statistics.damageTaken).toBeLessThan(
      exposed.statistics.damageTaken,
    );

    const talk: GameAction = {
      ...actionBase,
      id: "talk-test",
      kind: "talk",
      label: "Talk to the dean",
      relationshipChange: 12,
      targetId: "dean-deferred-dreams",
    };
    const talked = processTurn(
      stateWithEvent(talk, { eventKind: "dialogue" }),
      talk,
    ).state;
    expect(talked.npcs[0].relationship).toBe(12);

    const inspect: GameAction = {
      ...actionBase,
      id: "inspect-test",
      insight: 21,
      kind: "inspect",
      label: "Inspect the map",
      targetId: "campus-map",
    };
    const inspected = processTurn(stateWithEvent(inspect), inspect).state;
    expect(inspected.score).toBeGreaterThan(moved.score);
  });

  it("processes item use, quest decisions, rest, escape, and custom actions", () => {
    const potion: InventoryItem = {
      consumable: true,
      description: "Restores twenty health.",
      effects: [{ amount: 20, type: "player-health" }],
      id: "health-potion",
      name: "Health Potion",
      quantity: 2,
      rarity: "common",
      stackable: true,
      usesPerItem: 1,
      usesRemaining: 2,
    };
    const useItem: GameAction = {
      ...actionBase,
      energyCost: 0,
      id: "use-potion",
      itemId: potion.id,
      kind: "use-item",
      label: "Use the health potion",
    };
    const used = processTurn(
      stateWithEvent(useItem, {
        eventKind: "reward",
        inventory: [potion],
        playerHealth: 50,
      }),
      useItem,
    ).state;
    expect(used.player.health).toBe(70);
    expect(used.player.inventory[0]).toMatchObject({
      quantity: 1,
      usesRemaining: 1,
    });

    const accept: GameAction = {
      ...actionBase,
      id: "accept-test",
      kind: "accept-quest",
      label: "Accept the quest",
      objectiveId: "golden-offer",
    };
    const accepted = processTurn(
      stateWithEvent(accept, {
        eventKind: "quest",
        objectiveStatus: "available",
      }),
      accept,
    ).state;
    expect(accepted.objectives[0].status).toBe("active");

    const reject: GameAction = {
      ...actionBase,
      id: "reject-test",
      kind: "reject-quest",
      label: "Reject the quest",
      objectiveId: "golden-offer",
    };
    const rejected = processTurn(
      stateWithEvent(reject, {
        eventKind: "quest",
        objectiveStatus: "available",
      }),
      reject,
    ).state;
    expect(rejected.objectives[0].status).toBe("failed");

    const rest: GameAction = {
      ...actionBase,
      energyCost: 0,
      energyRecovery: 15,
      healthRecovery: 10,
      id: "rest-test",
      kind: "rest",
      label: "Rest safely",
    };
    const rested = processTurn(
      stateWithEvent(rest, {
        eventKind: "reward",
        playerEnergy: 40,
        playerHealth: 50,
      }),
      rest,
    ).state;
    expect(rested.player.health).toBe(60);
    expect(rested.player.energy).toBe(55);

    const custom = createCustomAction(
      "custom-test",
      "  Ask the campus map to explain its invariant.  ",
    );
    const customized = processTurn(stateWithEvent(fillerAction), custom).state;
    expect(custom.label).toBe("Ask the campus map to explain its invariant.");
    expect(customized.statistics.actionsByKind.custom).toBe(1);
    expect(customized.objectives[0].progress).toBeGreaterThan(0);
  });
});

describe("combat, escape, inventory, objectives, scoring, and difficulty", () => {
  it("resolves deterministic escape success and failure", () => {
    const runAway: GameAction = {
      ...actionBase,
      energyCost: 0,
      escapeChance: 0.5,
      id: "run-away-test",
      kind: "run-away",
      label: "Run from the examiner",
      targetId: "infinite-examiner",
    };
    const candidates = Array.from(
      { length: 1_000 },
      (_, index) => (index * 4_000_000) >>> 0,
    );
    const successState = candidates.find(
      (candidate) => nextRandom(candidate).value < 0.5,
    );
    const failureState = candidates.find(
      (candidate) => nextRandom(candidate).value >= 0.5,
    );
    expect(successState).toBeDefined();
    expect(failureState).toBeDefined();

    const escaped = processTurn(
      stateWithEvent(runAway, {
        eventKind: "combat",
        randomState: successState,
      }),
      runAway,
    ).state;
    expect(escaped.enemies[0].status).toBe("escaped");
    expect(escaped.statistics.successfulEscapes).toBe(1);

    const failed = processTurn(
      stateWithEvent(runAway, {
        eventKind: "combat",
        randomState: failureState,
      }),
      runAway,
    ).state;
    expect(failed.enemies[0].status).toBe("active");
    expect(failed.player.health).toBeLessThan(94);
  });

  it("stacks and consumes inventory without negative quantities or uses", () => {
    const item: InventoryItem = {
      consumable: true,
      description: "Restores energy.",
      effects: [{ amount: 5, type: "player-energy" }],
      id: "energy-byte",
      name: "Energy Byte",
      quantity: 1,
      rarity: "common",
      stackable: true,
      usesPerItem: 1,
      usesRemaining: 1,
    };
    const stacked = addInventoryItem([item], item, 2);
    expect(stacked[0]).toMatchObject({ quantity: 3, usesRemaining: 3 });

    const firstUse = consumeInventoryItem(stacked, item.id);
    expect(firstUse.inventory[0]).toMatchObject({
      quantity: 2,
      usesRemaining: 2,
    });
    const secondUse = consumeInventoryItem(firstUse.inventory, item.id);
    const thirdUse = consumeInventoryItem(secondUse.inventory, item.id);
    expect(thirdUse.inventory).toEqual([]);
    expect(() => consumeInventoryItem(thirdUse.inventory, item.id)).toThrow(
      GameEngineError,
    );
  });

  it("caps objective progress and applies scoring and difficulty multipliers", () => {
    const state = initialState();
    const objectives = updateObjectiveProgress(
      state.objectives,
      "golden-offer",
      1_000,
    );
    expect(objectives[0]).toMatchObject({
      progress: 100,
      status: "completed",
    });

    expect(getActionEnergyCost("easy", 10)).toBe(8);
    expect(getActionEnergyCost("hard", 10)).toBe(12);
    expect(difficultyRules.hard.incomingDamage).toBeGreaterThan(
      difficultyRules.easy.incomingDamage,
    );
    expect(
      calculateActionScore(fillerAction, "hard", false, false),
    ).toBeGreaterThan(
      calculateActionScore(fillerAction, "easy", false, false),
    );
  });
});

describe("seeded events and complete sessions", () => {
  it("produces identical turns from the same state, seed, and action", () => {
    const first = initialState("repeatable-seed");
    const second = initialState("repeatable-seed");
    const firstResult = processTurn(first, first.currentEvent.choices[1]);
    const secondResult = processTurn(second, second.currentEvent.choices[1]);

    expect(firstResult).toEqual(secondResult);
  });

  it("supports every local event kind with two-to-four non-repeating choices", () => {
    const provider = new DeterministicLocalEventProvider();
    const kinds = new Set<LocalGameEvent["kind"]>();
    let randomState = 0;
    let previousKind: LocalGameEvent["kind"] = "exploration";
    const base = initialState();
    const genericState: GameState = { ...base, turn: 5 };

    for (let index = 0; index < 200; index += 1) {
      const generated = provider.generateNextEvent({
        previousEventKind: previousKind,
        randomState,
        state: genericState,
      });
      expect(generated.event.kind).not.toBe(previousKind);
      expect(generated.event.choices.length).toBeGreaterThanOrEqual(2);
      expect(generated.event.choices.length).toBeLessThanOrEqual(4);
      kinds.add(generated.event.kind);
      previousKind = generated.event.kind;
      randomState = generated.randomState;
    }

    expect(kinds).toEqual(
      new Set([
        "exploration",
        "dialogue",
        "combat",
        "puzzle",
        "quest",
        "reward",
        "trap",
      ]),
    );

    const scriptedConflict = provider.generateNextEvent({
      previousEventKind: "combat",
      randomState: 0,
      state: { ...base, turn: 1 },
    });
    expect(scriptedConflict.event.kind).not.toBe("combat");
  });

  it("completes a deterministic session to victory", () => {
    const victory = playVictory("victory-route");

    expect(victory.status).toBe("victory");
    expect(victory.player.inventory.map((item) => item.id)).toContain(
      "golden-offer-letter",
    );
    expect(victory.objectives[0].status).toBe("completed");
    expect(victory.statistics.turnsTaken).toBe(4);
  });

  it("completes a deterministic hard session to defeat", () => {
    let state = initialState("defeat-route", "hard");
    state = processTurn(
      state,
      state.currentEvent.choices.find((action) => action.id === "kick-door")!,
      { eventProvider: localEventProvider },
    ).state;
    state = processTurn(
      state,
      state.currentEvent.choices.find(
        (action) => action.id === "binary-search",
      )!,
      { eventProvider: localEventProvider },
    ).state;
    state = processTurn(
      state,
      state.currentEvent.choices.find(
        (action) => action.id === "compliment-complexity",
      )!,
      { eventProvider: localEventProvider },
    ).state;

    expect(state.status).toBe("defeat");
    expect(state.player.health).toBe(0);
    expect(state.objectives[0].status).not.toBe("completed");
  });
});
