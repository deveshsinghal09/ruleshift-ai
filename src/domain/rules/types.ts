import type { z } from "zod";
import type {
  Effect,
  EventKind,
  GameAction,
  GameState,
  LocalGameEvent,
} from "@/domain/game/types";

export type RuleKey =
  | "reverse_controls"
  | "no_repeat_action"
  | "inventory_shuffle"
  | "healing_hurts"
  | "enemy_mirrors_action"
  | "inventory_weight_damage"
  | "idle_regeneration"
  | "protect_the_enemy"
  | "locations_shuffle"
  | "weather_combat"
  | "compliment_combat"
  | "wrong_answers_hurt_enemies";

export type RuleCategory =
  | "controls"
  | "inventory"
  | "combat"
  | "survival"
  | "world"
  | "social"
  | "puzzle";

export type RuleParameterValue = string | number | boolean;
export type RuleParameters = Readonly<Record<string, RuleParameterValue>>;

export interface ActiveRule {
  readonly activatedAtTurn: number;
  readonly category: RuleCategory;
  readonly id: string;
  readonly key: RuleKey;
  readonly name: string;
  readonly parameters: RuleParameters;
  readonly priority: number;
  readonly remainingTurns: number;
  readonly totalTurns: number;
  readonly uiExplanation: string;
}

export type RuleLifecycleEventType =
  | "activated"
  | "expired"
  | "rejected"
  | "replaced";

export interface RuleLifecycleEvent {
  readonly id: string;
  readonly message: string;
  readonly ruleKey: RuleKey;
  readonly ruleName: string;
  readonly turn: number;
  readonly type: RuleLifecycleEventType;
}

export interface RuleActivationProposal {
  readonly duration: number;
  readonly id: string;
  readonly key: string;
  readonly parameters: unknown;
}

export interface RuleActivationContext {
  readonly event: LocalGameEvent;
  readonly state: GameState;
}

export interface RuleHookContext {
  readonly action: GameAction;
  readonly activeRule: ActiveRule;
  readonly randomState: number;
  readonly state: GameState;
}

export interface RuleActionValidation {
  readonly allowed: boolean;
  readonly reason?: string;
}

export interface RuleBeforeActionResult {
  readonly action: GameAction;
  readonly effects: readonly Effect[];
  readonly randomState: number;
  readonly state: GameState;
}

export interface RuleAfterActionContext extends RuleHookContext {
  readonly effects: readonly Effect[];
}

export interface RuleAfterActionResult {
  readonly effects: readonly Effect[];
  readonly randomState: number;
  readonly state: GameState;
}

export interface RuleExpirationContext {
  readonly activeRule: ActiveRule;
  readonly state: GameState;
}

export interface RuleExpirationResult {
  readonly message: string;
  readonly state: GameState;
}

export interface RuleDefinition {
  readonly actionValidation: (
    context: RuleHookContext,
  ) => RuleActionValidation;
  readonly activationPredicate: (
    context: RuleActivationContext,
  ) => boolean;
  readonly afterAction: (
    context: RuleAfterActionContext,
  ) => RuleAfterActionResult;
  readonly afterEvent?: (
    context: Omit<RuleAfterActionContext, "action" | "effects">,
  ) => Omit<RuleAfterActionResult, "effects">;
  readonly beforeAction: (
    context: RuleHookContext,
  ) => RuleBeforeActionResult;
  readonly category: RuleCategory;
  readonly compatibleEventTypes: readonly EventKind[];
  readonly conflictingRuleKeys: readonly RuleKey[];
  readonly description: string;
  readonly expirationBehavior: (
    context: RuleExpirationContext,
  ) => RuleExpirationResult;
  readonly key: RuleKey;
  readonly maximumDuration: number;
  readonly name: string;
  readonly parameterSchema: z.ZodType<RuleParameters>;
  readonly priority: number;
  readonly uiExplanation: string;
}

export interface RuleTurnPreparation {
  readonly action: GameAction;
  readonly effects: readonly Effect[];
  readonly randomState: number;
  readonly state: GameState;
}

export interface RuleTurnResolution {
  readonly effects: readonly Effect[];
  readonly randomState: number;
  readonly state: GameState;
}

export interface RuleLifecycleResolution {
  readonly events: readonly RuleLifecycleEvent[];
  readonly state: GameState;
}
