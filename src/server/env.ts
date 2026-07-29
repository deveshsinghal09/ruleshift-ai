import { z } from "zod";

const serverEnvironmentSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  })
  .strict();

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export function parseServerEnvironment(
  source: EnvironmentSource,
): ServerEnvironment {
  return serverEnvironmentSchema.parse({
    NODE_ENV: source.NODE_ENV,
  });
}

export const serverEnvironment = parseServerEnvironment(process.env);
