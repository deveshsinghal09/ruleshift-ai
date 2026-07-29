import { OpenAiProvider } from "@/server/ai/providers/openai";
import type { AiProvider } from "@/server/ai/providers/types";
import type { ServerEnvironment } from "@/server/env";

const DEFAULT_REQUEST_TIMEOUT_MS = 8_000;

export interface ProviderSelection {
  readonly disabledReason:
    | "missing-api-key"
    | "missing-model"
    | "test-mode"
    | null;
  readonly provider: AiProvider | null;
}

export function selectAiProvider(
  environment: ServerEnvironment,
): ProviderSelection {
  if (environment.NODE_ENV === "test") {
    return { disabledReason: "test-mode", provider: null };
  }
  if (!environment.OPENAI_API_KEY) {
    return { disabledReason: "missing-api-key", provider: null };
  }
  if (!environment.OPENAI_MODEL) {
    return { disabledReason: "missing-model", provider: null };
  }
  return {
    disabledReason: null,
    provider: new OpenAiProvider({
      apiKey: environment.OPENAI_API_KEY,
      model: environment.OPENAI_MODEL,
      timeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
    }),
  };
}
