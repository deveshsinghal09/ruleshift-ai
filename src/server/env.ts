import { z } from "zod";

const serverEnvironmentSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    GEMINI_API_KEY: z.string().trim().min(1).optional(),
    GEMINI_MODEL: z.string().trim().min(1).max(120).optional(),
    DATABASE_URL: z
      .string()
      .trim()
      .refine(
        (value) =>
          value.startsWith("postgresql://") ||
          value.startsWith("postgres://"),
        "DATABASE_URL must use the postgresql:// or postgres:// protocol.",
      )
      .optional(),
  })
  .strict();

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export function parseServerEnvironment(
  source: EnvironmentSource,
): ServerEnvironment {
  return serverEnvironmentSchema.parse({
    NODE_ENV: source.NODE_ENV,
    GEMINI_API_KEY: source.GEMINI_API_KEY?.trim() || undefined,
    GEMINI_MODEL: source.GEMINI_MODEL?.trim() || undefined,
    DATABASE_URL: source.DATABASE_URL?.trim() || undefined,
  });
}

export const serverEnvironment = parseServerEnvironment(process.env);
