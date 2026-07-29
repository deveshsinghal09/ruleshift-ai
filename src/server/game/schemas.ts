import { z } from "zod";
import { gameStateSchema } from "@/domain/game/schemas";
import { characterPassportSchema } from "@/features/adventure/schema";

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/u, "Use letters, numbers, dashes, or underscores.");

export const sessionIdSchema = z.string().uuid();
export const ownerHashSchema = z.string().regex(/^[a-f0-9]{64}$/u);

export const startSessionRequestSchema = z
  .object({
    passport: characterPassportSchema,
  })
  .strict();

export const processActionRequestSchema = z
  .object({
    actionId: identifierSchema.optional(),
    customAction: z.string().max(300).optional(),
    expectedStateVersion: z.number().int().positive(),
    idempotencyKey: identifierSchema,
  })
  .strict()
  .refine(
    (value) =>
      (value.actionId === undefined) !== (value.customAction === undefined),
    "Provide exactly one actionId or customAction.",
  );

export const persistedSessionSchema = z
  .object({
    state: gameStateSchema,
    stateVersion: z.number().int().positive(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export const sessionSummarySchema = z
  .object({
    id: sessionIdSchema,
    status: z.enum(["playing", "victory", "defeat", "abandoned"]),
    title: z.string().min(1).max(160),
    turn: z.number().int().nonnegative(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export const sessionListSchema = z.array(sessionSummarySchema);

export type PersistedSession = z.infer<typeof persistedSessionSchema>;
export type ProcessActionRequest = z.infer<typeof processActionRequestSchema>;
export type StartSessionRequest = z.infer<typeof startSessionRequestSchema>;
