import { z } from "zod";
import { GameServiceError } from "@/server/game/errors";

const MAX_JSON_BYTES = 8_192;

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) {
    return;
  }
  let requestOrigin: string;
  try {
    requestOrigin = new URL(request.url).origin;
  } catch {
    throw new GameServiceError("BAD_REQUEST", "Invalid request URL.");
  }
  if (origin !== requestOrigin) {
    throw new GameServiceError(
      "FORBIDDEN_ORIGIN",
      "This request did not originate from RuleShift AI.",
    );
  }
}

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  const contentLength = request.headers.get("content-length");
  if (
    contentLength &&
    Number.parseInt(contentLength, 10) > MAX_JSON_BYTES
  ) {
    throw new GameServiceError(
      "BAD_REQUEST",
      "The request is too large.",
    );
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_JSON_BYTES) {
    throw new GameServiceError(
      "BAD_REQUEST",
      "The request is too large.",
    );
  }
  try {
    return schema.parse(JSON.parse(text) as unknown);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      throw new GameServiceError(
        "BAD_REQUEST",
        "The request format is invalid.",
      );
    }
    throw error;
  }
}
