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

export type CharacterPassportInput = z.input<typeof characterPassportSchema>;
