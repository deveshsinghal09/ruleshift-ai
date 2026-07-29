import { z } from "zod";
import {
  CUSTOM_ACTION_MAX_LENGTH,
  GAME_STATE_VERSION,
  MAX_WORLD_STABILITY,
  UINT32_MAX,
} from "@/domain/game/constants";
import { GameEngineError } from "@/domain/game/errors";
import {
  activeRuleSchema,
  ruleParametersSchema,
} from "@/domain/rules/validation";
import { ruleConflictMatrix } from "@/domain/rules/conflicts";
import { getRuleDefinition } from "@/domain/rules/registry";
import type { GameAction, GameState } from "@/domain/game/types";

const finiteNumber = z.number().finite();
const nonNegativeNumber = finiteNumber.min(0);
const identifier = z.string().trim().min(1).max(128);
const boundedText = z.string().trim().min(1).max(2_000);

export const customActionTextSchema = z
  .string()
  .trim()
  .min(1, "Describe a custom action.")
  .max(
    CUSTOM_ACTION_MAX_LENGTH,
    `Keep the custom action under ${CUSTOM_ACTION_MAX_LENGTH} characters.`,
  )
  .refine(
    (value) => !/[\u0000-\u001F\u007F<>]/u.test(value),
    "Custom actions must contain plain text without control characters or markup.",
  );

const effectCoreSchemas = [
  z.object({
    amount: finiteNumber,
    type: z.literal("player-health"),
  }),
  z.object({
    amount: finiteNumber,
    type: z.literal("player-energy"),
  }),
  z.object({
    amount: finiteNumber,
    enemyId: identifier,
    type: z.literal("enemy-health"),
  }),
  z.object({
    amount: finiteNumber,
    type: z.literal("world-stability"),
  }),
  z.object({
    amount: finiteNumber,
    npcId: identifier,
    type: z.literal("npc-relationship"),
  }),
  z.object({
    amount: finiteNumber,
    objectiveId: identifier,
    type: z.literal("objective-progress"),
  }),
  z.object({
    amount: finiteNumber,
    reason: boundedText,
    type: z.literal("score"),
  }),
  z.object({
    amount: finiteNumber,
    type: z.literal("defend"),
  }),
] as const;

const usableEffectSchema = z.discriminatedUnion("type", effectCoreSchemas);

const inventoryItemSchema = z.object({
  consumable: z.boolean(),
  description: boundedText,
  effects: z.array(usableEffectSchema),
  id: identifier,
  name: z.string().trim().min(1).max(120),
  quantity: z.number().int().min(0),
  rarity: z.enum(["common", "rare", "legendary"]),
  stackable: z.boolean(),
  usesRemaining: z.number().int().min(0),
  usesPerItem: z.number().int().min(0),
});

export const effectSchema = z.discriminatedUnion("type", [
  ...effectCoreSchemas,
  z.object({
    item: inventoryItemSchema,
    quantity: z.number().int().positive(),
    type: z.literal("inventory-add"),
  }),
  z.object({
    itemId: identifier,
    quantity: z.number().int().positive(),
    type: z.literal("inventory-remove"),
  }),
  z.object({
    itemId: identifier,
    type: z.literal("inventory-use"),
  }),
  z.object({
    enemyId: identifier,
    status: z.enum(["active", "defeated", "escaped"]),
    type: z.literal("enemy-status"),
  }),
  z.object({
    objectiveId: identifier,
    status: z.enum(["available", "active", "completed", "failed"]),
    type: z.literal("objective-status"),
  }),
]);

const actionBaseSchema = z.object({
  available: z.boolean(),
  effects: z.array(effectSchema),
  energyCost: nonNegativeNumber,
  id: identifier,
  label: z.string().trim().min(1).max(180),
  risk: z.enum(["safe", "bold", "wild"]),
  unavailableReason: z.string().trim().min(1).max(240).optional(),
});

export const gameActionSchema = z.discriminatedUnion("kind", [
  actionBaseSchema.extend({
    destination: boundedText,
    kind: z.literal("move"),
  }),
  actionBaseSchema.extend({
    baseDamage: nonNegativeNumber,
    kind: z.literal("attack"),
    targetId: identifier,
  }),
  actionBaseSchema.extend({
    armor: nonNegativeNumber,
    kind: z.literal("defend"),
  }),
  actionBaseSchema.extend({
    kind: z.literal("talk"),
    relationshipChange: finiteNumber,
    targetId: identifier,
  }),
  actionBaseSchema.extend({
    insight: nonNegativeNumber,
    kind: z.literal("inspect"),
    targetId: identifier,
  }),
  actionBaseSchema.extend({
    itemId: identifier,
    kind: z.literal("use-item"),
  }),
  actionBaseSchema.extend({
    kind: z.literal("accept-quest"),
    objectiveId: identifier,
  }),
  actionBaseSchema.extend({
    kind: z.literal("reject-quest"),
    objectiveId: identifier,
  }),
  actionBaseSchema.extend({
    energyRecovery: nonNegativeNumber,
    healthRecovery: nonNegativeNumber,
    kind: z.literal("rest"),
  }),
  actionBaseSchema.extend({
    escapeChance: finiteNumber.min(0).max(1),
    kind: z.literal("run-away"),
    targetId: identifier,
  }),
  actionBaseSchema.extend({
    kind: z.literal("custom"),
    text: customActionTextSchema,
  }),
]);

const characterProfileSchema = z.object({
  archetype: z.string().trim().min(2).max(48),
  mood: z.enum([
    "fantasy",
    "mysterious",
    "chaotic",
    "funny",
    "horror",
    "wholesome",
    "scifi",
  ]),
  name: z.string().trim().min(2).max(32),
  title: z.string().trim().min(2).max(56),
});

const playerSchema = z
  .object({
    defending: nonNegativeNumber,
    energy: nonNegativeNumber,
    health: nonNegativeNumber,
    id: identifier,
    inventory: z.array(inventoryItemSchema),
    maxEnergy: finiteNumber.positive(),
    maxHealth: finiteNumber.positive(),
    profile: characterProfileSchema,
  })
  .superRefine((player, context) => {
    if (player.health > player.maxHealth) {
      context.addIssue({
        code: "custom",
        message: "Player health cannot exceed maximum health.",
        path: ["health"],
      });
    }
    if (player.energy > player.maxEnergy) {
      context.addIssue({
        code: "custom",
        message: "Player energy cannot exceed maximum energy.",
        path: ["energy"],
      });
    }
  });

const enemySchema = z
  .object({
    attackPower: nonNegativeNumber,
    description: boundedText,
    drops: z.array(
      z.object({
        chance: finiteNumber.min(0).max(1),
        item: inventoryItemSchema,
      }),
    ),
    health: nonNegativeNumber,
    id: identifier,
    maxHealth: finiteNumber.positive(),
    name: z.string().trim().min(1).max(120),
    status: z.enum(["active", "defeated", "escaped"]),
  })
  .superRefine((enemy, context) => {
    if (enemy.health > enemy.maxHealth) {
      context.addIssue({
        code: "custom",
        message: "Enemy health cannot exceed maximum health.",
        path: ["health"],
      });
    }
  });

const npcSchema = z.object({
  description: boundedText,
  id: identifier,
  name: z.string().trim().min(1).max(120),
  relationship: finiteNumber.min(-100).max(100),
});

const objectiveSchema = z
  .object({
    description: boundedText,
    id: identifier,
    progress: nonNegativeNumber,
    status: z.enum(["available", "active", "completed", "failed"]),
    target: finiteNumber.positive(),
    title: z.string().trim().min(1).max(180),
  })
  .superRefine((objective, context) => {
    if (objective.progress > objective.target) {
      context.addIssue({
        code: "custom",
        message: "Objective progress cannot exceed its target.",
        path: ["progress"],
      });
    }
  });

const eventAnnouncementSchema = z.object({
  description: boundedText,
  id: identifier,
  name: z.string().trim().min(1).max(120),
  parameters: ruleParametersSchema,
  ruleKey: z.enum([
    "reverse_controls",
    "no_repeat_action",
    "inventory_shuffle",
    "healing_hurts",
    "enemy_mirrors_action",
    "inventory_weight_damage",
    "idle_regeneration",
    "protect_the_enemy",
    "locations_shuffle",
    "weather_combat",
    "compliment_combat",
    "wrong_answers_hurt_enemies",
  ]),
  totalTurns: z.number().int().positive(),
  type: z.literal("ruleshift-preview"),
});

export const localGameEventSchema = z.object({
  announcement: eventAnnouncementSchema.optional(),
  badge: z.string().trim().min(1).max(80),
  choices: z.array(gameActionSchema).min(2).max(4),
  dmAside: boundedText,
  enemyId: identifier.optional(),
  id: identifier,
  kind: z.enum([
    "exploration",
    "dialogue",
    "combat",
    "puzzle",
    "quest",
    "reward",
    "trap",
  ]),
  narration: boundedText,
  npcId: identifier.optional(),
  title: z.string().trim().min(1).max(180),
});

const historyEntrySchema = z.object({
  actionId: identifier,
  actionLabel: z.string().trim().min(1).max(300),
  description: boundedText,
  effects: z.array(effectSchema),
  eventId: identifier,
  id: identifier,
  kind: z.enum([
    "exploration",
    "dialogue",
    "combat",
    "puzzle",
    "quest",
    "reward",
    "trap",
  ]),
  ruleEvents: z.array(
    z.object({
      id: identifier,
      message: boundedText,
      ruleKey: eventAnnouncementSchema.shape.ruleKey,
      ruleName: z.string().trim().min(1).max(120),
      turn: z.number().int().min(0),
      type: z.enum(["activated", "expired", "rejected", "replaced"]),
    }),
  ),
  title: z.string().trim().min(1).max(180),
  turn: z.number().int().min(0),
});

const actionCountsSchema = z.object({
  "accept-quest": z.number().int().min(0),
  "reject-quest": z.number().int().min(0),
  "run-away": z.number().int().min(0),
  "use-item": z.number().int().min(0),
  attack: z.number().int().min(0),
  custom: z.number().int().min(0),
  defend: z.number().int().min(0),
  inspect: z.number().int().min(0),
  move: z.number().int().min(0),
  rest: z.number().int().min(0),
  talk: z.number().int().min(0),
});

const statisticsSchema = z.object({
  actionsByKind: actionCountsSchema,
  criticalActions: z.number().int().min(0),
  damageDealt: nonNegativeNumber,
  damageTaken: nonNegativeNumber,
  itemsCollected: z.number().int().min(0),
  rulesSurvived: z.number().int().min(0),
  successfulEscapes: z.number().int().min(0),
  turnsTaken: z.number().int().min(0),
});

const victoryConditionSchema = z.discriminatedUnion("type", [
  z.object({
    objectiveId: identifier,
    type: z.literal("objective-completed"),
  }),
  z.object({
    itemId: identifier,
    quantity: z.number().int().positive(),
    type: z.literal("inventory-contains"),
  }),
]);

const defeatConditionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("player-health-zero") }),
  z.object({ type: z.literal("world-stability-zero") }),
  z.object({
    maximumTurns: z.number().int().positive(),
    type: z.literal("turn-limit"),
  }),
]);

export const gameStateSchema = z
  .object({
    activeRules: z.array(activeRuleSchema),
    currentEvent: localGameEventSchema,
    defeatConditions: z.array(defeatConditionSchema).min(1),
    difficulty: z.enum(["easy", "normal", "hard"]),
    enemies: z.array(enemySchema),
    history: z.array(historyEntrySchema),
    lastAction: z.string().trim().min(1).max(300).nullable(),
    npcs: z.array(npcSchema),
    objectives: z.array(objectiveSchema).min(1),
    player: playerSchema,
    processedActionIds: z.array(identifier),
    randomState: z.number().int().min(0).max(UINT32_MAX),
    ruleEvents: z.array(
      z.object({
        id: identifier,
        message: boundedText,
        ruleKey: eventAnnouncementSchema.shape.ruleKey,
        ruleName: z.string().trim().min(1).max(120),
        turn: z.number().int().min(0),
        type: z.enum(["activated", "expired", "rejected", "replaced"]),
      }),
    ),
    score: nonNegativeNumber,
    seed: z.string().min(1).max(256),
    sessionId: identifier,
    statistics: statisticsSchema,
    status: z.enum(["playing", "victory", "defeat"]),
    turn: z.number().int().min(0),
    version: z.literal(GAME_STATE_VERSION),
    victoryConditions: z.array(victoryConditionSchema).min(1),
    world: z.object({
      id: identifier,
      stability: finiteNumber.min(0).max(MAX_WORLD_STABILITY),
      title: z.string().trim().min(1).max(180),
    }),
  })
  .superRefine((state, context) => {
    if (new Set(state.activeRules.map((rule) => rule.id)).size !== state.activeRules.length) {
      context.addIssue({
        code: "custom",
        message: "Active RuleShift IDs must be unique.",
        path: ["activeRules"],
      });
    }
    for (let index = 0; index < state.activeRules.length; index += 1) {
      const rule = state.activeRules[index];
      const conflicts = state.activeRules.slice(index + 1).some(
        (candidate) =>
          ruleConflictMatrix[rule.key].includes(candidate.key) ||
          ruleConflictMatrix[candidate.key].includes(rule.key),
      );
      if (conflicts) {
        context.addIssue({
          code: "custom",
          message: "Conflicting RuleShifts cannot be active together.",
          path: ["activeRules", index],
        });
      }
    }
    if (
      state.activeRules.length > 0 &&
      !state.currentEvent.choices.some((choice) =>
        state.activeRules.every((activeRule) =>
          getRuleDefinition(activeRule.key).actionValidation({
            action: choice,
            activeRule,
            randomState: state.randomState,
            state: state as GameState,
          }).allowed,
        ),
      )
    ) {
      context.addIssue({
        code: "custom",
        message: "Active RuleShifts must leave at least one prepared action available.",
        path: ["activeRules"],
      });
    }
    if (new Set(state.processedActionIds).size !== state.processedActionIds.length) {
      context.addIssue({
        code: "custom",
        message: "Processed action IDs must be unique.",
        path: ["processedActionIds"],
      });
    }
    if (state.statistics.turnsTaken !== state.turn) {
      context.addIssue({
        code: "custom",
        message: "Turn and statistics turn count must match.",
        path: ["statistics", "turnsTaken"],
      });
    }
  });

export function validateGameState(input: unknown): GameState {
  const result = gameStateSchema.safeParse(input);
  if (!result.success) {
    throw new GameEngineError(
      "INVALID_STATE",
      result.error.issues[0]?.message ?? "Game state is invalid.",
    );
  }

  return result.data as GameState;
}

export function validateGameAction(input: unknown): GameAction {
  const result = gameActionSchema.safeParse(input);
  if (!result.success) {
    throw new GameEngineError(
      "INVALID_ACTION",
      result.error.issues[0]?.message ?? "Game action is invalid.",
    );
  }

  return result.data as GameAction;
}
