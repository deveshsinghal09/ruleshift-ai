export interface JsonParseResult {
  readonly repaired: boolean;
  readonly value: unknown;
}

export class AiJsonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiJsonError";
  }
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new AiJsonError("Provider output was not valid JSON.");
  }
}

export function repairJsonOnce(raw: string): string {
  const withoutFence = raw
    .trim()
    .replace(/^```(?:json)?\s*/iu, "")
    .replace(/\s*```$/u, "");
  const firstBrace = withoutFence.indexOf("{");
  const lastBrace = withoutFence.lastIndexOf("}");
  const extracted =
    firstBrace >= 0 && lastBrace > firstBrace
      ? withoutFence.slice(firstBrace, lastBrace + 1)
      : withoutFence;
  return extracted.replace(/,\s*([}\]])/gu, "$1");
}

export function parseProviderJson(
  raw: string,
  allowRepair: boolean,
): JsonParseResult {
  try {
    return { repaired: false, value: parseJson(raw) };
  } catch (error) {
    if (!allowRepair) {
      throw error;
    }
    return { repaired: true, value: parseJson(repairJsonOnce(raw)) };
  }
}
