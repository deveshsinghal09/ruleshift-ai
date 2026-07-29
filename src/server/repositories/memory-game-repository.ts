import { ownerHashesMatch } from "@/server/auth/owner-token";
import type {
  AbandonOutcome,
  CreateStoredSessionInput,
  GameSessionRepository,
  PersistTurnInput,
  PersistTurnOutcome,
  StoredSession,
  StoredSessionSummary,
} from "@/server/game/repository";
import type { PersistedSession } from "@/server/game/schemas";

function copySession(session: StoredSession): StoredSession {
  return structuredClone(session);
}

export class MemoryGameSessionRepository implements GameSessionRepository {
  private readonly idempotentResponses = new Map<string, PersistedSession>();
  private readonly sessions = new Map<string, StoredSession>();
  failNextPersist = false;

  async abandon(
    sessionId: string,
    ownerTokenHash: string,
  ): Promise<AbandonOutcome> {
    const current = this.sessions.get(sessionId);
    if (
      !current ||
      !ownerHashesMatch(current.ownerTokenHash, ownerTokenHash)
    ) {
      return { kind: "not-found" };
    }
    if (current.status !== "playing") {
      return { kind: "completed" };
    }
    const now = new Date();
    this.sessions.set(sessionId, {
      ...current,
      abandonedAt: now,
      status: "abandoned",
      updatedAt: now,
    });
    return { kind: "abandoned" };
  }

  async create(input: CreateStoredSessionInput): Promise<StoredSession> {
    const now = new Date();
    const session: StoredSession = {
      abandonedAt: null,
      completedAt: null,
      createdAt: now,
      ownerTokenHash: input.ownerTokenHash,
      state: structuredClone(input.state),
      stateVersion: 1,
      status: input.state.status,
      updatedAt: now,
    };
    this.sessions.set(input.state.sessionId, session);
    return copySession(session);
  }

  async findOwned(
    sessionId: string,
    ownerTokenHash: string,
  ): Promise<StoredSession | null> {
    const session = this.sessions.get(sessionId);
    return session &&
      ownerHashesMatch(session.ownerTokenHash, ownerTokenHash)
      ? copySession(session)
      : null;
  }

  async findIdempotentResponse(
    sessionId: string,
    ownerTokenHash: string,
    idempotencyKey: string,
  ): Promise<PersistedSession | null> {
    const session = this.sessions.get(sessionId);
    if (
      !session ||
      !ownerHashesMatch(session.ownerTokenHash, ownerTokenHash)
    ) {
      return null;
    }
    const response = this.idempotentResponses.get(
      `${sessionId}:${idempotencyKey}`,
    );
    return response ? structuredClone(response) : null;
  }

  async listOwned(
    ownerTokenHash: string,
  ): Promise<readonly StoredSessionSummary[]> {
    return [...this.sessions.values()]
      .filter((session) =>
        ownerHashesMatch(session.ownerTokenHash, ownerTokenHash),
      )
      .map((session) => ({
        id: session.state.sessionId,
        status: session.status,
        title: session.state.world.title,
        turn: session.state.turn,
        updatedAt: new Date(session.updatedAt),
      }))
      .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());
  }

  async persistTurn(input: PersistTurnInput): Promise<PersistTurnOutcome> {
    if (this.failNextPersist) {
      this.failNextPersist = false;
      throw new Error("Simulated transaction failure");
    }
    const current = this.sessions.get(input.sessionId);
    if (
      !current ||
      !ownerHashesMatch(current.ownerTokenHash, input.ownerTokenHash)
    ) {
      return { kind: "not-found" };
    }
    const requestKey = `${input.sessionId}:${input.idempotencyKey}`;
    const replay = this.idempotentResponses.get(requestKey);
    if (replay) {
      return { kind: "replayed", response: structuredClone(replay) };
    }
    if (current.status !== "playing") {
      return { kind: "completed" };
    }
    if (current.stateVersion !== input.expectedStateVersion) {
      return { actualVersion: current.stateVersion, kind: "stale" };
    }

    const nextVersion = current.stateVersion + 1;
    const now = new Date(input.response.updatedAt);
    const next: StoredSession = {
      ...current,
      completedAt:
        input.afterState.status === "playing"
          ? null
          : now,
      state: structuredClone(input.afterState),
      stateVersion: nextVersion,
      status: input.afterState.status,
      updatedAt: now,
    };
    this.sessions.set(input.sessionId, next);
    this.idempotentResponses.set(
      requestKey,
      structuredClone(input.response),
    );
    return { kind: "persisted", session: copySession(next) };
  }
}
