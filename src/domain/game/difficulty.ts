import type { Difficulty } from "@/domain/game/types";

export interface DifficultyRules {
  readonly energyCost: number;
  readonly escapeModifier: number;
  readonly incomingDamage: number;
  readonly initialEnergy: number;
  readonly initialHealth: number;
  readonly outgoingDamage: number;
  readonly score: number;
}

export const difficultyRules: Record<Difficulty, DifficultyRules> = {
  easy: {
    energyCost: 0.8,
    escapeModifier: 0.15,
    incomingDamage: 0.75,
    initialEnergy: 100,
    initialHealth: 100,
    outgoingDamage: 0.9,
    score: 0.8,
  },
  normal: {
    energyCost: 1,
    escapeModifier: 0,
    incomingDamage: 1,
    initialEnergy: 96,
    initialHealth: 94,
    outgoingDamage: 1,
    score: 1,
  },
  hard: {
    energyCost: 1.2,
    escapeModifier: -0.15,
    incomingDamage: 1.35,
    initialEnergy: 85,
    initialHealth: 82,
    outgoingDamage: 1.05,
    score: 1.25,
  },
};

export function applyDifficultyMultiplier(
  value: number,
  multiplier: number,
): number {
  return Math.max(0, Math.round(value * multiplier));
}

export function getActionEnergyCost(
  difficulty: Difficulty,
  baseCost: number,
): number {
  return applyDifficultyMultiplier(
    baseCost,
    difficultyRules[difficulty].energyCost,
  );
}
