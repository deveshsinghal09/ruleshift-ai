import { describe, expect, it } from "vitest";
import { AiDirector } from "@/server/ai/director";
import { hashOwnerToken } from "@/server/auth/owner-token";
import { selectAiProvider } from "@/server/ai/providers/config";
import { parseServerEnvironment } from "@/server/env";
import { GameService } from "@/server/game/service";
import type { PersistedSession } from "@/server/game/schemas";
import { InMemoryRateLimiter } from "@/server/http/rate-limit";
import { MemoryGameSessionRepository } from "@/server/repositories/memory-game-repository";

const runLiveSmoke = process.env.RUN_GEMINI_SMOKE === "1";
const liveIt = runLiveSmoke ? it : it.skip;

describe("Gemini live smoke", () => {
  liveIt(
    "uses a validated provider event in a complete playable session",
    { timeout: 45_000 },
    async () => {
      const environment = parseServerEnvironment({
        AI_PROVIDER_MODE: "gemini",
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        GEMINI_MODEL: process.env.GEMINI_MODEL,
        NODE_ENV: "development",
      });
      const selection = selectAiProvider(environment);
      expect(selection.disabledReason).toBeNull();
      expect(selection.provider).not.toBeNull();

      const providerDirector = new AiDirector({
        provider: selection.provider,
        timeoutMs: 10_000,
      });
      const fallbackDirector = new AiDirector({ provider: null });
      let providerCalls = 0;
      let providerDiagnostic = "provider-not-called";
      let providerSource: "fallback" | "provider" = "fallback";
      const service = new GameService({
        aiDirector: {
          generateEvent: async (state, action) => {
            if (providerCalls > 0) {
              return fallbackDirector.generateEvent(state, action);
            }
            providerCalls += 1;
            const result = await providerDirector.generateEvent(state, action);
            providerSource = result.source;
            providerDiagnostic = result.diagnostics.codes.join(",") || "validated";
            return result;
          },
        },
        idFactory: () => "00000000-0000-4000-8000-000000000010",
        rateLimiter: new InMemoryRateLimiter(100),
        repository: new MemoryGameSessionRepository(),
      });
      const ownerHash = hashOwnerToken("phase-10-live-smoke-owner");
      let session = await service.startSession(ownerHash, {
        archetype: "Placement Warrior",
        difficulty: "easy",
        mood: "funny",
        name: "Devesh",
        title: "the Placement Warrior",
      });

      while (session.state.status === "playing") {
        session = await processLowestCostAction(service, session, ownerHash);
      }

      expect(providerSource, `Gemini provider boundary: ${providerDiagnostic}`).toBe(
        "provider",
      );
      expect(providerCalls).toBe(1);
      expect(session.state.history.some((entry) => entry.eventId.startsWith("ai-event-"))).toBe(
        true,
      );
      expect(session.state.history.length).toBeGreaterThan(1);
      expect(["victory", "defeat"]).toContain(session.state.status);
    },
  );
});

async function processLowestCostAction(
  service: GameService,
  session: PersistedSession,
  ownerHash: string,
): Promise<PersistedSession> {
  const choices = [...session.state.currentEvent.choices]
    .filter((choice) => choice.available)
    .sort((left, right) => {
      const restPriority = Number(right.kind === "rest") - Number(left.kind === "rest");
      return restPriority || left.energyCost - right.energyCost;
    });

  for (const [index, choice] of choices.entries()) {
    try {
      return await service.processAction(session.state.sessionId, ownerHash, {
        actionId: choice.id,
        expectedStateVersion: session.stateVersion,
        idempotencyKey: `live-${session.state.turn + 1}-${index + 1}`,
      });
    } catch {
      // Registered rules may reject an individual choice; try another safe choice.
    }
  }

  throw new Error("The live smoke session had no processable registered action.");
}
