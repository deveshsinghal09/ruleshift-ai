import { z } from "zod";
import { consumeInventoryItem } from "@/domain/game/inventory";
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
    multiplier: z.number().finite().min(0.25).max(1).default(1),
  })
  .strict();

export const healingHurtsRule: RuleDefinition = {
  actionValidation: allowAction,
  activationPredicate: () => true,
  afterAction: (context) => {
    const parsed = parameters.parse(context.activeRule.parameters);
    const multiplier = Number(parsed.multiplier);
    const invertHealing = (effect: (typeof context.effects)[number]) =>
      effect.type === "player-health" && effect.amount > 0
        ? {
            ...effect,
            amount: -Math.max(1, Math.round(effect.amount * multiplier)),
          }
        : effect;
    const itemUse = context.effects.find(
      (effect) => effect.type === "inventory-use",
    );
    const usedItem =
      itemUse?.type === "inventory-use"
        ? consumeInventoryItem(
            context.state.player.inventory,
            itemUse.itemId,
          )
        : null;
    const directEffects = context.effects.filter(
      (effect) => effect.type !== "inventory-use",
    );
    return {
      effects: [
        ...directEffects.map(invertHealing),
        ...(usedItem?.effects.map(invertHealing) ?? []),
      ],
      randomState: context.randomState,
      state: usedItem
        ? {
            ...context.state,
            player: {
              ...context.state.player,
              inventory: usedItem.inventory,
            },
          }
        : context.state,
    };
  },
  beforeAction: passBeforeAction,
  category: "survival",
  compatibleEventTypes: allEventTypes,
  conflictingRuleKeys: ["idle_regeneration"],
  description: "Positive health effects become bounded damage.",
  expirationBehavior: expireCleanly,
  key: "healing_hurts",
  maximumDuration: 3,
  name: "Healing Hurts",
  parameterSchema: parameters,
  priority: 80,
  uiExplanation: "Health restoration damages you instead while this rule is active.",
};
