import OpenAI from "openai";
import type {
  AiProvider,
  AiProviderRequest,
} from "@/server/ai/providers/types";

export interface OpenAiProviderOptions {
  readonly apiKey: string;
  readonly model: string;
  readonly timeoutMs: number;
}

export class OpenAiProvider implements AiProvider {
  readonly name = "openai";
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(options: OpenAiProviderOptions) {
    this.client = new OpenAI({
      apiKey: options.apiKey,
      maxRetries: 0,
      timeout: options.timeoutMs,
    });
    this.model = options.model;
    this.timeoutMs = options.timeoutMs;
  }

  async generate(
    request: AiProviderRequest,
    signal: AbortSignal,
  ): Promise<string> {
    const response = await this.client.responses.create(
      {
        input: [
          {
            content: request.systemPrompt,
            role: "system",
          },
          {
            content: request.userPrompt,
            role: "user",
          },
        ],
        model: this.model,
        store: false,
        text: {
          format: {
            name: request.schemaName,
            schema: request.jsonSchema,
            strict: true,
            type: "json_schema",
          },
        },
      },
      {
        maxRetries: 0,
        signal,
        timeout: this.timeoutMs,
      },
    );
    if (!response.output_text.trim()) {
      throw new Error("The AI provider returned no structured output.");
    }
    return response.output_text;
  }
}
