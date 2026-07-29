import { shuffle } from "@/domain/game/seeded-random";
import {
  allEventTypes,
  allowAction,
  emptyParametersSchema,
  expireCleanly,
  passBeforeAction,
} from "@/domain/rules/definitions/shared";
import type { RuleDefinition } from "@/domain/rules/types";

export const inventoryShuffleRule: RuleDefinition = {
  actionValidation: allowAction,
  activationPredicate: () => true,
  afterAction: (context) => {
    const shuffled = shuffle(
      context.randomState,
      context.state.player.inventory,
    );
    return {
      effects: context.effects,
      randomState: shuffled.state,
      state: {
        ...context.state,
        player: {
          ...context.state.player,
          inventory: shuffled.value,
        },
      },
    };
  },
  beforeAction: passBeforeAction,
  category: "inventory",
  compatibleEventTypes: allEventTypes,
  conflictingRuleKeys: [],
  description: "The inventory order is deterministically shuffled each turn.",
  expirationBehavior: expireCleanly,
  key: "inventory_shuffle",
  maximumDuration: 4,
  name: "Inventory Shuffle",
  parameterSchema: emptyParametersSchema,
  priority: 40,
  uiExplanation:
    "Your items change order after each resolved turn; quantities and uses stay intact.",
};
