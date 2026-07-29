import { z } from "zod";
import { registeredRuleKeys } from "@/domain/rules/registry";

const compactText = (maximum: number) =>
  z.string().trim().min(1).max(maximum);

export const aiTaskSchema = z.enum([
  "world",
  "event",
  "memory",
  "final-summary",
]);
export type AiTask = z.infer<typeof aiTaskSchema>;

export const proposedEffectSchema = z
  .object({
    intensity: z.enum(["minor", "moderate", "major"]),
    kind: z.enum([
      "damage_player",
      "restore_player",
      "restore_energy",
      "damage_enemy",
      "progress_objective",
      "improve_relationship",
      "destabilize_world",
    ]),
  })
  .strict();
export type ProposedEffect = z.infer<typeof proposedEffectSchema>;

export const choiceProposalSchema = z
  .object({
    effects: z.array(proposedEffectSchema).max(2),
    kind: z.enum([
      "move",
      "attack",
      "defend",
      "talk",
      "inspect",
      "rest",
      "run-away",
    ]),
    label: compactText(140),
    risk: z.enum(["safe", "bold", "wild"]),
  })
  .strict();
export type ChoiceProposal = z.infer<typeof choiceProposalSchema>;

export const ruleProposalSchema = z
  .object({
    key: z.enum(registeredRuleKeys as [string, ...string[]]),
  })
  .strict();
export type RuleProposal = z.infer<typeof ruleProposalSchema>;

export const itemProposalSchema = z
  .object({
    description: compactText(280),
    name: compactText(80),
    rarity: z.enum(["common", "rare", "legendary"]),
  })
  .strict();
export type ItemProposal = z.infer<typeof itemProposalSchema>;

export const worldGenerationSchema = z
  .object({
    description: compactText(600),
    objectiveDescription: compactText(280),
    objectiveTitle: compactText(120),
    openingNarration: compactText(800),
    title: compactText(120),
  })
  .strict();
export type WorldGeneration = z.infer<typeof worldGenerationSchema>;

export const eventGenerationSchema = z
  .object({
    badge: compactText(48),
    choices: z.array(choiceProposalSchema).min(2).max(4),
    dmAside: compactText(280),
    item: itemProposalSchema.nullable(),
    kind: z.enum([
      "exploration",
      "dialogue",
      "combat",
      "puzzle",
      "quest",
      "reward",
      "trap",
    ]),
    narration: compactText(800),
    rule: ruleProposalSchema.nullable(),
    title: compactText(140),
  })
  .strict();
export type EventGeneration = z.infer<typeof eventGenerationSchema>;

export const memoryUpdateSchema = z
  .object({
    summary: compactText(800),
  })
  .strict();
export type MemoryUpdate = z.infer<typeof memoryUpdateSchema>;

export const finalSummarySchema = z
  .object({
    mostCreativeAction: compactText(180),
    summary: compactText(800),
    title: compactText(140),
  })
  .strict();
export type FinalSummary = z.infer<typeof finalSummarySchema>;

export const aiEventRequestSchema = z
  .object({
    action: z.unknown(),
    state: z.unknown(),
  })
  .strict();

export const aiEventResponseSchema = z
  .object({
    event: z.unknown(),
    source: z.enum(["provider", "fallback"]),
    userMessage: compactText(240).nullable(),
  })
  .strict();

export const outputSchemas = {
  event: eventGenerationSchema,
  "final-summary": finalSummarySchema,
  memory: memoryUpdateSchema,
  world: worldGenerationSchema,
} as const satisfies Readonly<Record<AiTask, z.ZodType>>;
