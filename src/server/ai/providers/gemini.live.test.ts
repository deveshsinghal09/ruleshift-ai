import { describe, expect, it } from "vitest";
import { createInitialGameState } from "@/domain/game/engine";
import { AiDirector } from "@/server/ai/director";
import { selectAiProvider } from "@/server/ai/providers/config";
import { parseServerEnvironment } from "@/server/env";

const runLiveSmoke = process.env.RUN_GEMINI_SMOKE === "1";
const liveIt = runLiveSmoke ? it : it.skip;

describe("Gemini live smoke", () => {
  liveIt(
    "returns one validated memory through the complete provider boundary",
    { timeout: 30_000 },
    async () => {
      const environment = parseServerEnvironment({
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        GEMINI_MODEL: process.env.GEMINI_MODEL,
        NODE_ENV: "development",
      });
      const selection = selectAiProvider(environment);
      expect(selection.disabledReason).toBeNull();
      expect(selection.provider).not.toBeNull();

      const state = createInitialGameState({
        difficulty: "normal",
        profile: {
          archetype: "Placement Warrior",
          mood: "funny",
          name: "Devesh",
          title: "the Placement Warrior",
        },
        seed: "gemini-live-smoke",
        sessionId: "gemini-live-smoke",
      });
      const result = await new AiDirector({
        provider: selection.provider,
        timeoutMs: 10_000,
      }).generateMemory(state);

      expect(
        result.source,
        `Gemini smoke diagnostics: ${result.diagnostics.codes.join(",")}`,
      ).toBe("provider");
      expect(result.data.summary.length).toBeGreaterThan(0);
    },
  );
});
