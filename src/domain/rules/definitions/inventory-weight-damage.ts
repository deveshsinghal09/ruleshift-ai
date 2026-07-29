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
    damagePerItem: z.number().int().min(1).max(5).default(2),
    freeWeight: z.number().int().min(0).max(5).default(1),
  })
  .strict();

export const inventoryWeightDamageRule: RuleDefinition = {
  actionValidation: allowAction,
  activationPredicate: () => true,
  afterAction: (context) => {
    const parsed = parameters.parse(context.activeRule.parameters);
    const quantity = context.state.player.inventory.reduce(
      (total, item) => total + item.quantity,
      0,
    );
    const overload = Math.max(0, quantity - Number(parsed.freeWeight));
    const damage = Math.min(20, overload * Number(parsed.damagePerItem));
    return {
      effects:
        damage > 0
          ? [...context.effects, { amount: -damage, type: "player-health" }]
          : context.effects,
      randomState: context.randomState,
      state: context.state,
    };
  },
  beforeAction: passBeforeAction,
  category: "inventory",
  compatibleEventTypes: allEventTypes,
  conflictingRuleKeys: [],
  description: "Carrying items above a safe allowance causes bounded damage.",
  expirationBehavior: expireCleanly,
  key: "inventory_weight_damage",
  maximumDuration: 4,
  name: "Inventory Weight Damage",
  parameterSchema: parameters,
  priority: 45,
  uiExplanation:
    "Items beyond the free carrying allowance deal limited damage after a turn.",
};
