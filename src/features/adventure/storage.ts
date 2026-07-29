import {
  characterPassportSchema,
} from "@/features/adventure/schema";
import { gameStateSchema } from "@/domain/game/schemas";
import type {
  CharacterPassport,
  GameState,
} from "@/features/adventure/types";

const draftKey = "ruleshift.character-draft";
const sessionPrefix = "ruleshift.session.";

function parseStoredValue(value: string | null): unknown {
  if (value === null) {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

export function loadCharacterDraft(): CharacterPassport | null {
  if (typeof window === "undefined") {
    return null;
  }

  const result = characterPassportSchema.safeParse(
    parseStoredValue(window.localStorage.getItem(draftKey)),
  );

  return result.success ? result.data : null;
}

export function saveCharacterDraft(passport: CharacterPassport): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(draftKey, JSON.stringify(passport));
}

export function clearCharacterDraft(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(draftKey);
  }
}

export function loadGameSession(sessionId: string): GameState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const result = gameStateSchema.safeParse(
    parseStoredValue(
      window.localStorage.getItem(`${sessionPrefix}${sessionId}`),
    ),
  );

  if (!result.success || result.data.sessionId !== sessionId) {
    return null;
  }

  return result.data as GameState;
}

export function saveGameSession(state: GameState): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      `${sessionPrefix}${state.sessionId}`,
      JSON.stringify(state),
    );
  }
}
