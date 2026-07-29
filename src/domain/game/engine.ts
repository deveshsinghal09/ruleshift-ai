import {
  assertActionAvailable,
  getCanonicalAction,
  resolveAction,
} from "@/domain/game/actions";
import {
  DEFAULT_MAX_TURNS,
  emptyActionCounts,
  GAME_STATE_VERSION,
} from "@/domain/game/constants";
import {
  resolveEnemyRetaliation,
  resolveItemDrops,
} from "@/domain/game/combat";
import {
  difficultyRules,
  getActionEnergyCost,
} from "@/domain/game/difficulty";
import { applyEffects } from "@/domain/game/effects";
import { GameEngineError } from "@/domain/game/errors";
import {
  createInitialLocalEvent,
  localEventProvider,
  questionableResumeItem,
} from "@/domain/game/local-event-provider";
import { evaluateOutcome } from "@/domain/game/outcomes";
import { calculateActionScore } from "@/domain/game/scoring";
import { validateGameState } from "@/domain/game/schemas";
import { hashSeed } from "@/domain/game/seeded-random";
import type {
  CharacterProfile,
  Difficulty,
  Effect,
  GameAction,
  GameHistoryEntry,
  GameState,
  ProcessTurnContext,
  TurnResult,
} from "@/domain/game/types";

export interface CreateInitialGameStateInput {
  readonly difficulty: Difficulty;
  readonly profile: CharacterProfile;
  readonly seed: string;
  readonly sessionId: string;
}

function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nestedValue of Object.values(
      value as Record<string, unknown>,
    )) {
      freezeDeep(nestedValue);
    }
    Object.freeze(value);
  }
  return value;
}

function createHistoryEntry(
  state: GameState,
  action: GameAction,
  effects: readonly Effect[],
  nextState: GameState,
): GameHistoryEntry {
  const title =
    state.currentEvent.id === "campus-gates"
      ? "Entered the assessment wing"
      : state.currentEvent.id === "binary-examiner"
        ? "Binary-search challenge survived"
        : state.currentEvent.id === "incorrect-damage-preview"
          ? nextState.enemies.some(
              (enemy) =>
                enemy.id === "infinite-examiner" &&
                enemy.status === "defeated",
            )
            ? "The examiner failed its own assessment"
            : "The corrupted rubric held"
          : state.currentEvent.id === "golden-offer-event"
            ? nextState.status === "victory"
              ? "Golden Offer Letter claimed"
              : "The final interview continued"
            : action.label;

  const collectedItems = effects
    .filter((effect) => effect.type === "inventory-add")
    .map((effect) => effect.item.name);
  const description =
    collectedItems.length > 0
      ? `${action.label}. Collected ${collectedItems.join(", ")}.`
      : `${action.label}. The deterministic engine resolved the consequences.`;

  return {
    actionId: action.id,
    actionLabel: action.label,
    description,
    effects,
    eventId: state.currentEvent.id,
    id: `history-${state.turn + 1}-${action.id}`,
    kind: state.currentEvent.kind,
    title,
    turn: state.turn + 1,
  };
}

function getRetaliatingEnemy(state: GameState): GameState["enemies"][number] | null {
  if (
    state.currentEvent.kind !== "combat" &&
    state.currentEvent.kind !== "puzzle"
  ) {
    return null;
  }
  return (
    state.enemies.find(
      (enemy) =>
        enemy.id === state.currentEvent.enemyId &&
        enemy.status === "active" &&
        enemy.health > 0,
    ) ?? null
  );
}

export function createInitialGameState(
  input: CreateInitialGameStateInput,
): GameState {
  const rules = difficultyRules[input.difficulty];
  const state: GameState = {
    currentEvent: createInitialLocalEvent(),
    defeatConditions: [
      { type: "player-health-zero" },
      { type: "world-stability-zero" },
      { maximumTurns: DEFAULT_MAX_TURNS, type: "turn-limit" },
    ],
    difficulty: input.difficulty,
    enemies: [
      {
        attackPower: 22,
        description:
          "A recursive invigilator that grows stronger whenever someone says “brute force.”",
        drops: [{ chance: 1, item: questionableResumeItem }],
        health: 64,
        id: "infinite-examiner",
        maxHealth: 64,
        name: "The Infinite Examiner",
        status: "active",
      },
    ],
    history: [],
    lastAction: null,
    npcs: [
      {
        description:
          "A campus spirit who has been trying to graduate since the first compiler.",
        id: "dean-deferred-dreams",
        name: "The Dean of Deferred Dreams",
        relationship: 0,
      },
    ],
    objectives: [
      {
        description:
          "Survive the assessment wing and claim the Golden Offer Letter.",
        id: "golden-offer",
        progress: 0,
        status: "active",
        target: 100,
        title: "Claim the Golden Offer Letter",
      },
    ],
    player: {
      defending: 0,
      energy: rules.initialEnergy,
      health: rules.initialHealth,
      id: "player",
      inventory: [],
      maxEnergy: 100,
      maxHealth: 100,
      profile: input.profile,
    },
    processedActionIds: [],
    randomState: hashSeed(input.seed),
    score: 0,
    seed: input.seed,
    sessionId: input.sessionId,
    statistics: {
      actionsByKind: { ...emptyActionCounts },
      criticalActions: 0,
      damageDealt: 0,
      damageTaken: 0,
      itemsCollected: 0,
      rulesSurvived: 0,
      successfulEscapes: 0,
      turnsTaken: 0,
    },
    status: "playing",
    turn: 0,
    version: GAME_STATE_VERSION,
    victoryConditions: [
      { objectiveId: "golden-offer", type: "objective-completed" },
      {
        itemId: "golden-offer-letter",
        quantity: 1,
        type: "inventory-contains",
      },
    ],
    world: {
      id: "haunted-campus",
      stability: 100,
      title: "Haunted Campus of Infinite Assessments",
    },
  };

  return freezeDeep(validateGameState(state));
}

export function processTurn(
  inputState: GameState,
  submittedAction: GameAction,
  context: ProcessTurnContext = { eventProvider: localEventProvider },
): TurnResult {
  const state = validateGameState(inputState);
  if (state.status !== "playing") {
    throw new GameEngineError(
      "POST_GAME_ACTION",
      "Completed adventures cannot process additional actions.",
    );
  }

  if (state.processedActionIds.includes(submittedAction.id)) {
    throw new GameEngineError(
      "DUPLICATE_ACTION",
      `Action "${submittedAction.id}" has already been processed.`,
    );
  }

  const action = getCanonicalAction(state, submittedAction);
  assertActionAvailable(state, action);
  const energyCost = getActionEnergyCost(
    state.difficulty,
    action.energyCost,
  );
  if (state.player.energy < energyCost) {
    throw new GameEngineError(
      "INSUFFICIENT_ENERGY",
      "The player does not have enough energy for that action.",
    );
  }

  let nextState: GameState = {
    ...state,
    player: { ...state.player, defending: 0 },
  };
  const appliedEffects: Effect[] = [];
  if (energyCost > 0) {
    const energyEffect: Effect = {
      amount: -energyCost,
      type: "player-energy",
    };
    appliedEffects.push(energyEffect);
    nextState = applyEffects(nextState, [energyEffect]);
  }

  const resolution = resolveAction(
    nextState,
    action,
    nextState.randomState,
  );
  appliedEffects.push(...resolution.effects);
  nextState = applyEffects(nextState, resolution.effects);
  let randomState = resolution.randomState;

  for (const previousEnemy of state.enemies) {
    const nextEnemy = nextState.enemies.find(
      (enemy) => enemy.id === previousEnemy.id,
    );
    if (
      previousEnemy.status === "active" &&
      nextEnemy?.status === "defeated"
    ) {
      const drops = resolveItemDrops(nextEnemy, randomState);
      randomState = drops.randomState;
      appliedEffects.push(...drops.effects);
      nextState = applyEffects(nextState, drops.effects);
    }
  }

  const retaliatingEnemy =
    resolution.escapeSucceeded ? null : getRetaliatingEnemy(nextState);
  if (retaliatingEnemy) {
    const retaliation = resolveEnemyRetaliation(
      nextState,
      retaliatingEnemy,
      randomState,
    );
    randomState = retaliation.randomState;
    appliedEffects.push(...retaliation.effects);
    nextState = applyEffects(nextState, retaliation.effects);
  }

  if (nextState.player.defending > 0) {
    const clearDefense: Effect = {
      amount: -nextState.player.defending,
      type: "defend",
    };
    appliedEffects.push(clearDefense);
    nextState = applyEffects(nextState, [clearDefense]);
  }

  const score = calculateActionScore(
    action,
    state.difficulty,
    resolution.critical,
    resolution.escapeSucceeded,
  );
  const scoreEffect: Effect = {
    amount: score,
    reason: "Resolved action",
    type: "score",
  };
  appliedEffects.push(scoreEffect);
  nextState = applyEffects(nextState, [scoreEffect]);

  const turn = state.turn + 1;
  nextState = {
    ...nextState,
    lastAction: action.label,
    processedActionIds: [...state.processedActionIds, action.id],
    randomState,
    statistics: {
      ...nextState.statistics,
      actionsByKind: {
        ...nextState.statistics.actionsByKind,
        [action.kind]: nextState.statistics.actionsByKind[action.kind] + 1,
      },
      criticalActions:
        nextState.statistics.criticalActions +
        (resolution.critical ? 1 : 0),
      successfulEscapes:
        nextState.statistics.successfulEscapes +
        (resolution.escapeSucceeded ? 1 : 0),
      turnsTaken: turn,
    },
    turn,
  };

  nextState = { ...nextState, status: evaluateOutcome(nextState) };
  const historyEntry = createHistoryEntry(
    state,
    action,
    appliedEffects,
    nextState,
  );
  nextState = {
    ...nextState,
    history: [...nextState.history, historyEntry],
  };

  let nextEvent = nextState.currentEvent;
  if (nextState.status === "playing") {
    const generated = context.eventProvider.generateNextEvent({
      previousEventKind: state.currentEvent.kind,
      randomState: nextState.randomState,
      state: nextState,
    });
    nextEvent = generated.event;
    nextState = {
      ...nextState,
      currentEvent: nextEvent,
      randomState: generated.randomState,
    };
  }

  const validatedState = freezeDeep(validateGameState(nextState));
  return freezeDeep({
    effects: [...appliedEffects],
    event: nextEvent,
    state: validatedState,
  });
}
