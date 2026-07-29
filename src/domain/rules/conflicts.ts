import type {
  ActiveRule,
  RuleDefinition,
  RuleKey,
} from "@/domain/rules/types";
import { ruleShiftRegistry } from "@/domain/rules/registry";

export type ConflictPolicy = "accept" | "reject" | "replace";

export interface ConflictResolution {
  readonly conflictingRule?: ActiveRule;
  readonly policy: ConflictPolicy;
}

export const ruleConflictMatrix: Readonly<
  Record<RuleKey, readonly RuleKey[]>
> = Object.freeze(
  Object.fromEntries(
    Object.entries(ruleShiftRegistry).map(([key, definition]) => [
      key,
      Object.freeze([...definition.conflictingRuleKeys]),
    ]),
  ) as Record<RuleKey, readonly RuleKey[]>,
);

function conflictsWith(
  definition: RuleDefinition,
  activeRule: ActiveRule,
): boolean {
  return (
    definition.conflictingRuleKeys.includes(activeRule.key) ||
    ruleConflictMatrix[activeRule.key].includes(definition.key)
  );
}

export function resolveRuleConflict(
  definition: RuleDefinition,
  activeRules: readonly ActiveRule[],
): ConflictResolution {
  const sameRule = activeRules.find((rule) => rule.key === definition.key);
  if (sameRule) {
    return { conflictingRule: sameRule, policy: "replace" };
  }

  const conflict = [...activeRules]
    .filter((rule) => conflictsWith(definition, rule))
    .sort(
      (left, right) =>
        right.priority - left.priority || left.key.localeCompare(right.key),
    )[0];

  if (!conflict) {
    return { policy: "accept" };
  }

  return definition.priority > conflict.priority
    ? { conflictingRule: conflict, policy: "replace" }
    : { conflictingRule: conflict, policy: "reject" };
}
