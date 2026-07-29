import type {
  GameAction,
  GameState,
  LocalGameEvent,
} from "@/domain/game/types";

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
