import { z } from "zod";
import { localGameEventSchema } from "@/domain/game/schemas";
import type {
  GameAction,
  GameState,
  LocalGameEvent,
} from "@/domain/game/types";

const aiEventClientResponseSchema = z
  .object({
    event: localGameEventSchema,
    source: z.enum(["provider", "fallback"]),
    userMessage: z.string().trim().min(1).max(240).nullable(),
  })
  .strict();

export interface AiEventRequest {
  readonly action: GameAction;
  readonly state: GameState;
}

export interface AiEventResult {
  readonly event: LocalGameEvent;
  readonly source: "provider" | "fallback";
  readonly userMessage: string | null;
}

export interface AiEventClient {
  generateNextEvent(request: AiEventRequest): Promise<AiEventResult>;
}

export interface HttpAiEventClientOptions {
  readonly timeoutMs?: number;
}

export class HttpAiEventClient implements AiEventClient {
  private readonly timeoutMs: number;

  constructor(options: HttpAiEventClientOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? 18_000;
  }

  async generateNextEvent(request: AiEventRequest): Promise<AiEventResult> {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(
      () => controller.abort(),
      this.timeoutMs,
    );
    try {
      const response = await fetch("/api/ai/event", {
        body: JSON.stringify(request),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error("The Dungeon Master signal could not be decoded.");
      }
      return aiEventClientResponseSchema.parse(
        (await response.json()) as unknown,
      ) as AiEventResult;
    } finally {
      globalThis.clearTimeout(timeoutId);
    }
  }
}
