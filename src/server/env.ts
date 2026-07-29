import { z } from "zod";

const serverEnvironmentSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    OPENAI_API_KEY: z.string().trim().min(1).optional(),
    OPENAI_MODEL: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export function parseServerEnvironment(
  source: EnvironmentSource,
): ServerEnvironment {
  return serverEnvironmentSchema.parse({
    NODE_ENV: source.NODE_ENV,
    OPENAI_API_KEY: source.OPENAI_API_KEY?.trim() || undefined,
    OPENAI_MODEL: source.OPENAI_MODEL?.trim() || undefined,
  });
}

export const serverEnvironment = parseServerEnvironment(process.env);
