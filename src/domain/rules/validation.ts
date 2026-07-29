import { z } from "zod";
import { GameEngineError } from "@/domain/game/errors";
import { getRuleDefinition, isRegisteredRuleKey } from "@/domain/rules/registry";
import type {
  ActiveRule,
  RuleActivationProposal,
  RuleParameters,
} from "@/domain/rules/types";

export const MAX_RULE_DURATION = 5;

const identifier = z.string().trim().min(1).max(128);
const safeParameterValue = z.union([
  z.string().trim().min(1).max(120),
  z.number().finite(),
  z.boolean(),
]);
export const ruleParametersSchema: z.ZodType<RuleParameters> = z.record(
  z.string().trim().min(1).max(64),
  safeParameterValue,
);

const activationProposalSchema = z.object({
  duration: z.number().int().min(1).max(MAX_RULE_DURATION),
  id: identifier,
  key: z.string().trim().min(1).max(64),
  parameters: z.unknown(),
});

export const activeRuleSchema: z.ZodType<ActiveRule> = z.object({
  activatedAtTurn: z.number().int().min(0),
  category: z.enum([
    "controls",
    "inventory",
    "combat",
    "survival",
    "world",
    "social",
    "puzzle",
  ]),
  id: identifier,
  key: z.enum([
    "reverse_controls",
    "no_repeat_action",
    "inventory_shuffle",
    "healing_hurts",
    "enemy_mirrors_action",
    "inventory_weight_damage",
    "idle_regeneration",
    "protect_the_enemy",
    "locations_shuffle",
    "weather_combat",
    "compliment_combat",
    "wrong_answers_hurt_enemies",
  ]),
  name: z.string().trim().min(1).max(120),
  parameters: ruleParametersSchema,
  priority: z.number().int().min(0).max(1_000),
  remainingTurns: z.number().int().min(1).max(MAX_RULE_DURATION),
  totalTurns: z.number().int().min(1).max(MAX_RULE_DURATION),
  uiExplanation: z.string().trim().min(1).max(300),
}).superRefine((rule, context) => {
  if (rule.remainingTurns > rule.totalTurns) {
    context.addIssue({
      code: "custom",
      message: "RuleShift remaining duration cannot exceed total duration.",
      path: ["remainingTurns"],
    });
  }
  const definition = getRuleDefinition(rule.key);
  if (
    rule.name !== definition.name ||
    rule.category !== definition.category ||
    rule.priority !== definition.priority ||
    rule.totalTurns > definition.maximumDuration ||
    !definition.parameterSchema.safeParse(rule.parameters).success
  ) {
    context.addIssue({
      code: "custom",
      message: `Active RuleShift "${rule.key}" does not match its registry definition.`,
    });
  }
});

export function validateRuleActivation(
  input: unknown,
): RuleActivationProposal & {
  readonly key: ActiveRule["key"];
  readonly parameters: RuleParameters;
} {
  const proposal = activationProposalSchema.safeParse(input);
  if (!proposal.success) {
    throw new GameEngineError(
      "INVALID_RULE",
      proposal.error.issues[0]?.message ?? "RuleShift proposal is malformed.",
    );
  }
  if (!isRegisteredRuleKey(proposal.data.key)) {
    throw new GameEngineError(
      "INVALID_RULE",
      `RuleShift "${proposal.data.key}" is not registered.`,
    );
  }

  const definition = getRuleDefinition(proposal.data.key);
  if (
    proposal.data.duration > definition.maximumDuration ||
    proposal.data.duration > MAX_RULE_DURATION
  ) {
    throw new GameEngineError(
      "INVALID_RULE",
      `${definition.name} cannot last longer than ${definition.maximumDuration} turns.`,
    );
  }
  const parameters = definition.parameterSchema.safeParse(
    proposal.data.parameters,
  );
  if (!parameters.success) {
    throw new GameEngineError(
      "INVALID_RULE",
      parameters.error.issues[0]?.message ??
        `${definition.name} parameters are malformed.`,
    );
  }

  return {
    ...proposal.data,
    key: proposal.data.key,
    parameters: parameters.data,
  };
}

export function validateActiveRule(input: unknown): ActiveRule {
  const parsed = activeRuleSchema.safeParse(input);
  if (!parsed.success) {
    throw new GameEngineError(
      "INVALID_RULE",
      parsed.error.issues[0]?.message ?? "Active RuleShift is invalid.",
    );
  }
  const definition = getRuleDefinition(parsed.data.key);
  const parameters = definition.parameterSchema.safeParse(
    parsed.data.parameters,
  );
  if (
    !parameters.success ||
    parsed.data.name !== definition.name ||
    parsed.data.category !== definition.category ||
    parsed.data.priority !== definition.priority ||
    parsed.data.totalTurns > definition.maximumDuration
  ) {
    throw new GameEngineError(
      "INVALID_RULE",
      `Active RuleShift "${parsed.data.key}" does not match its registry definition.`,
    );
  }
  return { ...parsed.data, parameters: parameters.data };
}
