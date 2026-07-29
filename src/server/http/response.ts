import { NextResponse } from "next/server";
import { z } from "zod";
import {
  GameServiceError,
  toSafeServiceError,
} from "@/server/game/errors";

export function safeErrorResponse(error: unknown): NextResponse {
  if (!(error instanceof GameServiceError) && !(error instanceof z.ZodError)) {
    const diagnostic =
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof error.code === "string"
        ? error.code
        : "unclassified";
    const name = error instanceof Error ? error.name : "UnknownError";
    console.error(`Game API internal failure: ${name}/${diagnostic}`);
  }
  const safeError =
    error instanceof z.ZodError
      ? new GameServiceError(
          "BAD_REQUEST",
          "The request format is invalid.",
        )
      : toSafeServiceError(error);
  return NextResponse.json(
    {
      error: {
        code: safeError.code,
        message: safeError.message,
      },
    },
    {
      headers:
        safeError.code === "RATE_LIMITED"
          ? { "Retry-After": "60" }
          : undefined,
      status: safeError.status,
    },
  );
}
