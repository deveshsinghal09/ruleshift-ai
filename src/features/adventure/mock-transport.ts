import {
  demoTurns,
  resumeItem,
} from "@/features/adventure/mock-data";
import {
  clearCharacterDraft,
  loadMockSession,
  saveMockSession,
} from "@/features/adventure/storage";
import type {
  CharacterPassport,
  GameEvent,
  MockAdventureTransport,
  MockGameState,
  SubmitActionRequest,
} from "@/features/adventure/types";

const worldTitle = "Haunted Campus of Infinite Assessments";
const objective = "Claim the Golden Offer Letter";

interface MockTransportOptions {
  delayMs?: number;
  idFactory?: () => string;
}

function initialStats(passport: CharacterPassport): {
  energy: number;
  health: number;
} {
  if (passport.difficulty === "easy") {
    return { energy: 100, health: 100 };
  }

  if (passport.difficulty === "hard") {
    return { energy: 85, health: 82 };
  }

  return { energy: 96, health: 94 };
}

function createEvent(
  turn: number,
  title: string,
  description: string,
  tone: GameEvent["tone"],
): GameEvent {
  const eventSlug = title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");

  return {
    description,
    id: `event-${turn}-${tone}-${eventSlug}`,
    title,
    tone,
    turn,
  };
}

function actionLabelFor(
  state: MockGameState,
  request: SubmitActionRequest,
): string {
  if (request.customAction?.trim()) {
    return request.customAction.trim();
  }

  const scene = demoTurns[state.turnIndex];
  return (
    scene?.actions.find((action) => action.id === request.actionId)?.label ??
    "Choose the uncertain path"
  );
}

function resolveTurn(
  state: MockGameState,
  request: SubmitActionRequest,
): MockGameState {
  const actionLabel = actionLabelFor(state, request);
  const isCustom = Boolean(request.customAction?.trim());
  const action = demoTurns[state.turnIndex]?.actions.find(
    (candidate) => candidate.id === request.actionId,
  );
  const energyCost = action?.energyCost ?? 11;
  const nextIndex = Math.min(state.turnIndex + 1, demoTurns.length - 1);
  const nextTurnNumber = state.turnsTaken + 1;
  const processedRequestIds = [...state.processedRequestIds, request.requestId];

  if (state.turnIndex === 0) {
    return {
      ...state,
      energy: Math.max(0, state.energy - energyCost),
      lastAction: actionLabel,
      objectiveProgress: 20,
      processedRequestIds,
      score: state.score + (isCustom ? 90 : 70),
      timeline: [
        ...state.timeline,
        createEvent(
          nextTurnNumber,
          "Entered the assessment wing",
          `${actionLabel}. The campus answered with a locked exam hall.`,
          "exploration",
        ),
      ],
      turnIndex: nextIndex,
      turnsTaken: nextTurnNumber,
    };
  }

  if (state.turnIndex === 1) {
    return {
      ...state,
      activeRule: {
        description:
          "Incorrect answers damage enemies. Correct answers restore their confidence.",
        id: "incorrect-damage",
        name: "Incorrectly Correct",
        remainingTurns: 3,
        totalTurns: 3,
      },
      energy: Math.max(0, state.energy - energyCost),
      health: Math.max(1, state.health - 6),
      lastAction: actionLabel,
      objectiveProgress: 45,
      processedRequestIds,
      score: state.score + (isCustom ? 150 : 120),
      showRuleShift: true,
      timeline: [
        ...state.timeline,
        createEvent(
          nextTurnNumber,
          "Binary-search challenge survived",
          `${actionLabel}. The examiner lost 36 integrity while reality rewrote the rubric.`,
          "encounter",
        ),
        createEvent(
          nextTurnNumber,
          "RuleShift: Incorrectly Correct",
          "For three turns, wrong answers became the safest weapons.",
          "ruleshift",
        ),
      ],
      turnIndex: nextIndex,
      turnsTaken: nextTurnNumber,
    };
  }

  if (state.turnIndex === 2) {
    return {
      ...state,
      activeRule: state.activeRule
        ? {
            ...state.activeRule,
            remainingTurns: Math.max(0, state.activeRule.remainingTurns - 1),
          }
        : null,
      energy: Math.max(0, state.energy - energyCost),
      inventory: state.inventory.some((item) => item.id === resumeItem.id)
        ? state.inventory
        : [...state.inventory, resumeItem],
      lastAction: actionLabel,
      objectiveProgress: 78,
      processedRequestIds,
      score: state.score + (isCustom ? 210 : 170),
      timeline: [
        ...state.timeline,
        createEvent(
          nextTurnNumber,
          "The examiner failed its own assessment",
          `${actionLabel}. A legendary résumé dropped from the corrupted rubric.`,
          "reward",
        ),
        createEvent(
          nextTurnNumber,
          "Item collected",
          resumeItem.name,
          "reward",
        ),
      ],
      turnIndex: nextIndex,
      turnsTaken: nextTurnNumber,
    };
  }

  return {
    ...state,
    activeRule: state.activeRule
      ? {
          ...state.activeRule,
          remainingTurns: Math.max(0, state.activeRule.remainingTurns - 1),
        }
      : null,
    energy: Math.min(100, Math.max(0, state.energy - energyCost + 20)),
    health: Math.min(100, state.health + 8),
    lastAction: actionLabel,
    objectiveProgress: 100,
    processedRequestIds,
    rulesSurvived: 1,
    score: state.score + (isCustom ? 300 : 240),
    status: "victory",
    timeline: [
      ...state.timeline,
      createEvent(
        nextTurnNumber,
        "Golden Offer Letter claimed",
        `${actionLabel}. The campus released its hold on your future and restored 20 energy.`,
        "objective",
      ),
    ],
    turnsTaken: nextTurnNumber,
  };
}

export function createMockAdventureTransport(
  options: MockTransportOptions = {},
): MockAdventureTransport {
  const delayMs = options.delayMs ?? 420;
  const idFactory =
    options.idFactory ??
    (() =>
      globalThis.crypto?.randomUUID?.() ??
      `demo-${Date.now().toString(36)}`);
  const pendingSessions = new Set<string>();

  async function pause(): Promise<void> {
    if (delayMs <= 0) {
      return;
    }

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, delayMs);
    });
  }

  return {
    async createSession(passport) {
      await pause();
      const sessionId = idFactory();
      const stats = initialStats(passport);
      const state: MockGameState = {
        activeRule: null,
        character: passport,
        energy: stats.energy,
        health: stats.health,
        inventory: [],
        lastAction: null,
        objective,
        objectiveProgress: 0,
        processedRequestIds: [],
        rulesSurvived: 0,
        score: 0,
        sessionId,
        showRuleShift: false,
        status: "playing",
        timeline: [
          createEvent(
            0,
            "Adventure initialized",
            `${passport.name} entered ${worldTitle}.`,
            "exploration",
          ),
        ],
        turnIndex: 0,
        turnsTaken: 0,
        worldTitle,
      };

      saveMockSession(state);
      clearCharacterDraft();
      return state;
    },

    async dismissRuleShift(sessionId) {
      const state = loadMockSession(sessionId);
      if (!state) {
        throw new Error("This adventure session could not be restored.");
      }

      const nextState = { ...state, showRuleShift: false };
      saveMockSession(nextState);
      return nextState;
    },

    async getSession(sessionId) {
      await pause();
      return loadMockSession(sessionId);
    },

    async submitAction(sessionId, request) {
      if (pendingSessions.has(sessionId)) {
        throw new Error("That turn is already being resolved.");
      }

      const current = loadMockSession(sessionId);
      if (!current) {
        throw new Error("This adventure session could not be restored.");
      }

      if (current.processedRequestIds.includes(request.requestId)) {
        return current;
      }

      if (current.status !== "playing") {
        return current;
      }

      pendingSessions.add(sessionId);
      try {
        await pause();
        const latest = loadMockSession(sessionId) ?? current;
        if (latest.processedRequestIds.includes(request.requestId)) {
          return latest;
        }

        const nextState = resolveTurn(latest, request);
        saveMockSession(nextState);
        return nextState;
      } finally {
        pendingSessions.delete(sessionId);
      }
    },
  };
}
