import { createCustomAction } from "@/domain/game/actions";
import {
  createInitialGameState,
  processTurn,
} from "@/domain/game/engine";
import { GameEngineError } from "@/domain/game/errors";
import { localEventProvider } from "@/domain/game/local-event-provider";
import { validateGameState } from "@/domain/game/schemas";
import { AI_FALLBACK_MESSAGE } from "@/lib/ai-messages";
import {
  HttpAiEventClient,
} from "@/features/adventure/ai-event-client";
import type {
  AiEventClient,
} from "@/features/adventure/ai-event-client";
import {
  clearCharacterDraft,
  loadGameSession,
  saveGameSession,
} from "@/features/adventure/storage";
import type {
  AdventureTransport,
  CharacterPassport,
  GameAction,
  SubmitActionRequest,
} from "@/features/adventure/types";

interface LocalTransportOptions {
  readonly aiEventClient?: AiEventClient | null;
  readonly delayMs?: number;
  readonly idFactory?: () => string;
  readonly seedFactory?: (
    sessionId: string,
    passport: CharacterPassport,
  ) => string;
}

function resolveSubmittedAction(
  request: SubmitActionRequest,
  availableActions: readonly GameAction[],
): GameAction {
  if (request.customAction !== undefined) {
    return createCustomAction(request.requestId, request.customAction);
  }

  const action = availableActions.find(
    (candidate) => candidate.id === request.actionId,
  );
  if (!action) {
    throw new GameEngineError(
      "UNAVAILABLE_ACTION",
      "That action is not available in the current event.",
    );
  }
  return action;
}

export function createLocalAdventureTransport(
  options: LocalTransportOptions = {},
): AdventureTransport {
  const delayMs = options.delayMs ?? 420;
  const idFactory =
    options.idFactory ??
    (() =>
      globalThis.crypto?.randomUUID?.() ??
      `demo-${Date.now().toString(36)}`);
  const seedFactory =
    options.seedFactory ??
    ((sessionId, passport) =>
      `${sessionId}:${passport.name}:${passport.difficulty}`);
  const pendingSessions = new Set<string>();
  const aiEventClient =
    options.aiEventClient === undefined
      ? process.env.NODE_ENV === "test"
        ? null
        : new HttpAiEventClient()
      : options.aiEventClient;

  async function pause(): Promise<void> {
    if (delayMs <= 0) {
      return;
    }
    await new Promise<void>((resolve) => {
      globalThis.setTimeout(resolve, delayMs);
    });
  }

  return {
    async createSession(passport) {
      await pause();
      const sessionId = idFactory();
      const state = createInitialGameState({
        difficulty: passport.difficulty,
        profile: {
          archetype: passport.archetype,
          mood: passport.mood,
          name: passport.name,
          title: passport.title,
        },
        seed: seedFactory(sessionId, passport),
        sessionId,
      });
      saveGameSession(state);
      clearCharacterDraft();
      return state;
    },

    async getSession(sessionId) {
      await pause();
      return loadGameSession(sessionId);
    },

    async submitAction(sessionId, request) {
      if (pendingSessions.has(sessionId)) {
        throw new GameEngineError(
          "DUPLICATE_ACTION",
          "That turn is already being resolved.",
        );
      }

      const current = loadGameSession(sessionId);
      if (!current) {
        throw new GameEngineError(
          "INVALID_STATE",
          "This adventure session could not be restored.",
        );
      }

      pendingSessions.add(sessionId);
      try {
        await pause();
        const latest = loadGameSession(sessionId) ?? current;
        if (
          request.actionId &&
          latest.processedActionIds.includes(request.actionId)
        ) {
          throw new GameEngineError(
            "DUPLICATE_ACTION",
            `Action "${request.actionId}" has already been processed.`,
          );
        }
        const action = resolveSubmittedAction(
          request,
          latest.currentEvent.choices,
        );
        const result = processTurn(latest, action, {
          eventProvider: localEventProvider,
        });
        let nextState = result.state;
        if (nextState.status === "playing" && aiEventClient) {
          try {
            const generated = await aiEventClient.generateNextEvent({
              action,
              state: nextState,
            });
            nextState = validateGameState({
              ...nextState,
              currentEvent: generated.event,
            });
          } catch {
            nextState = validateGameState({
              ...nextState,
              currentEvent: {
                ...nextState.currentEvent,
                dmAside: `${AI_FALLBACK_MESSAGE} ${nextState.currentEvent.dmAside}`,
              },
            });
          }
        }
        saveGameSession(nextState);
        return nextState;
      } finally {
        pendingSessions.delete(sessionId);
      }
    },
  };
}
