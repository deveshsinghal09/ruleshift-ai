import {
  allEventTypes,
  emptyParametersSchema,
  expireCleanly,
  passAfterAction,
  passBeforeAction,
} from "@/domain/rules/definitions/shared";
import type { RuleDefinition } from "@/domain/rules/types";

export const noRepeatActionRule: RuleDefinition = {
  actionValidation: ({ action, state }) =>
    state.lastAction === action.label
      ? {
          allowed: false,
          reason: "No Repeat Action forbids repeating the previous move.",
        }
      : { allowed: true },
  activationPredicate: ({ event, state }) =>
    event.choices.some((choice) => choice.label !== state.lastAction),
  afterAction: passAfterAction,
  beforeAction: passBeforeAction,
  category: "controls",
  compatibleEventTypes: allEventTypes,
  conflictingRuleKeys: [],
  description: "The exact action resolved on the previous turn cannot repeat.",
  expirationBehavior: expireCleanly,
  key: "no_repeat_action",
  maximumDuration: 5,
  name: "No Repeat Action",
  parameterSchema: emptyParametersSchema,
  priority: 100,
  uiExplanation: "You cannot resolve the same labelled move twice in a row.",
};
