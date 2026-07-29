import { describe, expect, it } from "vitest";
import { selectAiProvider } from "@/server/ai/providers/config";

describe("selectAiProvider", () => {
  it("disables the provider when the API key is missing", () => {
    expect(
      selectAiProvider({
        NODE_ENV: "development",
        OPENAI_MODEL: "configured",
      }),
    ).toEqual({
      disabledReason: "missing-api-key",
      provider: null,
    });
  });

  it("does not invent a default model name", () => {
    expect(
      selectAiProvider({
        NODE_ENV: "development",
        OPENAI_API_KEY: "test-key",
      }),
    ).toEqual({
      disabledReason: "missing-model",
      provider: null,
    });
  });

  it("never selects a real provider during the unit-test process", () => {
    expect(
      selectAiProvider({
        NODE_ENV: "test",
        OPENAI_API_KEY: "test-key",
        OPENAI_MODEL: "configured",
      }),
    ).toEqual({
      disabledReason: "test-mode",
      provider: null,
    });
  });
});
