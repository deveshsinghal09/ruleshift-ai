import { z } from "zod";
import {
  allowAction,
  expireCleanly,
  passBeforeAction,
} from "@/domain/rules/definitions/shared";
import type {
  RuleDefinition,
  RuleParameters,
} from "@/domain/rules/types";

const parameters: z.ZodType<RuleParameters> = z
  .object({
    damage: z.number().int().min(1).max(40).default(24),
  })
  .strict();

const wrongAnswerPattern =
  /\b(wrong|incorrect|incorrectly|o\(1\)|brute force|spectacularly)\b/iu;

export const wrongAnswersHurtEnemiesRule: RuleDefinition = {
  actionValidation: allowAction,
  activationPredicate: ({ state }) =>
    state.enemies.some((enemy) => enemy.status === "active"),
  afterAction: (context) => {
    const text =
      context.action.kind === "custom"
        ? context.action.text
        : context.action.label;
    const enemyId = context.state.currentEvent.enemyId;
    if (!enemyId || !wrongAnswerPattern.test(text)) {
      return {
        effects: context.effects,
        randomState: context.randomState,
        state: context.state,
      };
    }
    const parsed = parameters.parse(context.activeRule.parameters);
    return {
      effects: [
        ...context.effects,
        {
          amount: -Number(parsed.damage),
          enemyId,
          type: "enemy-health",
        },
      ],
      randomState: context.randomState,
      state: context.state,
    };
  },
  beforeAction: passBeforeAction,
  category: "puzzle",
  compatibleEventTypes: ["combat", "puzzle"],
  conflictingRuleKeys: ["protect_the_enemy"],
  description: "Recognizably wrong answers damage the active enemy.",
  expirationBehavior: expireCleanly,
  key: "wrong_answers_hurt_enemies",
  maximumDuration: 5,
  name: "Incorrectly Correct",
  parameterSchema: parameters,
  priority: 70,
  uiExplanation:
    "Clearly wrong answers deal an additional fixed amount of enemy damage.",
};
