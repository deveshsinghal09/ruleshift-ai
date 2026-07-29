import {
  allEventTypes,
  allowAction,
  emptyParametersSchema,
  expireCleanly,
  passAfterAction,
} from "@/domain/rules/definitions/shared";
import type { RuleDefinition } from "@/domain/rules/types";

export const reverseControlsRule: RuleDefinition = {
  actionValidation: allowAction,
  activationPredicate: ({ event }) => event.choices.length >= 2,
  afterAction: passAfterAction,
  beforeAction: (context) => {
    if (context.action.kind === "custom") {
      return {
        action: context.action,
        effects: [],
        randomState: context.randomState,
        state: context.state,
      };
    }
    const choices = context.state.currentEvent.choices;
    const index = choices.findIndex((choice) => choice.id === context.action.id);
    const mirrored = index < 0 ? context.action : choices[choices.length - 1 - index];
    return {
      action: mirrored,
      effects: [],
      randomState: context.randomState,
      state: context.state,
    };
  },
  category: "controls",
  compatibleEventTypes: allEventTypes,
  conflictingRuleKeys: ["locations_shuffle"],
  description:
    "Prepared controls resolve from the opposite end of the visible choice list.",
  expirationBehavior: expireCleanly,
  key: "reverse_controls",
  maximumDuration: 3,
  name: "Reverse Controls",
  parameterSchema: emptyParametersSchema,
  priority: 90,
  uiExplanation:
    "Prepared choices resolve as their mirrored option. Custom actions remain unchanged.",
};
