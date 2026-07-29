import { z } from "zod";

export const difficultySchema = z.enum(["easy", "normal", "hard"]);

export const moodSchema = z.enum([
  "fantasy",
  "mysterious",
  "chaotic",
  "funny",
  "horror",
  "wholesome",
  "scifi",
]);

export const characterPassportSchema = z.object({
  archetype: z.string().trim().min(2).max(48),
  difficulty: difficultySchema,
  mood: moodSchema,
  name: z
    .string()
    .trim()
    .min(2, "Enter at least two characters.")
    .max(32, "Keep the name under 32 characters."),
  title: z
    .string()
    .trim()
    .min(2, "Give your character a short title.")
    .max(56, "Keep the title under 56 characters."),
});

const inventoryItemSchema = z.object({
  description: z.string(),
  id: z.string(),
  name: z.string(),
  rarity: z.enum(["common", "rare", "legendary"]),
});

const activeRuleSchema = z.object({
  description: z.string(),
  id: z.string(),
  name: z.string(),
  remainingTurns: z.number().int().min(0),
  totalTurns: z.number().int().positive(),
});

const gameEventSchema = z.object({
  description: z.string(),
  id: z.string(),
  title: z.string(),
  tone: z.enum([
    "exploration",
    "encounter",
    "ruleshift",
    "reward",
    "objective",
  ]),
  turn: z.number().int().min(0),
});

export const mockGameStateSchema = z.object({
  activeRule: activeRuleSchema.nullable(),
  character: characterPassportSchema,
  energy: z.number().min(0).max(100),
  health: z.number().min(0).max(100),
  inventory: z.array(inventoryItemSchema),
  lastAction: z.string().nullable(),
  objective: z.string(),
  objectiveProgress: z.number().min(0).max(100),
  processedRequestIds: z.array(z.string()),
  rulesSurvived: z.number().int().min(0),
  score: z.number().min(0),
  sessionId: z.string().min(1),
  showRuleShift: z.boolean(),
  status: z.enum(["playing", "victory", "defeat"]),
  timeline: z.array(gameEventSchema),
  turnIndex: z.number().int().min(0).max(3),
  turnsTaken: z.number().int().min(0),
  worldTitle: z.string(),
});

export type CharacterPassportInput = z.input<typeof characterPassportSchema>;
