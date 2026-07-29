"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createMockAdventureTransport } from "@/features/adventure/mock-transport";
import type {
  MockAdventureTransport,
  MockGameState,
  SubmitActionRequest,
} from "@/features/adventure/types";

interface UseMockGameResult {
  dismissRuleShift: () => Promise<void>;
  error: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  state: MockGameState | null;
  submitAction: (
    request: Omit<SubmitActionRequest, "requestId">,
  ) => Promise<MockGameState | null>;
}

export function useMockGame(
  sessionId: string,
  providedTransport?: MockAdventureTransport,
): UseMockGameResult {
  const transport = useMemo(
    () => providedTransport ?? createMockAdventureTransport(),
    [providedTransport],
  );
  const [state, setState] = useState<MockGameState | null>(null);
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
              : "This local adventure was not found. Start a new passport to continue.",
          );
        }
      } catch {
        if (isActive) {
          setError(
            "The local adventure could not be restored. Start a new passport to continue.",
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
    ): Promise<MockGameState | null> => {
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

  const dismissRuleShift = useCallback(async (): Promise<void> => {
    try {
      const nextState = await transport.dismissRuleShift(sessionId);
      setState(nextState);
    } catch {
      setError("The RuleShift notice could not be dismissed. Try again.");
    }
  }, [sessionId, transport]);

  return {
    dismissRuleShift,
    error,
    isLoading,
    isSubmitting,
    state,
    submitAction,
  };
}
