import { z } from "zod";
import { createCompactGameContext } from "@/server/ai/context";
import {
  createFallbackEvent,
  createFallbackFinalSummary,
  createFallbackMemory,
  createFallbackWorld,
} from "@/server/ai/fallbacks";
import { AI_FALLBACK_MESSAGE } from "@/lib/ai-messages";
import { convertEventProposal, validateGeneratedContent } from "@/server/ai/policy";
import { buildAiPrompts } from "@/server/ai/prompts";
import type { AiProvider } from "@/server/ai/providers/types";
import { parseProviderJson } from "@/server/ai/repair";
import {
  eventGenerationSchema,
  finalSummarySchema,
  memoryUpdateSchema,
  worldGenerationSchema,
} from "@/server/ai/schemas";
import type {
  AiTask,
  EventGeneration,
  FinalSummary,
  MemoryUpdate,
  WorldGeneration,
} from "@/server/ai/schemas";
import type {
  GameAction,
  GameState,
  LocalGameEvent,
} from "@/domain/game/types";

export type AiDiagnosticCode =
  | "provider-disabled"
  | "provider-error"
  | "timeout"
  | "invalid-json"
  | "schema-invalid"
  | "policy-rejected";

export interface AiDiagnostics {
  readonly attempts: number;
  readonly codes: readonly AiDiagnosticCode[];
  readonly provider: string | null;
  readonly repairAttempted: boolean;
}

export interface AiResult<T> {
  readonly data: T;
  readonly diagnostics: AiDiagnostics;
  readonly source: "provider" | "fallback";
  readonly userMessage: string | null;
}

export interface AiDirectorOptions {
  readonly provider: AiProvider | null;
  readonly timeoutMs?: number;
}

class AiRequestTimeoutError extends Error {
  constructor() {
    super("The AI provider request timed out.");
    this.name = "AiRequestTimeoutError";
  }
}

interface TaskConfig<TProposal, TResult> {
  readonly fallback: () => TResult;
  readonly schema: z.ZodType<TProposal>;
  readonly task: AiTask;
  readonly transform: (proposal: TProposal) => TResult;
}

async function callWithTimeout(
  provider: AiProvider,
  request: Parameters<AiProvider["generate"]>[0],
  timeoutMs: number,
): Promise<string> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new AiRequestTimeoutError());
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      provider.generate(request, controller.signal),
      timeout,
    ]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

function classifyFailure(error: unknown): AiDiagnosticCode {
  if (error instanceof AiRequestTimeoutError) {
    return "timeout";
  }
  if (error instanceof SyntaxError || error instanceof z.ZodError) {
    return error instanceof z.ZodError ? "schema-invalid" : "invalid-json";
  }
  if (error instanceof Error && error.name === "AiJsonError") {
    return "invalid-json";
  }
  if (error instanceof Error && error.name === "AiPolicyError") {
    return "policy-rejected";
  }
  return "provider-error";
}

export class AiDirector {
  private readonly provider: AiProvider | null;
  private readonly timeoutMs: number;

  constructor(options: AiDirectorOptions) {
    this.provider = options.provider;
    this.timeoutMs = options.timeoutMs ?? 8_000;
  }

  private async run<TProposal, TResult>(
    state: GameState,
    action: GameAction | null,
    config: TaskConfig<TProposal, TResult>,
  ): Promise<AiResult<TResult>> {
    if (!this.provider) {
      return {
        data: config.fallback(),
        diagnostics: {
          attempts: 0,
          codes: ["provider-disabled"],
          provider: null,
          repairAttempted: false,
        },
        source: "fallback",
        userMessage: AI_FALLBACK_MESSAGE,
      };
    }

    const prompts = buildAiPrompts(
      config.task,
      createCompactGameContext(state, action),
    );
    const jsonSchema = z.toJSONSchema(config.schema, {
      target: "draft-7",
    }) as Readonly<Record<string, unknown>>;
    const codes: AiDiagnosticCode[] = [];
    let repairAttempted = false;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const raw = await callWithTimeout(
          this.provider,
          {
            jsonSchema,
            schemaName: `ruleshift_${config.task.replace("-", "_")}`,
            systemPrompt: prompts.systemPrompt,
            task: config.task,
            userPrompt: prompts.userPrompt,
          },
          this.timeoutMs,
        );
        const parsed = parseProviderJson(raw, !repairAttempted);
        repairAttempted ||= parsed.repaired;
        const proposal = config.schema.parse(parsed.value);
        validateGeneratedContent(proposal);
        return {
          data: config.transform(proposal),
          diagnostics: {
            attempts: attempt,
            codes,
            provider: this.provider.name,
            repairAttempted,
          },
          source: "provider",
          userMessage: null,
        };
      } catch (error) {
        const code = classifyFailure(error);
        codes.push(code);
        if (
          error instanceof Error &&
          error.name === "AiJsonError" &&
          !repairAttempted
        ) {
          repairAttempted = true;
        }
      }
    }

    return {
      data: config.fallback(),
      diagnostics: {
        attempts: 2,
        codes,
        provider: this.provider.name,
        repairAttempted,
      },
      source: "fallback",
      userMessage: AI_FALLBACK_MESSAGE,
    };
  }

  generateEvent(
    state: GameState,
    action: GameAction,
  ): Promise<AiResult<LocalGameEvent>> {
    return this.run<EventGeneration, LocalGameEvent>(state, action, {
      fallback: () => createFallbackEvent(state, action),
      schema: eventGenerationSchema,
      task: "event",
      transform: (proposal) => convertEventProposal(proposal, state),
    });
  }

  generateFinalSummary(
    state: GameState,
  ): Promise<AiResult<FinalSummary>> {
    return this.run(state, null, {
      fallback: () => createFallbackFinalSummary(state),
      schema: finalSummarySchema,
      task: "final-summary",
      transform: (proposal) => proposal,
    });
  }

  generateMemory(state: GameState): Promise<AiResult<MemoryUpdate>> {
    return this.run(state, null, {
      fallback: () => createFallbackMemory(state),
      schema: memoryUpdateSchema,
      task: "memory",
      transform: (proposal) => proposal,
    });
  }

  generateWorld(state: GameState): Promise<AiResult<WorldGeneration>> {
    return this.run(state, null, {
      fallback: () => createFallbackWorld(state),
      schema: worldGenerationSchema,
      task: "world",
      transform: (proposal) => proposal,
    });
  }
}
