import type {
  CharacterProfile,
  Difficulty,
  GameState,
} from "@/domain/game/types";

export type {
  Difficulty,
  EventKind,
  GameAction,
  GameHistoryEntry,
  GameState,
  InventoryItem,
  MoodId,
} from "@/domain/game/types";

export interface CharacterOption {
  readonly archetype: string;
  readonly description: string;
  readonly id: string;
  readonly name: string;
  readonly title: string;
}

export interface CharacterPassport extends CharacterProfile {
  readonly difficulty: Difficulty;
}

export interface SubmitActionRequest {
  readonly actionId?: string;
  readonly customAction?: string;
  readonly requestId: string;
}

export interface AdventureTransport {
  createSession(passport: CharacterPassport): Promise<GameState>;
  getSession(sessionId: string): Promise<GameState | null>;
  submitAction(
    sessionId: string,
    request: SubmitActionRequest,
  ): Promise<GameState>;
}
