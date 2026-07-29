import { z } from "zod";
import {
  allEventTypes,
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
    healing: z.number().int().min(1).max(20).default(8),
  })
  .strict();

export const idleRegenerationRule: RuleDefinition = {
  actionValidation: allowAction,
  activationPredicate: () => true,
  afterAction: (context) => {
    const isIdle =
      context.action.kind === "rest" || context.action.kind === "defend";
    const parsed = parameters.parse(context.activeRule.parameters);
    return {
      effects: isIdle
        ? [
            ...context.effects,
            { amount: Number(parsed.healing), type: "player-health" },
          ]
        : context.effects,
      randomState: context.randomState,
      state: context.state,
    };
  },
  beforeAction: passBeforeAction,
  category: "survival",
  compatibleEventTypes: allEventTypes,
  conflictingRuleKeys: ["healing_hurts"],
  description: "Defensive or resting turns restore a bounded amount of health.",
  expirationBehavior: expireCleanly,
  key: "idle_regeneration",
  maximumDuration: 5,
  name: "Idle Regeneration",
  parameterSchema: parameters,
  priority: 30,
  uiExplanation: "Defending or resting restores health after the action resolves.",
};
