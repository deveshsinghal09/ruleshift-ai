import {
  applyDifficultyMultiplier,
  difficultyRules,
} from "@/domain/game/difficulty";
import type { GameAction } from "@/domain/game/types";

const actionScores: Record<GameAction["kind"], number> = {
  "accept-quest": 80,
  "reject-quest": 30,
  "run-away": 35,
  "use-item": 30,
  attack: 70,
  custom: 95,
  defend: 45,
  inspect: 55,
  move: 50,
  rest: 25,
  talk: 60,
};

const riskMultipliers = {
  bold: 1.2,
  safe: 1,
  wild: 1.45,
} as const;

export function calculateActionScore(
  action: GameAction,
  difficulty: keyof typeof difficultyRules,
  critical: boolean,
  escapeSucceeded: boolean,
): number {
  const base =
    actionScores[action.kind] *
    riskMultipliers[action.risk] *
    difficultyRules[difficulty].score;
  const resultBonus = critical ? 40 : escapeSucceeded ? 25 : 0;
  return applyDifficultyMultiplier(base + resultBonus, 1);
}
