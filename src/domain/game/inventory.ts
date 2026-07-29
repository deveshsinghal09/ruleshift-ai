import { GameEngineError } from "@/domain/game/errors";
import type { InventoryItem } from "@/domain/game/types";

export interface InventoryUseResult {
  readonly effects: InventoryItem["effects"];
  readonly inventory: readonly InventoryItem[];
  readonly item: InventoryItem;
}

export function addInventoryItem(
  inventory: readonly InventoryItem[],
  item: InventoryItem,
  quantity: number,
): readonly InventoryItem[] {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new GameEngineError(
      "INVALID_ACTION",
      "Inventory quantities must be positive integers.",
    );
  }

  const existingIndex = inventory.findIndex(
    (candidate) => candidate.id === item.id,
  );

  if (existingIndex < 0 || !item.stackable) {
    return [
      ...inventory,
      {
        ...item,
        quantity,
        usesRemaining: item.usesPerItem * quantity,
      },
    ];
  }

  return inventory.map((candidate, index) =>
    index === existingIndex
      ? {
          ...candidate,
          quantity: candidate.quantity + quantity,
          usesRemaining:
            candidate.usesRemaining + candidate.usesPerItem * quantity,
        }
      : candidate,
  );
}

export function removeInventoryItem(
  inventory: readonly InventoryItem[],
  itemId: string,
  quantity: number,
): readonly InventoryItem[] {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new GameEngineError(
      "INVALID_ACTION",
      "Inventory quantities must be positive integers.",
    );
  }

  const item = inventory.find((candidate) => candidate.id === itemId);
  if (!item || item.quantity < quantity) {
    throw new GameEngineError(
      "UNAVAILABLE_ACTION",
      "The requested inventory quantity is unavailable.",
    );
  }

  const remainingQuantity = item.quantity - quantity;
  if (remainingQuantity === 0) {
    return inventory.filter((candidate) => candidate !== item);
  }

  const maximumRemainingUses = item.usesPerItem * remainingQuantity;
  return inventory.map((candidate) =>
    candidate === item
      ? {
          ...candidate,
          quantity: remainingQuantity,
          usesRemaining: Math.min(
            candidate.usesRemaining,
            maximumRemainingUses,
          ),
        }
      : candidate,
  );
}

export function consumeInventoryItem(
  inventory: readonly InventoryItem[],
  itemId: string,
): InventoryUseResult {
  const item = inventory.find((candidate) => candidate.id === itemId);
  if (!item || item.quantity <= 0 || item.usesRemaining <= 0) {
    throw new GameEngineError(
      "UNAVAILABLE_ACTION",
      "That item has no remaining uses.",
    );
  }

  const nextUses = item.usesRemaining - 1;
  const nextQuantity = item.consumable ? item.quantity - 1 : item.quantity;
  const nextInventory =
    nextQuantity === 0
      ? inventory.filter((candidate) => candidate !== item)
      : inventory.map((candidate) =>
          candidate === item
            ? {
                ...candidate,
                quantity: nextQuantity,
                usesRemaining: nextUses,
              }
            : candidate,
        );

  return {
    effects: item.effects,
    inventory: nextInventory,
    item,
  };
}

export function inventoryContains(
  inventory: readonly InventoryItem[],
  itemId: string,
  quantity: number,
): boolean {
  return inventory.some(
    (item) => item.id === itemId && item.quantity >= quantity,
  );
}
