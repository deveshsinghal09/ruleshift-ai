import {
  CUSTOM_ACTION_ENERGY_COST,
  CUSTOM_ACTION_MAX_LENGTH,
} from "@/domain/game/constants";
import {
  resolveAttack,
  resolveEscape,
} from "@/domain/game/combat";
import { GameEngineError } from "@/domain/game/errors";
import {
  customActionTextSchema,
  validateGameAction,
} from "@/domain/game/schemas";
import type {
  CustomAction,
  Effect,
  GameAction,
  GameState,
} from "@/domain/game/types";

export interface ActionResolution {
  readonly critical: boolean;
  readonly effects: readonly Effect[];
  readonly escapeSucceeded: boolean;
  readonly randomState: number;
}

export function createCustomAction(id: string, text: string): CustomAction {
  const parsedText = customActionTextSchema.safeParse(text);
  if (!parsedText.success) {
    throw new GameEngineError(
      "INVALID_ACTION",
      parsedText.error.issues[0]?.message ??
        `Custom actions must be at most ${CUSTOM_ACTION_MAX_LENGTH} characters.`,
    );
  }

  return {
    available: true,
    effects: [],
    energyCost: CUSTOM_ACTION_ENERGY_COST,
    id,
    kind: "custom",
    label: parsedText.data,
    risk: "bold",
    text: parsedText.data,
  };
}

export function getCanonicalAction(
  state: GameState,
  submittedAction: GameAction,
): GameAction {
  const parsedAction = validateGameAction(submittedAction);
  if (parsedAction.kind === "custom") {
    return parsedAction;
  }

  const canonicalAction = state.currentEvent.choices.find(
    (choice) => choice.id === parsedAction.id,
  );
  if (!canonicalAction) {
    throw new GameEngineError(
      "UNAVAILABLE_ACTION",
      "That action is not available in the current event.",
    );
  }
  return canonicalAction;
}

export function assertActionAvailable(
  state: GameState,
  action: GameAction,
): void {
  if (!action.available) {
    throw new GameEngineError(
      "UNAVAILABLE_ACTION",
      action.unavailableReason ?? "That action is currently unavailable.",
    );
  }

  if (action.kind === "use-item") {
    const item = state.player.inventory.find(
      (candidate) => candidate.id === action.itemId,
    );
    if (!item || item.quantity <= 0 || item.usesRemaining <= 0) {
      throw new GameEngineError(
        "UNAVAILABLE_ACTION",
        "That item is not available.",
      );
    }
  }

  if (
    action.kind === "accept-quest" ||
    action.kind === "reject-quest"
  ) {
    const objective = state.objectives.find(
      (candidate) => candidate.id === action.objectiveId,
    );
    if (
      !objective ||
      objective.status === "completed" ||
      objective.status === "failed"
    ) {
      throw new GameEngineError(
        "UNAVAILABLE_ACTION",
        "That quest can no longer be changed.",
      );
    }
  }
}

function getCustomEffects(state: GameState): readonly Effect[] {
  const objective = state.objectives.find(
    (candidate) => candidate.status !== "completed",
  );
  const activeEnemy = state.enemies.find(
    (enemy) =>
      enemy.id === state.currentEvent.enemyId && enemy.status === "active",
  );
  const effects: Effect[] = [];

  if (
    activeEnemy &&
    (state.currentEvent.kind === "combat" ||
      state.currentEvent.kind === "puzzle")
  ) {
    effects.push({
      amount: 28,
      objectiveId: objective?.id ?? state.objectives[0].id,
      type: "objective-progress",
    });
  } else if (state.currentEvent.kind === "trap") {
    effects.push(
      { amount: -12, type: "player-health" },
      { amount: -4, type: "world-stability" },
    );
  } else if (
    state.currentEvent.kind === "dialogue" ||
    state.currentEvent.kind === "quest"
  ) {
    const npc = state.npcs.find(
      (candidate) => candidate.id === state.currentEvent.npcId,
    );
    if (npc) {
      effects.push({
        amount: 8,
        npcId: npc.id,
        type: "npc-relationship",
      });
    }
    if (objective) {
      effects.push({
        amount: 15,
        objectiveId: objective.id,
        type: "objective-progress",
      });
    }
  } else if (objective) {
    effects.push({
      amount: state.currentEvent.kind === "reward" ? 25 : 15,
      objectiveId: objective.id,
      type: "objective-progress",
    });
  }

  return effects;
}

export function resolveAction(
  state: GameState,
  action: GameAction,
  randomState: number,
): ActionResolution {
  let effects: readonly Effect[] = action.effects;
  let nextRandomState = randomState;
  let critical = false;
  let escapeSucceeded = false;

  switch (action.kind) {
    case "attack": {
      const attack = resolveAttack(state, action, nextRandomState);
      effects = [...attack.effects, ...effects];
      nextRandomState = attack.randomState;
      critical = attack.critical;
      break;
    }
    case "defend":
      effects = [{ amount: action.armor, type: "defend" }, ...effects];
      break;
    case "talk":
      if (state.npcs.some((npc) => npc.id === action.targetId)) {
        effects = [
          {
            amount: action.relationshipChange,
            npcId: action.targetId,
            type: "npc-relationship",
          },
          ...effects,
        ];
      }
      break;
    case "inspect":
      effects = [
        {
          amount: action.insight,
          reason: "Careful inspection",
          type: "score",
        },
        ...effects,
      ];
      break;
    case "use-item":
      effects = [{ itemId: action.itemId, type: "inventory-use" }, ...effects];
      break;
    case "accept-quest":
      effects = [
        {
          objectiveId: action.objectiveId,
          status: "active",
          type: "objective-status",
        },
        ...effects,
      ];
      break;
    case "reject-quest":
      effects = [
        {
          objectiveId: action.objectiveId,
          status: "failed",
          type: "objective-status",
        },
        ...effects,
      ];
      break;
    case "rest":
      effects = [
        { amount: action.healthRecovery, type: "player-health" },
        { amount: action.energyRecovery, type: "player-energy" },
        ...effects,
      ];
      break;
    case "run-away": {
      const escape = resolveEscape(state, action, nextRandomState);
      effects = [...escape.effects, ...effects];
      nextRandomState = escape.randomState;
      escapeSucceeded = escape.succeeded;
      break;
    }
    case "custom": {
      const activeEnemy = state.enemies.find(
        (enemy) =>
          enemy.id === state.currentEvent.enemyId &&
          enemy.status === "active",
      );
      if (
        activeEnemy &&
        (state.currentEvent.kind === "combat" ||
          state.currentEvent.kind === "puzzle")
      ) {
        const attack = resolveAttack(
          state,
          {
            ...action,
            baseDamage: 38,
            kind: "attack",
            targetId: activeEnemy.id,
          },
          nextRandomState,
        );
        effects = [...attack.effects, ...getCustomEffects(state), ...effects];
        nextRandomState = attack.randomState;
        critical = attack.critical;
      } else {
        effects = [...getCustomEffects(state), ...effects];
      }
      break;
    }
    case "move":
      break;
  }

  return {
    critical,
    effects,
    escapeSucceeded,
    randomState: nextRandomState,
  };
}
