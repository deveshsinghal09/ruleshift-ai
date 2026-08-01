import { GeminiProvider } from "@/server/ai/providers/gemini";
import { DeterministicFixtureAiProvider } from "@/server/ai/providers/deterministic-fixture";
import type { AiProvider } from "@/server/ai/providers/types";
import type { ServerEnvironment } from "@/server/env";

export interface ProviderSelection {
  readonly disabledReason:
    | "missing-api-key"
    | "missing-model"
    | "explicit-fallback"
    | "test-mode"
    | null;
  readonly provider: AiProvider | null;
}

export function selectAiProvider(
  environment: ServerEnvironment,
): ProviderSelection {
  if (environment.AI_PROVIDER_MODE === "fallback") {
    return { disabledReason: "explicit-fallback", provider: null };
  }
  if (environment.AI_PROVIDER_MODE === "mock") {
    return {
      disabledReason: null,
      provider: new DeterministicFixtureAiProvider(),
    };
  }
  if (environment.NODE_ENV === "test") {
    return { disabledReason: "test-mode", provider: null };
  }
  if (!environment.GEMINI_API_KEY) {
    return { disabledReason: "missing-api-key", provider: null };
  }
  if (!environment.GEMINI_MODEL) {
    return { disabledReason: "missing-model", provider: null };
  }
  return {
    disabledReason: null,
    provider: new GeminiProvider({
      apiKey: environment.GEMINI_API_KEY,
      model: environment.GEMINI_MODEL,
    }),
  };
}
