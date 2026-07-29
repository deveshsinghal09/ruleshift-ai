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
    damage: z.number().int().min(1).max(30).default(14),
  })
  .strict();

const complimentPattern =
  /\b(brilliant|clever|excellent|great|impressive|nice|smart|wonderful|compliment|admire)\b/iu;

export const complimentCombatRule: RuleDefinition = {
  actionValidation: allowAction,
  activationPredicate: ({ state }) =>
    state.enemies.some((enemy) => enemy.status === "active"),
  afterAction: (context) => {
    const text =
      context.action.kind === "custom"
        ? context.action.text
        : context.action.label;
    const enemyId = context.state.currentEvent.enemyId;
    if (!enemyId || !complimentPattern.test(text)) {
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
  category: "social",
  compatibleEventTypes: ["combat", "puzzle"],
  conflictingRuleKeys: ["protect_the_enemy"],
  description: "Explicit compliments deal bounded damage to the active enemy.",
  expirationBehavior: expireCleanly,
  key: "compliment_combat",
  maximumDuration: 4,
  name: "Compliment Combat",
  parameterSchema: parameters,
  priority: 55,
  uiExplanation:
    "A clear compliment in a prepared or custom action damages the active enemy.",
};
