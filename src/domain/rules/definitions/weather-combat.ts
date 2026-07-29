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
    bonusDamage: z.number().int().min(1).max(20).default(6),
    weather: z.enum(["arc-lightning", "upward-rain", "code-hail"]).default("arc-lightning"),
  })
  .strict();

export const weatherCombatRule: RuleDefinition = {
  actionValidation: allowAction,
  activationPredicate: ({ state }) =>
    state.enemies.some((enemy) => enemy.status === "active"),
  afterAction: (context) => {
    if (context.action.kind !== "attack") {
      return {
        effects: context.effects,
        randomState: context.randomState,
        state: context.state,
      };
    }
    const parsed = parameters.parse(context.activeRule.parameters);
    const enemyId = context.state.currentEvent.enemyId;
    return {
      effects: enemyId
        ? [
            ...context.effects,
            {
              amount: -Number(parsed.bonusDamage),
              enemyId,
              type: "enemy-health",
            },
          ]
        : context.effects,
      randomState: context.randomState,
      state: context.state,
    };
  },
  beforeAction: passBeforeAction,
  category: "world",
  compatibleEventTypes: ["combat", "puzzle"],
  conflictingRuleKeys: ["protect_the_enemy"],
  description: "Registered weather adds bounded damage to prepared attacks.",
  expirationBehavior: expireCleanly,
  key: "weather_combat",
  maximumDuration: 4,
  name: "Weather Combat",
  parameterSchema: parameters,
  priority: 50,
  uiExplanation: "The named weather adds a small fixed bonus to enemy damage.",
};
