export type GameEngineErrorCode =
  | "DUPLICATE_ACTION"
  | "INSUFFICIENT_ENERGY"
  | "INVALID_ACTION"
  | "INVALID_RULE"
  | "INVALID_STATE"
  | "POST_GAME_ACTION"
  | "RULE_CONFLICT"
  | "UNAVAILABLE_ACTION";

export class GameEngineError extends Error {
  readonly code: GameEngineErrorCode;

  constructor(code: GameEngineErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "GameEngineError";
  }
}
