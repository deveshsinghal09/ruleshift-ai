import {
  ApiError,
  GoogleGenAI,
  ThinkingLevel,
} from "@google/genai";
import type {
  GenerateContentConfig,
  GenerateContentParameters,
} from "@google/genai";
import type {
  AiProvider,
  AiProviderRequest,
} from "@/server/ai/providers/types";
import {
  AiProviderError,
} from "@/server/ai/providers/types";

interface GeminiGenerationClient {
  readonly models: {
    generateContent(
      parameters: GenerateContentParameters,
    ): Promise<{ readonly text?: string }>;
  };
}

const supportedSchemaKeywords = new Set([
  "$anchor",
  "$defs",
  "$id",
  "$ref",
  "additionalProperties",
  "anyOf",
  "description",
  "enum",
  "format",
  "items",
  "maxItems",
  "maximum",
  "minItems",
  "minimum",
  "oneOf",
  "prefixItems",
  "properties",
  "propertyOrdering",
  "required",
  "title",
  "type",
]);

export function sanitizeGeminiJsonSchema(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeGeminiJsonSchema);
  }
  if (!value || typeof value !== "object") {
    return value;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (!supportedSchemaKeywords.has(key)) {
      continue;
    }
    if (
      (key === "properties" || key === "$defs") &&
      child &&
      typeof child === "object" &&
      !Array.isArray(child)
    ) {
      sanitized[key] = Object.fromEntries(
        Object.entries(child).map(([propertyName, propertySchema]) => [
          propertyName,
          sanitizeGeminiJsonSchema(propertySchema),
        ]),
      );
      continue;
    }
    sanitized[key] = sanitizeGeminiJsonSchema(child);
  }
  return sanitized;
}

export interface GeminiProviderOptions {
  readonly apiKey: string;
  readonly client?: GeminiGenerationClient;
  readonly model: string;
}

function providerStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") {
    return null;
  }
  for (const key of ["status", "statusCode"] as const) {
    const value = Reflect.get(error, key);
    if (typeof value === "number" && Number.isInteger(value)) {
      return value;
    }
  }
  return null;
}

function failureCodeFromStatus(
  status: number,
): AiProviderError["code"] {
  if (status === 401 || status === 403) {
    return "authentication";
  }
  if (status === 429) {
    return "quota";
  }
  if (status >= 500) {
    return "unavailable";
  }
  return "request";
}

function failureCodeFromUnknownError(
  error: Error,
): AiProviderError["code"] {
  const message = error.message.toLowerCase();
  if (
    message.includes("api key") ||
    message.includes("permission") ||
    message.includes("unauth")
  ) {
    return "authentication";
  }
  if (
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("resource exhausted")
  ) {
    return "quota";
  }
  if (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("timed out")
  ) {
    return "unavailable";
  }
  return "request";
}

export function thinkingConfigForModel(
  model: string,
): GenerateContentConfig["thinkingConfig"] {
  const normalized = model.toLowerCase();
  if (normalized.includes("gemini-2.5")) {
    return normalized.includes("pro")
      ? { thinkingBudget: 128 }
      : { thinkingBudget: 0 };
  }
  if (/gemini-3(?:[.-]|$)/u.test(normalized)) {
    return { thinkingLevel: ThinkingLevel.LOW };
  }
  return undefined;
}

export class GeminiProvider implements AiProvider {
  readonly name = "gemini";
  private readonly client: GeminiGenerationClient;
  private readonly model: string;

  constructor(options: GeminiProviderOptions) {
    this.client =
      options.client ??
      new GoogleGenAI({
        apiKey: options.apiKey,
      });
    this.model = options.model;
  }

  async generate(
    request: AiProviderRequest,
    signal: AbortSignal,
  ): Promise<string> {
    let response: { readonly text?: string };
    try {
      response = await this.client.models.generateContent({
        config: {
          abortSignal: signal,
          responseJsonSchema: sanitizeGeminiJsonSchema(request.jsonSchema),
          responseMimeType: "application/json",
          systemInstruction: `${request.systemPrompt}\nStructured output contract: ${request.schemaName}.`,
          thinkingConfig: thinkingConfigForModel(this.model),
        },
        contents: request.userPrompt,
        model: this.model,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw new AiProviderError(failureCodeFromStatus(error.status));
      }
      const status = providerStatus(error);
      if (status !== null) {
        throw new AiProviderError(failureCodeFromStatus(status));
      }
      if (error instanceof Error) {
        throw new AiProviderError(failureCodeFromUnknownError(error));
      }
      throw error;
    }
    const output = response.text?.trim();
    if (!output) {
      throw new Error("The AI provider returned no structured output.");
    }
    return output;
  }
}
