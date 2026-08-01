import type { GameState } from "@/domain/game/types";

export type ResolutionTone =
  | "danger"
  | "exploration"
  | "neutral"
  | "ruleshift"
  | "success"
  | "warning";

export interface ResolutionChange {
  readonly label: string;
  readonly tone: ResolutionTone;
  readonly value: string;
}

export interface ResolutionRule {
  readonly explanation: string;
  readonly name: string;
  readonly status: "activated" | "evaluated" | "expired";
}

export interface TurnResolutionReceipt {
  readonly actionLabel: string;
  readonly changes: readonly ResolutionChange[];
  readonly creativeSource: "ai-provider" | "deterministic-fallback";
  readonly rules: readonly ResolutionRule[];
  readonly turn: number;
}

function signed(value: number): string {
  return `${value > 0 ? "+" : ""}${value}`;
}

function addNumericChange(
  changes: ResolutionChange[],
  label: string,
  difference: number,
  positiveTone: ResolutionTone,
  negativeTone: ResolutionTone,
): void {
  if (difference === 0) {
    return;
  }
  changes.push({
    label,
    tone: difference > 0 ? positiveTone : negativeTone,
    value: signed(difference),
  });
}

export function buildTurnResolutionReceipt(
  before: GameState,
  after: GameState,
): TurnResolutionReceipt {
  const changes: ResolutionChange[] = [];
  addNumericChange(
    changes,
    "Health",
    after.player.health - before.player.health,
    "success",
    "danger",
  );
  addNumericChange(
    changes,
    "Energy",
    after.player.energy - before.player.energy,
    "exploration",
    "warning",
  );
  addNumericChange(
    changes,
    "Score",
    after.score - before.score,
    "success",
    "danger",
  );

  for (const objective of after.objectives) {
    const previous = before.objectives.find((item) => item.id === objective.id);
    if (previous) {
      addNumericChange(
        changes,
        "Objective",
        objective.progress - previous.progress,
        "success",
        "danger",
      );
    }
  }

  for (const enemy of after.enemies) {
    const previous = before.enemies.find((item) => item.id === enemy.id);
    if (previous) {
      const damage = previous.health - enemy.health;
      if (damage > 0) {
        changes.push({
          label: `${enemy.name} health`,
          tone: "success",
          value: `-${damage}`,
        });
      }
    }
  }

  for (const item of after.player.inventory) {
    const previousQuantity =
      before.player.inventory.find((candidate) => candidate.id === item.id)
        ?.quantity ?? 0;
    const gained = item.quantity - previousQuantity;
    if (gained > 0) {
      changes.push({
        label: "Item collected",
        tone: "success",
        value: `${item.name} x${gained}`,
      });
    }
  }

  if (changes.length === 0) {
    changes.push({
      label: "World state",
      tone: "neutral",
      value: "Advanced safely",
    });
  }

  const rules: ResolutionRule[] = before.activeRules.map((rule) => {
    const remainsActive = after.activeRules.some(
      (candidate) => candidate.id === rule.id,
    );
    return {
      explanation: rule.uiExplanation,
      name: rule.name,
      status: remainsActive ? "evaluated" : "expired",
    };
  });

  for (const rule of after.activeRules) {
    if (!before.activeRules.some((candidate) => candidate.id === rule.id)) {
      rules.push({
        explanation:
          "Registered now; its full duration is retained until the next turn.",
        name: rule.name,
        status: "activated",
      });
    }
  }

  const historyEntry = after.history.at(-1);
  return {
    actionLabel: historyEntry?.actionLabel ?? after.lastAction ?? "Custom action",
    changes,
    creativeSource: after.currentEvent.id.startsWith("ai-event-")
      ? "ai-provider"
      : "deterministic-fallback",
    rules,
    turn: after.turn,
  };
}
