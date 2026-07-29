import { activateRule } from "@/domain/rules/lifecycle";
import { getRuleDefinition } from "@/domain/rules/registry";
import { validateGameState } from "@/domain/game/schemas";
import type {
  Effect,
  GameAction,
  GameState,
  InventoryItem,
  LocalGameEvent,
} from "@/domain/game/types";
import type {
  ChoiceProposal,
  EventGeneration,
  ProposedEffect,
} from "@/server/ai/schemas";

export type AiPolicyCode =
  | "unsafe-content"
  | "unavailable-target"
  | "invalid-rule"
  | "unplayable-event";

export class AiPolicyError extends Error {
  constructor(
    readonly code: AiPolicyCode,
    message: string,
  ) {
    super(message);
    this.name = "AiPolicyError";
  }
}

const unsafeContentPatterns = [
  /\bignore (all |the |any )?(previous|prior|system|developer) instructions?\b/iu,
  /\b(system|developer) prompt\b/iu,
  /\b([a-z][a-z0-9_]*_api_key|process\.env|api[-_ ]?key|secret value)\b/iu,
  /\b(eval|exec|new function)\s*\(/iu,
  /<\s*script\b|javascript\s*:/iu,
  /\b(change|override|modify|replace)\b.{0,40}\b(schema|policy|instructions?)\b/iu,
  /\b(unregistered|unknown)\b.{0,24}\b(tool|rule)\b/iu,
] as const;

const effectAmounts = {
  damage_enemy: { major: -14, minor: -6, moderate: -10 },
  damage_player: { major: -10, minor: -4, moderate: -7 },
  destabilize_world: { major: -8, minor: -3, moderate: -5 },
  improve_relationship: { major: 12, minor: 5, moderate: 8 },
  progress_objective: { major: 12, minor: 5, moderate: 8 },
  restore_energy: { major: 14, minor: 6, moderate: 10 },
  restore_player: { major: 10, minor: 4, moderate: 7 },
} as const;

const energyCosts = {
  bold: 9,
  safe: 6,
  wild: 12,
} as const;

function assertSafeText(value: string): void {
  if (unsafeContentPatterns.some((pattern) => pattern.test(value))) {
    throw new AiPolicyError(
      "unsafe-content",
      "Generated content crossed the Dungeon Master policy boundary.",
    );
  }
}

export function validateGeneratedContent(value: unknown): void {
  if (typeof value === "string") {
    assertSafeText(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach(validateGeneratedContent);
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach(validateGeneratedContent);
  }
}

function activeEnemy(state: GameState) {
  return state.enemies.find((enemy) => enemy.status === "active");
}

function availableNpc(state: GameState) {
  return state.npcs[0];
}

function activeObjective(state: GameState) {
  return state.objectives.find(
    (objective) =>
      objective.status === "active" || objective.status === "available",
  );
}

function convertEffect(
  proposal: ProposedEffect,
  state: GameState,
): Effect {
  const amount = effectAmounts[proposal.kind][proposal.intensity];
  switch (proposal.kind) {
    case "damage_player":
      return { amount, type: "player-health" };
    case "restore_player":
      return { amount, type: "player-health" };
    case "restore_energy":
      return { amount, type: "player-energy" };
    case "damage_enemy": {
      const enemy = activeEnemy(state);
      if (!enemy) {
        throw new AiPolicyError(
          "unavailable-target",
          "The proposal tried to damage an unavailable enemy.",
        );
      }
      return { amount, enemyId: enemy.id, type: "enemy-health" };
    }
    case "progress_objective": {
      const objective = activeObjective(state);
      if (!objective) {
        throw new AiPolicyError(
          "unavailable-target",
          "The proposal tried to progress an unavailable objective.",
        );
      }
      return {
        amount,
        objectiveId: objective.id,
        type: "objective-progress",
      };
    }
    case "improve_relationship": {
      const npc = availableNpc(state);
      if (!npc) {
        throw new AiPolicyError(
          "unavailable-target",
          "The proposal tried to change an unavailable NPC relationship.",
        );
      }
      return { amount, npcId: npc.id, type: "npc-relationship" };
    }
    case "destabilize_world":
      return { amount, type: "world-stability" };
  }
}

function actionBase(
  proposal: ChoiceProposal,
  state: GameState,
  eventId: string,
  index: number,
) {
  return {
    available: true,
    effects: proposal.effects.map((effect) => convertEffect(effect, state)),
    energyCost: energyCosts[proposal.risk],
    id: `${eventId}-choice-${index + 1}`,
    label: proposal.label,
    risk: proposal.risk,
  } as const;
}

function convertChoice(
  proposal: ChoiceProposal,
  state: GameState,
  eventId: string,
  index: number,
): GameAction {
  const base = actionBase(proposal, state, eventId, index);
  switch (proposal.kind) {
    case "move":
      return {
        ...base,
        destination: `ai-location-${state.turn}-${index + 1}`,
        kind: "move",
      };
    case "attack": {
      const enemy = activeEnemy(state);
      if (!enemy) {
        throw new AiPolicyError(
          "unavailable-target",
          "The proposal offered an attack without an active enemy.",
        );
      }
      return {
        ...base,
        baseDamage: proposal.risk === "wild" ? 18 : 12,
        kind: "attack",
        targetId: enemy.id,
      };
    }
    case "defend":
      return {
        ...base,
        armor: proposal.risk === "safe" ? 12 : 9,
        kind: "defend",
      };
    case "talk": {
      const npc = availableNpc(state);
      if (!npc) {
        throw new AiPolicyError(
          "unavailable-target",
          "The proposal offered dialogue without an available NPC.",
        );
      }
      return {
        ...base,
        kind: "talk",
        relationshipChange: proposal.risk === "wild" ? 6 : 9,
        targetId: npc.id,
      };
    }
    case "inspect":
      return {
        ...base,
        insight: proposal.risk === "wild" ? 14 : 10,
        kind: "inspect",
        targetId: `ai-clue-${state.turn}`,
      };
    case "rest":
      return {
        ...base,
        energyCost: 0,
        energyRecovery: proposal.risk === "wild" ? 8 : 12,
        healthRecovery: proposal.risk === "safe" ? 6 : 3,
        kind: "rest",
      };
    case "run-away": {
      const enemy = activeEnemy(state);
      if (!enemy) {
        throw new AiPolicyError(
          "unavailable-target",
          "The proposal offered escape without an active enemy.",
        );
      }
      return {
        ...base,
        escapeChance: proposal.risk === "safe" ? 0.75 : 0.55,
        kind: "run-away",
        targetId: enemy.id,
      };
    }
  }
}

function safeSlug(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 48);
  return slug || "relic";
}

function convertItem(
  proposal: NonNullable<EventGeneration["item"]>,
  state: GameState,
): InventoryItem {
  return {
    consumable: false,
    description: proposal.description,
    effects: [],
    id: `ai-item-${state.turn}-${safeSlug(proposal.name)}`,
    name: proposal.name,
    quantity: 1,
    rarity: proposal.rarity,
    stackable: false,
    usesPerItem: 0,
    usesRemaining: 0,
  };
}

function attachItemReward(
  choices: readonly GameAction[],
  item: InventoryItem | null,
): readonly GameAction[] {
  if (!item) {
    return choices;
  }
  const first = choices[0];
  if (!first) {
    return choices;
  }
  const reward: Effect = { item, quantity: 1, type: "inventory-add" };
  return [{ ...first, effects: [...first.effects, reward] }, ...choices.slice(1)];
}

function createAnnouncement(
  proposal: NonNullable<EventGeneration["rule"]>,
  state: GameState,
  event: LocalGameEvent,
): NonNullable<LocalGameEvent["announcement"]> {
  const definition = getRuleDefinition(proposal.key);
  const parameters = definition.parameterSchema.parse({});
  const duration = Math.min(3, definition.maximumDuration);
  const announcement = {
    description: definition.description,
    id: `ai-rule-${state.turn}-${definition.key}`,
    name: definition.name,
    parameters,
    ruleKey: definition.key,
    totalTurns: duration,
    type: "ruleshift-preview" as const,
  };

  try {
    activateRule(
      { ...state, currentEvent: event },
      {
        duration,
        id: announcement.id,
        key: definition.key,
        parameters,
      },
      event,
    );
  } catch {
    throw new AiPolicyError(
      "invalid-rule",
      "The proposed RuleShift was rejected by the deterministic registry.",
    );
  }
  return announcement;
}

export function convertEventProposal(
  proposal: EventGeneration,
  state: GameState,
): LocalGameEvent {
  validateGeneratedContent(proposal);
  const eventId = `ai-event-${state.turn}`;
  const choices = attachItemReward(
    proposal.choices.map((choice, index) =>
      convertChoice(choice, state, eventId, index),
    ),
    proposal.item ? convertItem(proposal.item, state) : null,
  );
  if (choices.length < 2 || !choices.some((choice) => choice.available)) {
    throw new AiPolicyError(
      "unplayable-event",
      "The proposal did not leave enough playable choices.",
    );
  }

  const event: LocalGameEvent = {
    badge: proposal.badge,
    choices,
    dmAside: proposal.dmAside,
    enemyId:
      proposal.kind === "combat" ? activeEnemy(state)?.id : undefined,
    id: eventId,
    kind: proposal.kind,
    narration: proposal.narration,
    npcId:
      proposal.kind === "dialogue" ? availableNpc(state)?.id : undefined,
    title: proposal.title,
  };
  const proposedEvent = proposal.rule
    ? {
        ...event,
        announcement: createAnnouncement(proposal.rule, state, event),
      }
    : event;
  try {
    validateGameState({ ...state, currentEvent: proposedEvent });
  } catch {
    throw new AiPolicyError(
      "unplayable-event",
      "The proposal was incompatible with the deterministic game state.",
    );
  }
  return proposedEvent;
}
