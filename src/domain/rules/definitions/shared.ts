import { z } from "zod";
import type {
  RuleActionValidation,
  RuleAfterActionContext,
  RuleAfterActionResult,
  RuleBeforeActionResult,
  RuleDefinition,
  RuleExpirationResult,
  RuleHookContext,
  RuleParameters,
} from "@/domain/rules/types";

export const emptyParametersSchema: z.ZodType<RuleParameters> = z
  .object({})
  .strict();

export function allowAction(): RuleActionValidation {
  return { allowed: true };
}

export function passBeforeAction(
  context: RuleHookContext,
): RuleBeforeActionResult {
  return {
    action: context.action,
    effects: [],
    randomState: context.randomState,
    state: context.state,
  };
}

export function passAfterAction(
  context: RuleAfterActionContext,
): RuleAfterActionResult {
  return {
    effects: context.effects,
    randomState: context.randomState,
    state: context.state,
  };
}

export function expireCleanly({
  activeRule,
  state,
}: Parameters<RuleDefinition["expirationBehavior"]>[0]): RuleExpirationResult {
  return {
    message: `${activeRule.name} expired. Reality returned to its registered baseline.`,
    state,
  };
}

export const allEventTypes = [
  "exploration",
  "dialogue",
  "combat",
  "puzzle",
  "quest",
  "reward",
  "trap",
] as const;
