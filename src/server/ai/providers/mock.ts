import type {
  AiProvider,
  AiProviderRequest,
} from "@/server/ai/providers/types";

export type MockProviderResponse =
  | string
  | Error
  | ((request: AiProviderRequest, signal: AbortSignal) => Promise<string>);

export class MockAiProvider implements AiProvider {
  readonly name = "mock";
  readonly requests: AiProviderRequest[] = [];
  private readonly responses: MockProviderResponse[];

  constructor(responses: readonly MockProviderResponse[]) {
    this.responses = [...responses];
  }

  async generate(
    request: AiProviderRequest,
    signal: AbortSignal,
  ): Promise<string> {
    this.requests.push(request);
    const response = this.responses.shift();
    if (response === undefined) {
      throw new Error("No recorded mock response remains.");
    }
    if (response instanceof Error) {
      throw response;
    }
    return typeof response === "function"
      ? response(request, signal)
      : response;
  }
}
