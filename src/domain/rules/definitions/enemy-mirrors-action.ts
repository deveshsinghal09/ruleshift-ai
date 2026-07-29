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
    reflectionRatio: z.number().finite().min(0.1).max(0.75).default(0.35),
  })
  .strict();

export const enemyMirrorsActionRule: RuleDefinition = {
  actionValidation: allowAction,
  activationPredicate: ({ state }) =>
    state.enemies.some((enemy) => enemy.status === "active"),
  afterAction: (context) => {
    if (context.action.kind !== "attack" && context.action.kind !== "custom") {
      return {
        effects: context.effects,
        randomState: context.randomState,
        state: context.state,
      };
    }
    const parsed = parameters.parse(context.activeRule.parameters);
    const enemyDamage = context.effects.reduce(
      (total, effect) =>
        effect.type === "enemy-health" && effect.amount < 0
          ? total + Math.abs(effect.amount)
          : total,
      0,
    );
    const reflection = Math.round(enemyDamage * Number(parsed.reflectionRatio));
    return {
      effects:
        reflection > 0
          ? [...context.effects, { amount: -reflection, type: "player-health" }]
          : context.effects,
      randomState: context.randomState,
      state: context.state,
    };
  },
  beforeAction: passBeforeAction,
  category: "combat",
  compatibleEventTypes: ["combat", "puzzle"],
  conflictingRuleKeys: ["protect_the_enemy"],
  description: "Enemy damage reflects a bounded fraction back to the player.",
  expirationBehavior: expireCleanly,
  key: "enemy_mirrors_action",
  maximumDuration: 3,
  name: "Enemy Mirrors Action",
  parameterSchema: parameters,
  priority: 60,
  uiExplanation:
    "Attacking an enemy reflects part of the resolved damage back to you.",
};
