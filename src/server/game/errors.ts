export type GameServiceErrorCode =
  | "BAD_REQUEST"
  | "CONFLICT"
  | "DATABASE_UNAVAILABLE"
  | "FORBIDDEN_ORIGIN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "SESSION_COMPLETED"
  | "STATE_CORRUPTED"
  | "STALE_VERSION";

const statuses: Readonly<Record<GameServiceErrorCode, number>> = {
  BAD_REQUEST: 400,
  CONFLICT: 409,
  DATABASE_UNAVAILABLE: 503,
  FORBIDDEN_ORIGIN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  SESSION_COMPLETED: 409,
  STATE_CORRUPTED: 500,
  STALE_VERSION: 409,
};

export class GameServiceError extends Error {
  readonly code: GameServiceErrorCode;
  readonly status: number;

  constructor(code: GameServiceErrorCode, message: string) {
    super(message);
    this.name = "GameServiceError";
    this.code = code;
    this.status = statuses[code];
  }
}

export function toSafeServiceError(error: unknown): GameServiceError {
  if (error instanceof GameServiceError) {
    return error;
  }
  return new GameServiceError(
    "DATABASE_UNAVAILABLE",
    "The archive is temporarily unreachable. Your action was not applied.",
  );
}
