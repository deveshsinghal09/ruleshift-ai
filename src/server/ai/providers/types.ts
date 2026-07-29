import type { AiTask } from "@/server/ai/schemas";

export interface AiProviderRequest {
  readonly jsonSchema: Readonly<Record<string, unknown>>;
  readonly schemaName: string;
  readonly systemPrompt: string;
  readonly task: AiTask;
  readonly userPrompt: string;
}

export interface AiProvider {
  readonly name: string;
  generate(
    request: AiProviderRequest,
    signal: AbortSignal,
  ): Promise<string>;
}
