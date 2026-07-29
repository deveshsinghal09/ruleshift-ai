import { z } from "zod";
import { gameStateSchema } from "@/domain/game/schemas";
import type {
  AdventureTransport,
  CharacterPassport,
  GameState,
  SubmitActionRequest,
} from "@/features/adventure/types";
import { clearCharacterDraft } from "@/features/adventure/storage";

const sessionEnvelopeSchema = z
  .object({
    state: gameStateSchema,
    stateVersion: z.number().int().positive(),
    updatedAt: z.string().datetime(),
  })
  .strict();

const errorEnvelopeSchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
    }),
  })
  .strict();

async function readSessionResponse(
  response: Response,
): Promise<z.infer<typeof sessionEnvelopeSchema>> {
  const body = (await response.json()) as unknown;
  if (!response.ok) {
    const error = errorEnvelopeSchema.safeParse(body);
    throw new Error(
      error.success
        ? error.data.error.message
        : "The adventure archive could not be reached.",
    );
  }
  return sessionEnvelopeSchema.parse(body);
}

export class HttpAdventureTransport implements AdventureTransport {
  private readonly stateVersions = new Map<string, number>();

  async createSession(passport: CharacterPassport): Promise<GameState> {
    const response = await fetch("/api/sessions", {
      body: JSON.stringify({ passport }),
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const session = await readSessionResponse(response);
    this.stateVersions.set(
      session.state.sessionId,
      session.stateVersion,
    );
    clearCharacterDraft();
    return session.state;
  }

  async getSession(sessionId: string): Promise<GameState | null> {
    const response = await fetch(
      `/api/sessions/${encodeURIComponent(sessionId)}`,
      { credentials: "same-origin" },
    );
    if (response.status === 404) {
      return null;
    }
    const session = await readSessionResponse(response);
    this.stateVersions.set(sessionId, session.stateVersion);
    return session.state;
  }

  async submitAction(
    sessionId: string,
    request: SubmitActionRequest,
  ): Promise<GameState> {
    let stateVersion = this.stateVersions.get(sessionId);
    if (!stateVersion) {
      const restored = await this.getSession(sessionId);
      if (!restored) {
        throw new Error("This adventure could not be restored.");
      }
      stateVersion = this.stateVersions.get(sessionId);
    }
    if (!stateVersion) {
      throw new Error("The adventure state version is unavailable.");
    }

    const response = await fetch(
      `/api/sessions/${encodeURIComponent(sessionId)}/actions`,
      {
        body: JSON.stringify({
          actionId: request.actionId,
          customAction: request.customAction,
          expectedStateVersion: stateVersion,
          idempotencyKey: request.requestId,
        }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
    );
    const session = await readSessionResponse(response);
    this.stateVersions.set(sessionId, session.stateVersion);
    return session.state;
  }
}

export function createHttpAdventureTransport(): AdventureTransport {
  return new HttpAdventureTransport();
}
