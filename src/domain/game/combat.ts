import {
  applyDifficultyMultiplier,
  difficultyRules,
} from "@/domain/game/difficulty";
import { GameEngineError } from "@/domain/game/errors";
import {
  randomChance,
  randomInt,
} from "@/domain/game/seeded-random";
import type {
  AttackAction,
  Effect,
  Enemy,
  GameState,
  RunAwayAction,
} from "@/domain/game/types";

export interface AttackResolution {
  readonly critical: boolean;
  readonly effects: readonly Effect[];
  readonly randomState: number;
}

export interface EscapeResolution {
  readonly effects: readonly Effect[];
  readonly randomState: number;
  readonly succeeded: boolean;
}

export interface DropResolution {
  readonly effects: readonly Effect[];
  readonly randomState: number;
}

function getActiveEnemy(state: GameState, enemyId: string): Enemy {
  const enemy = state.enemies.find((candidate) => candidate.id === enemyId);
  if (!enemy || enemy.status !== "active" || enemy.health <= 0) {
    throw new GameEngineError(
      "UNAVAILABLE_ACTION",
      "That enemy is no longer available.",
    );
  }
  return enemy;
}

export function resolveAttack(
  state: GameState,
  action: AttackAction,
  randomState: number,
): AttackResolution {
  getActiveEnemy(state, action.targetId);
  const variation = randomInt(randomState, -3, 4);
  const criticalChance =
    action.risk === "wild" ? 0.25 : action.risk === "bold" ? 0.16 : 0.08;
  const critical = randomChance(variation.state, criticalChance);
  const variedDamage = Math.max(1, action.baseDamage + variation.value);
  const difficultyDamage = applyDifficultyMultiplier(
    variedDamage,
    difficultyRules[state.difficulty].outgoingDamage,
  );
  const damage = critical.value
    ? Math.max(1, Math.round(difficultyDamage * 1.75))
    : difficultyDamage;

  return {
    critical: critical.value,
    effects: [
      {
        amount: -damage,
        enemyId: action.targetId,
        type: "enemy-health",
      },
    ],
    randomState: critical.state,
  };
}

export function resolveEnemyRetaliation(
  state: GameState,
  enemy: Enemy,
  randomState: number,
): {
  readonly effects: readonly Effect[];
  readonly randomState: number;
} {
  const variation = randomInt(randomState, -2, 3);
  const rawDamage = Math.max(1, enemy.attackPower + variation.value);
  const blocked = Math.min(rawDamage, state.player.defending);
  const damage = Math.max(0, rawDamage - blocked);
  const effects: Effect[] = [];

  if (damage > 0) {
    effects.push({ amount: -damage, type: "player-health" });
  }
  if (state.player.defending > 0) {
    effects.push({ amount: -state.player.defending, type: "defend" });
  }

  return { effects, randomState: variation.state };
}

export function resolveEscape(
  state: GameState,
  action: RunAwayAction,
  randomState: number,
): EscapeResolution {
  getActiveEnemy(state, action.targetId);
  const chance = Math.max(
    0.05,
    Math.min(
      0.95,
      action.escapeChance + difficultyRules[state.difficulty].escapeModifier,
    ),
  );
  const result = randomChance(randomState, chance);

  return {
    effects: result.value
      ? [
          {
            enemyId: action.targetId,
            status: "escaped",
            type: "enemy-status",
          },
        ]
      : [],
    randomState: result.state,
    succeeded: result.value,
  };
}

export function resolveItemDrops(
  enemy: Enemy,
  randomState: number,
): DropResolution {
  const effects: Effect[] = [];
  let nextState = randomState;

  for (const drop of enemy.drops) {
    const result = randomChance(nextState, drop.chance);
    nextState = result.state;
    if (result.value) {
      effects.push({
        item: drop.item,
        quantity: 1,
        type: "inventory-add",
      });
    }
  }

  return { effects, randomState: nextState };
}
