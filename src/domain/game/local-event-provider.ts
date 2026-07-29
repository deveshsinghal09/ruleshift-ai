import { randomItem } from "@/domain/game/seeded-random";
import type {
  Effect,
  EventKind,
  EventProvider,
  GameAction,
  GameState,
  InventoryItem,
  LocalGameEvent,
} from "@/domain/game/types";

export const questionableResumeItem: InventoryItem = {
  consumable: false,
  description:
    "Adds six years of experience to a technology invented yesterday.",
  effects: [{ amount: 20, reason: "Legendary résumé", type: "score" }],
  id: "questionable-resume",
  name: "Résumé of Questionable Experience",
  quantity: 1,
  rarity: "legendary",
  stackable: false,
  usesPerItem: 1,
  usesRemaining: 1,
};

export const goldenOfferLetterItem: InventoryItem = {
  consumable: false,
  description:
    "Proof that the Haunted Campus finally released its hold on your future.",
  effects: [],
  id: "golden-offer-letter",
  name: "Golden Offer Letter",
  quantity: 1,
  rarity: "legendary",
  stackable: false,
  usesPerItem: 0,
  usesRemaining: 0,
};

const objectiveProgress = (amount: number): Effect => ({
  amount,
  objectiveId: "golden-offer",
  type: "objective-progress",
});

const baseAction = {
  available: true,
  effects: [],
  risk: "safe",
} as const;

export function createInitialLocalEvent(): LocalGameEvent {
  return {
    badge: "Exploration",
    choices: [
      {
        ...baseAction,
        destination: "assessment-archive",
        effects: [objectiveProgress(20)],
        energyCost: 8,
        id: "follow-bell",
        kind: "move",
        label: "Follow the bell into the archive",
      },
      {
        ...baseAction,
        effects: [objectiveProgress(15)],
        energyCost: 10,
        id: "question-map",
        insight: 18,
        kind: "inspect",
        label: "Interrogate the campus map",
        risk: "bold",
        targetId: "campus-map",
      },
      {
        ...baseAction,
        destination: "faculty-of-algorithms",
        effects: [
          { amount: -22, type: "player-health" },
          { amount: -4, type: "world-stability" },
          objectiveProgress(20),
        ],
        energyCost: 14,
        id: "kick-door",
        kind: "move",
        label: "Kick open the Faculty of Algorithms",
        risk: "wild",
      },
    ],
    dmAside:
      "The campus has scheduled your future for Room ∞. It did not include directions.",
    id: "campus-gates",
    kind: "exploration",
    narration:
      "Rain falls upward across the Haunted Campus of Infinite Assessments. Every corridor ends at a placement test, and somewhere beyond the faculty tower waits the Golden Offer Letter.",
    title: "The attendance bell rings for you",
  };
}

function createCombatEvent(): LocalGameEvent {
  return {
    badge: "Enemy encounter",
    choices: [
      {
        ...baseAction,
        baseDamage: 30,
        effects: [objectiveProgress(25)],
        energyCost: 10,
        id: "answer-zero",
        kind: "attack",
        label: "Answer: O(1), confidently and incorrectly",
        risk: "bold",
        targetId: "infinite-examiner",
      },
      {
        ...baseAction,
        baseDamage: 36,
        effects: [objectiveProgress(25)],
        energyCost: 12,
        id: "binary-search",
        kind: "attack",
        label: "Binary-search the examiner’s patience",
        targetId: "infinite-examiner",
      },
      {
        ...baseAction,
        armor: 16,
        effects: [objectiveProgress(18)],
        energyCost: 9,
        id: "invert-whiteboard",
        kind: "defend",
        label: "Turn the whiteboard upside down",
        risk: "wild",
      },
    ],
    dmAside:
      "The examiner grades confidence, complexity, and whether you remembered breakfast.",
    enemyId: "infinite-examiner",
    id: "binary-examiner",
    kind: "combat",
    narration:
      "The Infinite Examiner unfolds from a whiteboard and demands the midpoint of an array with no end. Its rubric is alive, hostile, and surprisingly sensitive to wrong answers.",
    title: "A binary-search challenge blocks the quad",
  };
}

function createPuzzleEvent(state: GameState): LocalGameEvent {
  const examinerIsActive = state.enemies.some(
    (enemy) =>
      enemy.id === "infinite-examiner" && enemy.status === "active",
  );
  const attackChoices: readonly GameAction[] = examinerIsActive
    ? [
        {
          ...baseAction,
          baseDamage: 42,
          effects: [objectiveProgress(30)],
          energyCost: 12,
          id: "weaponize-error",
          kind: "attack",
          label: "Weaponize a spectacularly wrong answer",
          risk: "bold",
          targetId: "infinite-examiner",
        },
        {
          ...baseAction,
          baseDamage: 45,
          effects: [objectiveProgress(30)],
          energyCost: 16,
          id: "submit-resume",
          kind: "attack",
          label: "Submit a résumé with twelve pages",
          risk: "wild",
          targetId: "infinite-examiner",
        },
      ]
    : [
        {
          ...baseAction,
          destination: "final-interview",
          effects: [objectiveProgress(25)],
          energyCost: 9,
          id: "follow-corrupted-rubric",
          kind: "move",
          label: "Follow the corrupted rubric to the final interview",
          risk: "bold",
        },
      ];

  return {
    announcement: {
      description:
        "Incorrect answers now deal registered, deterministic damage to the examiner.",
      id: "incorrectly-correct-preview",
      name: "Incorrectly Correct",
      parameters: { damage: 24 },
      ruleKey: "wrong_answers_hurt_enemies",
      totalTurns: 3,
      type: "ruleshift-preview",
    },
    badge: "Reality anomaly",
    choices: [
      ...attackChoices.slice(0, 1),
      {
        ...baseAction,
        effects: [
          { amount: -40, type: "player-health" },
          objectiveProgress(22),
        ],
        energyCost: 8,
        id: "compliment-complexity",
        insight: 16,
        kind: "inspect",
        label: "Compliment its asymptotic complexity",
        risk: "wild",
        targetId: "infinite-examiner",
      },
      ...attackChoices.slice(1),
    ],
    dmAside:
      "Reality changed the rubric, but the registered deterministic engine is still in charge.",
    enemyId: "infinite-examiner",
    id: "incorrect-damage-preview",
    kind: "puzzle",
    narration:
      "The campus compiler stutters. A magenta seam cuts through the exam hall, and wrong answers become registered weapons.",
    title: "An unstable rubric interrupts the assessment",
  };
}

function rewardEffects(): readonly Effect[] {
  return [
    objectiveProgress(100),
    {
      item: goldenOfferLetterItem,
      quantity: 1,
      type: "inventory-add",
    },
    { amount: 20, type: "player-energy" },
    { amount: 8, type: "player-health" },
  ];
}

function createRewardEvent(): LocalGameEvent {
  return {
    badge: "Objective update",
    choices: [
      {
        ...baseAction,
        effects: rewardEffects(),
        energyCost: 8,
        id: "open-letter",
        kind: "accept-quest",
        label: "Open the Golden Offer Letter",
        objectiveId: "golden-offer",
      },
      {
        ...baseAction,
        effects: rewardEffects(),
        energyCost: 11,
        id: "negotiate-title",
        kind: "talk",
        label: "Negotiate for “Senior Chosen One”",
        relationshipChange: 12,
        risk: "bold",
        targetId: "dean-deferred-dreams",
      },
      {
        ...baseAction,
        effects: rewardEffects(),
        energyCost: 6,
        id: "thank-examiner",
        kind: "talk",
        label: "Thank the examiner for the bug report",
        relationshipChange: 8,
        targetId: "dean-deferred-dreams",
      },
    ],
    dmAside:
      "The letter is real. The compensation package appears to include dental and destiny.",
    id: "golden-offer-event",
    kind: "reward",
    narration:
      "Beyond the corrupted rubric, the Dean of Deferred Dreams presents the Golden Offer Letter and a résumé no honest recruiter would believe.",
    npcId: "dean-deferred-dreams",
    title: "The final interview has only one question",
  };
}

function genericChoices(
  kind: EventKind,
  state: GameState,
): readonly GameAction[] {
  const activeEnemy =
    state.enemies.find((enemy) => enemy.status === "active") ??
    state.enemies[0];
  const objective =
    state.objectives.find((candidate) => candidate.status !== "completed") ??
    state.objectives[0];
  const npc = state.npcs[0];
  const suffix = `${kind}-${state.turn}`;

  switch (kind) {
    case "combat":
      return [
        {
          ...baseAction,
          baseDamage: 18,
          energyCost: 8,
          id: `attack-${suffix}`,
          kind: "attack",
          label: "Strike the immediate threat",
          targetId: activeEnemy.id,
        },
        {
          ...baseAction,
          effects: [],
          energyCost: 6,
          escapeChance: 0.55,
          id: `escape-${suffix}`,
          kind: "run-away",
          label: "Find a deterministic exit",
          risk: "bold",
          targetId: activeEnemy.id,
        },
      ];
    case "dialogue":
      return [
        {
          ...baseAction,
          energyCost: 5,
          id: `talk-${suffix}`,
          kind: "talk",
          label: "Ask what the campus remembers",
          relationshipChange: 8,
          targetId: npc.id,
        },
        {
          ...baseAction,
          energyCost: 4,
          id: `inspect-${suffix}`,
          insight: 10,
          kind: "inspect",
          label: "Read the pauses between answers",
          targetId: npc.id,
        },
      ];
    case "quest":
      return [
        {
          ...baseAction,
          energyCost: 4,
          id: `accept-${suffix}`,
          kind: "accept-quest",
          label: "Accept the new objective",
          objectiveId: objective.id,
        },
        {
          ...baseAction,
          energyCost: 2,
          id: `reject-${suffix}`,
          kind: "reject-quest",
          label: "Reject the detour",
          objectiveId: objective.id,
          risk: "bold",
        },
      ];
    case "reward":
      return [
        {
          ...baseAction,
          effects: [{ amount: 12, type: "player-energy" }],
          energyCost: 0,
          energyRecovery: 8,
          healthRecovery: 4,
          id: `rest-${suffix}`,
          kind: "rest",
          label: "Take the quiet reward",
        },
        {
          ...baseAction,
          energyCost: 3,
          id: `thank-${suffix}`,
          kind: "talk",
          label: "Thank the unlikely ally",
          relationshipChange: 6,
          targetId: npc.id,
        },
      ];
    case "trap":
      return [
        {
          ...baseAction,
          destination: "safe-tile",
          effects: [{ amount: -8, type: "player-health" }],
          energyCost: 7,
          id: `move-${suffix}`,
          kind: "move",
          label: "Cross before the floor resets",
          risk: "bold",
        },
        {
          ...baseAction,
          armor: 12,
          energyCost: 5,
          id: `defend-${suffix}`,
          kind: "defend",
          label: "Brace against the trap",
        },
      ];
    case "puzzle":
      return [
        {
          ...baseAction,
          energyCost: 5,
          id: `inspect-${suffix}`,
          insight: 14,
          kind: "inspect",
          label: "Inspect the puzzle’s invariant",
          targetId: "local-puzzle",
        },
        {
          ...baseAction,
          destination: "alternate-solution",
          energyCost: 7,
          id: `move-${suffix}`,
          kind: "move",
          label: "Try the alternate solution",
          risk: "bold",
        },
      ];
    case "exploration":
      return [
        {
          ...baseAction,
          destination: "next-corridor",
          energyCost: 5,
          id: `move-${suffix}`,
          kind: "move",
          label: "Follow the clearest signal",
        },
        {
          ...baseAction,
          energyCost: 4,
          id: `inspect-${suffix}`,
          insight: 9,
          kind: "inspect",
          label: "Inspect the impossible landmark",
          targetId: "world-landmark",
        },
      ];
  }
}

function createGenericEvent(kind: EventKind, state: GameState): LocalGameEvent {
  return {
    badge: kind[0].toUpperCase() + kind.slice(1),
    choices: genericChoices(kind, state),
    dmAside: "The local event provider selected this scene from a safe registry.",
    enemyId: kind === "combat" ? state.enemies[0].id : undefined,
    id: `local-${kind}-${state.turn}`,
    kind,
    narration:
      "The deterministic fallback world assembles another clear challenge from local data.",
    npcId:
      kind === "dialogue" || kind === "reward"
        ? state.npcs[0].id
        : undefined,
    title: `A ${kind} event enters the timeline`,
  };
}

const supportedKinds: readonly EventKind[] = [
  "exploration",
  "dialogue",
  "combat",
  "puzzle",
  "quest",
  "reward",
  "trap",
];

export class DeterministicLocalEventProvider implements EventProvider {
  generateNextEvent(input: {
    readonly previousEventKind: EventKind;
    readonly randomState: number;
    readonly state: GameState;
  }): { readonly event: LocalGameEvent; readonly randomState: number } {
    const scriptedEvent =
      input.state.turn === 1
        ? createCombatEvent()
        : input.state.turn === 2
          ? createPuzzleEvent(input.state)
          : input.state.turn === 3
            ? createRewardEvent()
            : null;
    if (
      scriptedEvent &&
      scriptedEvent.kind !== input.previousEventKind
    ) {
      return { event: scriptedEvent, randomState: input.randomState };
    }

    const hasActiveEnemy = input.state.enemies.some(
      (enemy) => enemy.status === "active",
    );
    const hasOpenObjective = input.state.objectives.some(
      (objective) =>
        objective.status === "available" || objective.status === "active",
    );
    const candidates = supportedKinds.filter(
      (kind) =>
        kind !== input.previousEventKind &&
        (kind !== "combat" || hasActiveEnemy) &&
        (kind !== "quest" || hasOpenObjective),
    );
    const selection = randomItem(input.randomState, candidates);
    return {
      event: createGenericEvent(selection.value, input.state),
      randomState: selection.state,
    };
  }
}

export const localEventProvider = new DeterministicLocalEventProvider();
