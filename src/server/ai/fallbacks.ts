import type {
  GameAction,
  GameState,
  LocalGameEvent,
} from "@/domain/game/types";
import { AI_FALLBACK_MESSAGE } from "@/lib/ai-messages";
import type {
  FinalSummary,
  MemoryUpdate,
  WorldGeneration,
} from "@/server/ai/schemas";

export function createFallbackWorld(state: GameState): WorldGeneration {
  return {
    description:
      "A haunted campus where placement assessments became living trials.",
    objectiveDescription:
      "Survive the assessment wing and claim the Golden Offer Letter.",
    objectiveTitle: "Claim the Golden Offer Letter",
    openingNarration: state.currentEvent.narration,
    title: state.world.title,
  };
}

export function createFallbackEvent(
  state: GameState,
  action: GameAction,
): LocalGameEvent {
  void action;
  return {
    ...state.currentEvent,
    dmAside: `${AI_FALLBACK_MESSAGE} ${state.currentEvent.dmAside}`,
  };
}

export function createFallbackMemory(state: GameState): MemoryUpdate {
  const recentTitles = state.history.slice(-3).map((entry) => entry.title);
  return {
    summary:
      recentTitles.length > 0
        ? `Recent events: ${recentTitles.join("; ")}.`
        : `${state.player.profile.name} entered ${state.world.title}.`,
  };
}

export function createFallbackFinalSummary(
  state: GameState,
): FinalSummary {
  return {
    mostCreativeAction: state.lastAction ?? "Entered the unstable world",
    summary:
      state.status === "victory"
        ? `${state.player.profile.name} completed the objective and escaped with the adventure's deterministic rewards.`
        : `${state.player.profile.name} reached the end of the run after ${state.turn} resolved turns.`,
    title:
      state.status === "victory"
        ? "Reality stabilized in your favor."
        : "The unstable world closes this chapter.",
  };
}
