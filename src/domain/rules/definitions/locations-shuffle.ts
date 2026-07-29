import { shuffle } from "@/domain/game/seeded-random";
import {
  allEventTypes,
  allowAction,
  emptyParametersSchema,
  expireCleanly,
  passBeforeAction,
} from "@/domain/rules/definitions/shared";
import type { RuleDefinition } from "@/domain/rules/types";

export const locationsShuffleRule: RuleDefinition = {
  actionValidation: allowAction,
  activationPredicate: ({ event }) => event.choices.length >= 2,
  afterAction: (context) => ({
    effects: context.effects,
    randomState: context.randomState,
    state: context.state,
  }),
  afterEvent: (context) => {
    const shuffled = shuffle(
      context.randomState,
      context.state.currentEvent.choices,
    );
    return {
      randomState: shuffled.state,
      state: {
        ...context.state,
        currentEvent: {
          ...context.state.currentEvent,
          choices: shuffled.value,
        },
      },
    };
  },
  beforeAction: passBeforeAction,
  category: "world",
  compatibleEventTypes: allEventTypes,
  conflictingRuleKeys: ["reverse_controls"],
  description: "The registered choice order shuffles deterministically.",
  expirationBehavior: expireCleanly,
  key: "locations_shuffle",
  maximumDuration: 4,
  name: "Locations Shuffle",
  parameterSchema: emptyParametersSchema,
  priority: 35,
  uiExplanation:
    "Available locations and choices reorder after each turn without changing their effects.",
};
