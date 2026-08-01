import type {
  AiProvider,
  AiProviderRequest,
} from "@/server/ai/providers/types";

const responses = {
  event: {
    badge: "Mock AI signal",
    choices: [
      {
        effects: [{ intensity: "minor", kind: "progress_objective" }],
        kind: "move",
        label: "Follow the fixture signal",
        risk: "safe",
      },
      {
        effects: [{ intensity: "minor", kind: "restore_energy" }],
        kind: "inspect",
        label: "Inspect the validated response",
        risk: "bold",
      },
    ],
    dmAside: "This scene came from the deterministic browser-test provider.",
    item: null,
    kind: "exploration",
    narration:
      "A bounded mock proposal passes through the same schema and policy gates as a live provider response.",
    rule: null,
    title: "Mock reality compiles a new corridor",
  },
  "final-summary": {
    mostCreativeAction: "Following a fully validated test signal.",
    summary: "The deterministic fixture completed its bounded assignment.",
    title: "The mock timeline resolves",
  },
  memory: {
    summary: "The player followed a deterministic fixture signal.",
  },
  world: {
    description: "A deterministic world reserved for automated browser tests.",
    objectiveDescription: "Complete the fixture without external services.",
    objectiveTitle: "Validate the mock timeline",
    openingNarration: "The isolated test world initializes without a credential.",
    title: "Fixture Campus",
  },
} as const;

/**
 * A non-network provider for contract and browser testing. Selection is blocked
 * in production by the provider configuration boundary.
 */
export class DeterministicFixtureAiProvider implements AiProvider {
  readonly name = "deterministic-fixture";

  async generate(
    request: AiProviderRequest,
    signal: AbortSignal,
  ): Promise<string> {
    if (signal.aborted) {
      throw new DOMException("The fixture request was aborted.", "AbortError");
    }
    return JSON.stringify(responses[request.task]);
  }
}
