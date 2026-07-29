import { randomUUID } from "node:crypto";
import { createCustomAction } from "@/domain/game/actions";
import { createInitialGameState, processTurn } from "@/domain/game/engine";
import { GameEngineError } from "@/domain/game/errors";
import { localEventProvider } from "@/domain/game/local-event-provider";
import { validateGameState } from "@/domain/game/schemas";
import type {
  EventProvider,
  GameAction,
  GameState,
  LocalGameEvent,
  TurnResult,
} from "@/domain/game/types";
import { characterPassportSchema } from "@/features/adventure/schema";
import type { CharacterPassport } from "@/features/adventure/types";
import type { AiResult } from "@/server/ai/director";
import { GameServiceError } from "@/server/game/errors";
import type {
  GameSessionRepository,
  StoredSession,
} from "@/server/game/repository";
import {
  persistedSessionSchema,
  processActionRequestSchema,
  sessionListSchema,
  type PersistedSession,
  type ProcessActionRequest,
} from "@/server/game/schemas";
import type { RateLimiter } from "@/server/http/rate-limit";

export interface GameAiDirector {
  generateEvent(
    state: GameState,
    action: GameAction,
  ): Promise<AiResult<LocalGameEvent>>;
}

interface GameServiceOptions {
  readonly aiDirector: GameAiDirector;
  readonly clock?: () => Date;
  readonly idFactory?: () => string;
  readonly rateLimiter: RateLimiter;
  readonly repository: GameSessionRepository;
}

function toPersistedSession(session: StoredSession): PersistedSession {
  return persistedSessionSchema.parse({
    state: session.state,
    stateVersion: session.stateVersion,
    updatedAt: session.updatedAt.toISOString(),
  });
}

function resolveAction(
  state: GameState,
  request: ProcessActionRequest,
): GameAction {
  if (request.customAction !== undefined) {
    return createCustomAction(
      `custom-${request.idempotencyKey}`,
      request.customAction,
    );
  }
  const action = state.currentEvent.choices.find(
    (candidate) => candidate.id === request.actionId,
  );
  if (!action) {
    throw new GameServiceError(
      "BAD_REQUEST",
      "That action is not available in the current event.",
    );
  }
  return action;
}

function fixedEventProvider(
  event: LocalGameEvent,
  randomState: number,
): EventProvider {
  return {
    generateNextEvent: () => ({ event, randomState }),
  };
}

function safeProcessTurn(
  state: GameState,
  action: GameAction,
  provider: EventProvider,
): TurnResult {
  try {
    return processTurn(state, action, { eventProvider: provider });
  } catch (error) {
    if (error instanceof GameEngineError) {
      throw new GameServiceError("BAD_REQUEST", error.message);
    }
    throw error;
  }
}

export class GameService {
  private readonly aiDirector: GameAiDirector;
  private readonly clock: () => Date;
  private readonly idFactory: () => string;
  private readonly rateLimiter: RateLimiter;
  private readonly repository: GameSessionRepository;

  constructor(options: GameServiceOptions) {
    this.aiDirector = options.aiDirector;
    this.clock = options.clock ?? (() => new Date());
    this.idFactory = options.idFactory ?? randomUUID;
    this.rateLimiter = options.rateLimiter;
    this.repository = options.repository;
  }

  async startSession(
    ownerTokenHash: string,
    passportInput: CharacterPassport,
  ): Promise<PersistedSession> {
    const passport = characterPassportSchema.parse(passportInput);
    const sessionId = this.idFactory();
    const state = createInitialGameState({
      difficulty: passport.difficulty,
      profile: {
        archetype: passport.archetype,
        mood: passport.mood,
        name: passport.name,
        title: passport.title,
      },
      seed: `${sessionId}:${passport.name}:${passport.difficulty}`,
      sessionId,
    });
    const stored = await this.repository.create({
      ownerTokenHash,
      state,
    });
    return toPersistedSession(stored);
  }

  async getSession(
    sessionId: string,
    ownerTokenHash: string,
  ): Promise<PersistedSession> {
    const stored = await this.repository.findOwned(
      sessionId,
      ownerTokenHash,
    );
    if (!stored) {
      throw new GameServiceError(
        "NOT_FOUND",
        "This adventure could not be found.",
      );
    }
    try {
      return toPersistedSession({
        ...stored,
        state: validateGameState(stored.state),
      });
    } catch {
      throw new GameServiceError(
        "STATE_CORRUPTED",
        "This adventure record is damaged and cannot be resumed safely.",
      );
    }
  }

  async listSessions(ownerTokenHash: string) {
    const sessions = await this.repository.listOwned(ownerTokenHash);
    return sessionListSchema.parse(
      sessions.map((session) => ({
        id: session.id,
        status: session.status,
        title: session.title,
        turn: session.turn,
        updatedAt: session.updatedAt.toISOString(),
      })),
    );
  }

  async getResult(
    sessionId: string,
    ownerTokenHash: string,
  ): Promise<PersistedSession> {
    const session = await this.getSession(sessionId, ownerTokenHash);
    if (session.state.status === "playing") {
      throw new GameServiceError(
        "SESSION_COMPLETED",
        "This adventure is still in progress.",
      );
    }
    return session;
  }

  async processAction(
    sessionId: string,
    ownerTokenHash: string,
    requestInput: ProcessActionRequest,
  ): Promise<PersistedSession> {
    const request = processActionRequestSchema.parse(requestInput);
    if (!this.rateLimiter.consume(`turn:${ownerTokenHash}`)) {
      throw new GameServiceError(
        "RATE_LIMITED",
        "Reality needs a moment to stabilize before another action.",
      );
    }
    const replay = await this.repository.findIdempotentResponse(
      sessionId,
      ownerTokenHash,
      request.idempotencyKey,
    );
    if (replay) {
      return persistedSessionSchema.parse(replay);
    }
    const stored = await this.repository.findOwned(
      sessionId,
      ownerTokenHash,
    );
    if (!stored) {
      throw new GameServiceError(
        "NOT_FOUND",
        "This adventure could not be found.",
      );
    }
    if (stored.status !== "playing") {
      throw new GameServiceError(
        "SESSION_COMPLETED",
        "Completed adventures cannot process additional actions.",
      );
    }

    let beforeState: GameState;
    try {
      beforeState = validateGameState(stored.state);
    } catch {
      throw new GameServiceError(
        "STATE_CORRUPTED",
        "This adventure record is damaged and cannot process turns.",
      );
    }
    const action = resolveAction(beforeState, request);
    const preview = safeProcessTurn(
      beforeState,
      action,
      localEventProvider,
    );
    let result = preview;

    if (preview.state.status === "playing") {
      try {
        const proposal = await this.aiDirector.generateEvent(
          preview.state,
          action,
        );
        if (proposal.source === "provider") {
          result = safeProcessTurn(
            beforeState,
            action,
            fixedEventProvider(
              proposal.data,
              preview.state.randomState,
            ),
          );
        }
      } catch {
        result = preview;
      }
    }

    const response = persistedSessionSchema.parse({
      state: result.state,
      stateVersion: request.expectedStateVersion + 1,
      updatedAt: this.clock().toISOString(),
    });
    const outcome = await this.repository.persistTurn({
      action,
      afterState: result.state,
      beforeState,
      effects: result.effects,
      expectedStateVersion: request.expectedStateVersion,
      idempotencyKey: request.idempotencyKey,
      ownerTokenHash,
      response,
      ruleEvents: result.ruleEvents,
      sessionId,
    });

    switch (outcome.kind) {
      case "persisted":
        return response;
      case "replayed":
        return persistedSessionSchema.parse(outcome.response);
      case "not-found":
        throw new GameServiceError(
          "NOT_FOUND",
          "This adventure could not be found.",
        );
      case "completed":
        throw new GameServiceError(
          "SESSION_COMPLETED",
          "Completed adventures cannot process additional actions.",
        );
      case "stale":
        throw new GameServiceError(
          "STALE_VERSION",
          `This adventure advanced to state version ${outcome.actualVersion}. Reload before acting again.`,
        );
    }
  }

  async abandonSession(
    sessionId: string,
    ownerTokenHash: string,
  ): Promise<void> {
    const outcome = await this.repository.abandon(
      sessionId,
      ownerTokenHash,
    );
    if (outcome.kind === "not-found") {
      throw new GameServiceError(
        "NOT_FOUND",
        "This adventure could not be found.",
      );
    }
    if (outcome.kind === "completed") {
      throw new GameServiceError(
        "SESSION_COMPLETED",
        "Completed adventures cannot be abandoned.",
      );
    }
  }
}
