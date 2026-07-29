import { difficultyRules } from "@/domain/game/difficulty";
import { GameEngineError } from "@/domain/game/errors";
import {
  addInventoryItem,
  consumeInventoryItem,
  removeInventoryItem,
} from "@/domain/game/inventory";
import {
  updateObjectiveProgress,
  updateObjectiveStatus,
} from "@/domain/game/objectives";
import type { Effect, GameState } from "@/domain/game/types";

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function applySingleEffect(state: GameState, effect: Effect): GameState {
  switch (effect.type) {
    case "player-health": {
      const adjustedAmount =
        effect.amount < 0
          ? -Math.round(
              Math.abs(effect.amount) *
                difficultyRules[state.difficulty].incomingDamage,
            )
          : effect.amount;
      const nextHealth = clamp(
        state.player.health + adjustedAmount,
        0,
        state.player.maxHealth,
      );
      return {
        ...state,
        player: { ...state.player, health: nextHealth },
        statistics: {
          ...state.statistics,
          damageTaken:
            state.statistics.damageTaken +
            Math.max(0, state.player.health - nextHealth),
        },
      };
    }
    case "player-energy":
      return {
        ...state,
        player: {
          ...state.player,
          energy: clamp(
            state.player.energy + effect.amount,
            0,
            state.player.maxEnergy,
          ),
        },
      };
    case "enemy-health": {
      const enemy = state.enemies.find(
        (candidate) => candidate.id === effect.enemyId,
      );
      if (!enemy) {
        throw new GameEngineError(
          "INVALID_ACTION",
          `Enemy "${effect.enemyId}" does not exist.`,
        );
      }

      const nextHealth = clamp(
        enemy.health + effect.amount,
        0,
        enemy.maxHealth,
      );
      return {
        ...state,
        enemies: state.enemies.map((candidate) =>
          candidate.id === effect.enemyId
            ? {
                ...candidate,
                health: nextHealth,
                status:
                  nextHealth === 0 ? ("defeated" as const) : candidate.status,
              }
            : candidate,
        ),
        statistics: {
          ...state.statistics,
          damageDealt:
            state.statistics.damageDealt +
            Math.max(0, enemy.health - nextHealth),
        },
      };
    }
    case "enemy-status":
      return {
        ...state,
        enemies: state.enemies.map((enemy) =>
          enemy.id === effect.enemyId
            ? {
                ...enemy,
                health: effect.status === "defeated" ? 0 : enemy.health,
                status: effect.status,
              }
            : enemy,
        ),
      };
    case "world-stability":
      return {
        ...state,
        world: {
          ...state.world,
          stability: clamp(state.world.stability + effect.amount, 0, 100),
        },
      };
    case "npc-relationship": {
      if (!state.npcs.some((npc) => npc.id === effect.npcId)) {
        throw new GameEngineError(
          "INVALID_ACTION",
          `NPC "${effect.npcId}" does not exist.`,
        );
      }

      return {
        ...state,
        npcs: state.npcs.map((npc) =>
          npc.id === effect.npcId
            ? {
                ...npc,
                relationship: clamp(
                  npc.relationship + effect.amount,
                  -100,
                  100,
                ),
              }
            : npc,
        ),
      };
    }
    case "objective-progress":
      return {
        ...state,
        objectives: updateObjectiveProgress(
          state.objectives,
          effect.objectiveId,
          effect.amount,
        ),
      };
    case "objective-status":
      return {
        ...state,
        objectives: updateObjectiveStatus(
          state.objectives,
          effect.objectiveId,
          effect.status,
        ),
      };
    case "score":
      return {
        ...state,
        score: Math.max(0, state.score + effect.amount),
      };
    case "inventory-add": {
      const inventory = addInventoryItem(
        state.player.inventory,
        effect.item,
        effect.quantity,
      );
      return {
        ...state,
        player: { ...state.player, inventory },
        statistics: {
          ...state.statistics,
          itemsCollected: state.statistics.itemsCollected + effect.quantity,
        },
      };
    }
    case "inventory-remove":
      return {
        ...state,
        player: {
          ...state.player,
          inventory: removeInventoryItem(
            state.player.inventory,
            effect.itemId,
            effect.quantity,
          ),
        },
      };
    case "inventory-use": {
      const used = consumeInventoryItem(
        state.player.inventory,
        effect.itemId,
      );
      return applyEffects(
        {
          ...state,
          player: { ...state.player, inventory: used.inventory },
        },
        used.effects,
      );
    }
    case "defend":
      return {
        ...state,
        player: {
          ...state.player,
          defending: Math.max(0, state.player.defending + effect.amount),
        },
      };
  }
}

export function applyEffects(
  state: GameState,
  effects: readonly Effect[],
): GameState {
  return effects.reduce(applySingleEffect, state);
}
