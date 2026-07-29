"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createHttpAdventureTransport } from "@/features/adventure/http-transport";
import type {
  AdventureTransport,
  GameState,
  SubmitActionRequest,
} from "@/features/adventure/types";

interface UseGameResult {
  readonly error: string | null;
  readonly isLoading: boolean;
  readonly isSubmitting: boolean;
  readonly state: GameState | null;
  readonly submitAction: (
    request: Omit<SubmitActionRequest, "requestId">,
  ) => Promise<GameState | null>;
}

export function useGame(
  sessionId: string,
  providedTransport?: AdventureTransport,
): UseGameResult {
  const transport = useMemo(
    () => providedTransport ?? createHttpAdventureTransport(),
    [providedTransport],
  );
  const [state, setState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    let isActive = true;

    async function restoreSession(): Promise<void> {
      try {
        const restored = await transport.getSession(sessionId);
        if (isActive) {
          setState(restored);
          setError(
            restored
              ? null
              : "This adventure was not found or belongs to another browser.",
          );
        }
      } catch {
        if (isActive) {
          setError(
            "The adventure archive could not be restored. Try again shortly.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void restoreSession();
    return () => {
      isActive = false;
    };
  }, [sessionId, transport]);

  const submitAction = useCallback(
    async (
      request: Omit<SubmitActionRequest, "requestId">,
    ): Promise<GameState | null> => {
      if (submittingRef.current) {
        return null;
      }

      submittingRef.current = true;
      setIsSubmitting(true);
      setError(null);

      try {
        const nextState = await transport.submitAction(sessionId, {
          ...request,
          requestId:
            globalThis.crypto?.randomUUID?.() ??
            `request-${Date.now().toString(36)}`,
        });
        setState(nextState);
        return nextState;
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "The turn could not be resolved. Try the action again.",
        );
        return null;
      } finally {
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [sessionId, transport],
  );

  return {
    error,
    isLoading,
    isSubmitting,
    state,
    submitAction,
  };
}
