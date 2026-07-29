import { z } from "zod";
import {
  expireCleanly,
  passBeforeAction,
} from "@/domain/rules/definitions/shared";
import type {
  RuleDefinition,
  RuleParameters,
} from "@/domain/rules/types";

const parameters: z.ZodType<RuleParameters> = z
  .object({
    objectiveProgress: z.number().int().min(1).max(20).default(8),
  })
  .strict();

function damagesEnemy(kind: string): boolean {
  return kind === "attack" || kind === "custom";
}

export const protectTheEnemyRule: RuleDefinition = {
  actionValidation: ({ action, state }) =>
    damagesEnemy(action.kind) &&
    (state.currentEvent.kind === "combat" ||
      state.currentEvent.kind === "puzzle")
      ? {
          allowed: false,
          reason: "Protect the Enemy forbids damaging the active enemy.",
        }
      : { allowed: true },
  activationPredicate: ({ event }) =>
    event.choices.some((choice) => !damagesEnemy(choice.kind)),
  afterAction: (context) => {
    const parsed = parameters.parse(context.activeRule.parameters);
    const objective = context.state.objectives.find(
      (candidate) => candidate.status === "active",
    );
    return {
      effects:
        objective && !damagesEnemy(context.action.kind)
          ? [
              ...context.effects,
              {
                amount: Number(parsed.objectiveProgress),
                objectiveId: objective.id,
                type: "objective-progress",
              },
            ]
          : context.effects,
      randomState: context.randomState,
      state: context.state,
    };
  },
  beforeAction: passBeforeAction,
  category: "combat",
  compatibleEventTypes: ["combat", "puzzle"],
  conflictingRuleKeys: [
    "enemy_mirrors_action",
    "weather_combat",
    "compliment_combat",
    "wrong_answers_hurt_enemies",
  ],
  description:
    "Damaging the active enemy is forbidden; non-damaging actions advance the objective.",
  expirationBehavior: expireCleanly,
  key: "protect_the_enemy",
  maximumDuration: 3,
  name: "Protect the Enemy",
  parameterSchema: parameters,
  priority: 120,
  uiExplanation:
    "Keep the enemy alive. Non-damaging actions advance the active objective.",
};
