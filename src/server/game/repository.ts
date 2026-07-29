import type { Effect, GameAction, GameState } from "@/domain/game/types";
import type { RuleLifecycleEvent } from "@/domain/rules/types";
import type { PersistedSession } from "@/server/game/schemas";

export type StoredSessionStatus =
  | "playing"
  | "victory"
  | "defeat"
  | "abandoned";

export interface StoredSession {
  readonly abandonedAt: Date | null;
  readonly completedAt: Date | null;
  readonly createdAt: Date;
  readonly ownerTokenHash: string;
  readonly state: GameState;
  readonly stateVersion: number;
  readonly status: StoredSessionStatus;
  readonly updatedAt: Date;
}

export interface StoredSessionSummary {
  readonly id: string;
  readonly status: StoredSessionStatus;
  readonly title: string;
  readonly turn: number;
  readonly updatedAt: Date;
}

export interface CreateStoredSessionInput {
  readonly ownerTokenHash: string;
  readonly state: GameState;
}

export interface PersistTurnInput {
  readonly action: GameAction;
  readonly afterState: GameState;
  readonly beforeState: GameState;
  readonly effects: readonly Effect[];
  readonly expectedStateVersion: number;
  readonly idempotencyKey: string;
  readonly ownerTokenHash: string;
  readonly response: PersistedSession;
  readonly ruleEvents: readonly RuleLifecycleEvent[];
  readonly sessionId: string;
}

export type PersistTurnOutcome =
  | { readonly kind: "persisted"; readonly session: StoredSession }
  | { readonly kind: "replayed"; readonly response: PersistedSession }
  | { readonly kind: "not-found" }
  | { readonly actualVersion: number; readonly kind: "stale" }
  | { readonly kind: "completed" };

export type AbandonOutcome =
  | { readonly kind: "abandoned" }
  | { readonly kind: "not-found" }
  | { readonly kind: "completed" };

export interface GameSessionRepository {
  abandon(
    sessionId: string,
    ownerTokenHash: string,
  ): Promise<AbandonOutcome>;
  create(input: CreateStoredSessionInput): Promise<StoredSession>;
  findOwned(
    sessionId: string,
    ownerTokenHash: string,
  ): Promise<StoredSession | null>;
  findIdempotentResponse(
    sessionId: string,
    ownerTokenHash: string,
    idempotencyKey: string,
  ): Promise<PersistedSession | null>;
  listOwned(ownerTokenHash: string): Promise<readonly StoredSessionSummary[]>;
  persistTurn(input: PersistTurnInput): Promise<PersistTurnOutcome>;
}
