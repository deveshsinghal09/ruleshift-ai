import { describe, expect, it } from "vitest";
import type {
  GenerateContentParameters,
} from "@google/genai";
import {
  GeminiProvider,
  sanitizeGeminiJsonSchema,
  thinkingConfigForModel,
} from "@/server/ai/providers/gemini";
import type { AiProviderRequest } from "@/server/ai/providers/types";
import {
  AiProviderError,
} from "@/server/ai/providers/types";
import { ApiError } from "@google/genai";

const request: AiProviderRequest = {
  jsonSchema: {
    additionalProperties: false,
    properties: { title: { type: "string" } },
    required: ["title"],
    type: "object",
  },
  schemaName: "ruleshift_event",
  systemPrompt: "Remain inside the deterministic policy boundary.",
  task: "event",
  userPrompt: "Generate the next event.",
};

describe("GeminiProvider", () => {
  it("uses low-latency thinking settings without selecting a model", () => {
    expect(thinkingConfigForModel("gemini-2.5-flash")).toEqual({
      thinkingBudget: 0,
    });
    expect(thinkingConfigForModel("models/gemini-3-flash")).toMatchObject({
      thinkingLevel: "LOW",
    });
    expect(thinkingConfigForModel("custom-compatible-model")).toBeUndefined();
  });

  it("removes unsupported schema keywords while preserving property names", () => {
    expect(
      sanitizeGeminiJsonSchema({
        $schema: "http://json-schema.org/draft-07/schema#",
        additionalProperties: false,
        properties: {
          summary: {
            maxLength: 800,
            minLength: 1,
            type: "string",
          },
        },
        required: ["summary"],
        type: "object",
      }),
    ).toEqual({
      additionalProperties: false,
      properties: {
        summary: {
          type: "string",
        },
      },
      required: ["summary"],
      type: "object",
    });
  });

  it("sends JSON Schema output configuration and the abort signal", async () => {
    let captured: GenerateContentParameters | null = null;
    const client = {
      models: {
        generateContent(parameters: GenerateContentParameters) {
          captured = parameters;
          return Promise.resolve({ text: '{"title":"Safe event"}' });
        },
      },
    };
    const provider = new GeminiProvider({
      apiKey: "test-key",
      client,
      model: "configured-model",
    });
    const controller = new AbortController();

    await expect(
      provider.generate(request, controller.signal),
    ).resolves.toBe('{"title":"Safe event"}');
    expect(captured).toMatchObject({
      config: {
        abortSignal: controller.signal,
        responseJsonSchema: sanitizeGeminiJsonSchema(request.jsonSchema),
        responseMimeType: "application/json",
      },
      contents: request.userPrompt,
      model: "configured-model",
    });
  });

  it("rejects an empty provider response", async () => {
    const provider = new GeminiProvider({
      apiKey: "test-key",
      client: {
        models: {
          generateContent() {
            return Promise.resolve({ text: " " });
          },
        },
      },
      model: "configured-model",
    });

    await expect(
      provider.generate(request, new AbortController().signal),
    ).rejects.toThrow("no structured output");
  });

  it("converts raw API failures into secret-safe categories", async () => {
    const provider = new GeminiProvider({
      apiKey: "test-key",
      client: {
        models: {
          generateContent() {
            return Promise.reject(
              new ApiError({ message: "raw provider detail", status: 429 }),
            );
          },
        },
      },
      model: "configured-model",
    });

    await expect(
      provider.generate(request, new AbortController().signal),
    ).rejects.toEqual(new AiProviderError("quota"));
  });

  it("recognizes status-bearing SDK errors without exposing their message", async () => {
    const provider = new GeminiProvider({
      apiKey: "test-key",
      client: {
        models: {
          generateContent() {
            return Promise.reject({
              message: "sensitive raw detail",
              statusCode: 403,
            });
          },
        },
      },
      model: "configured-model",
    });

    await expect(
      provider.generate(request, new AbortController().signal),
    ).rejects.toEqual(new AiProviderError("authentication"));
  });
});
