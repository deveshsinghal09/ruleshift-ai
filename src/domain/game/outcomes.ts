import { inventoryContains } from "@/domain/game/inventory";
import type { GameState, GameStatus } from "@/domain/game/types";

function hasDefeatCondition(state: GameState): boolean {
  return state.defeatConditions.some((condition) => {
    switch (condition.type) {
      case "player-health-zero":
        return state.player.health <= 0;
      case "world-stability-zero":
        return state.world.stability <= 0;
      case "turn-limit":
        return state.turn >= condition.maximumTurns;
    }
  });
}

function hasVictoryConditions(state: GameState): boolean {
  return state.victoryConditions.every((condition) => {
    switch (condition.type) {
      case "objective-completed":
        return state.objectives.some(
          (objective) =>
            objective.id === condition.objectiveId &&
            objective.status === "completed",
        );
      case "inventory-contains":
        return inventoryContains(
          state.player.inventory,
          condition.itemId,
          condition.quantity,
        );
    }
  });
}

export function evaluateOutcome(state: GameState): GameStatus {
  if (hasDefeatCondition(state)) {
    return "defeat";
  }
  if (hasVictoryConditions(state)) {
    return "victory";
  }
  return "playing";
}
