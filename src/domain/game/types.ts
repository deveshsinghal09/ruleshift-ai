export type Difficulty = "easy" | "normal" | "hard";

export type MoodId =
  | "fantasy"
  | "mysterious"
  | "chaotic"
  | "funny"
  | "horror"
  | "wholesome"
  | "scifi";

export type GameStatus = "playing" | "victory" | "defeat";
export type ActionRisk = "safe" | "bold" | "wild";
export type EventKind =
  | "exploration"
  | "dialogue"
  | "combat"
  | "puzzle"
  | "quest"
  | "reward"
  | "trap";
export type ItemRarity = "common" | "rare" | "legendary";
export type ObjectiveStatus = "available" | "active" | "completed" | "failed";

export interface CharacterProfile {
  readonly archetype: string;
  readonly mood: MoodId;
  readonly name: string;
  readonly title: string;
}

export interface Player {
  readonly defending: number;
  readonly energy: number;
  readonly health: number;
  readonly id: string;
  readonly inventory: readonly InventoryItem[];
  readonly maxEnergy: number;
  readonly maxHealth: number;
  readonly profile: CharacterProfile;
}

export interface World {
  readonly id: string;
  readonly stability: number;
  readonly title: string;
}

export interface ItemDrop {
  readonly chance: number;
  readonly item: InventoryItem;
}

export interface Enemy {
  readonly attackPower: number;
  readonly description: string;
  readonly drops: readonly ItemDrop[];
  readonly health: number;
  readonly id: string;
  readonly maxHealth: number;
  readonly name: string;
  readonly status: "active" | "defeated" | "escaped";
}

export interface Npc {
  readonly description: string;
  readonly id: string;
  readonly name: string;
  readonly relationship: number;
}

export type NPC = Npc;

export interface InventoryItem {
  readonly consumable: boolean;
  readonly description: string;
  readonly effects: readonly Effect[];
  readonly id: string;
  readonly name: string;
  readonly quantity: number;
  readonly rarity: ItemRarity;
  readonly stackable: boolean;
  readonly usesRemaining: number;
  readonly usesPerItem: number;
}

export interface Objective {
  readonly description: string;
  readonly id: string;
  readonly progress: number;
  readonly status: ObjectiveStatus;
  readonly target: number;
  readonly title: string;
}

interface ActionBase {
  readonly available: boolean;
  readonly effects: readonly Effect[];
  readonly energyCost: number;
  readonly id: string;
  readonly label: string;
  readonly risk: ActionRisk;
  readonly unavailableReason?: string;
}

export interface MoveAction extends ActionBase {
  readonly destination: string;
  readonly kind: "move";
}

export interface AttackAction extends ActionBase {
  readonly baseDamage: number;
  readonly kind: "attack";
  readonly targetId: string;
}

export interface DefendAction extends ActionBase {
  readonly armor: number;
  readonly kind: "defend";
}

export interface TalkAction extends ActionBase {
  readonly kind: "talk";
  readonly relationshipChange: number;
  readonly targetId: string;
}

export interface InspectAction extends ActionBase {
  readonly insight: number;
  readonly kind: "inspect";
  readonly targetId: string;
}

export interface UseItemAction extends ActionBase {
  readonly itemId: string;
  readonly kind: "use-item";
}

export interface AcceptQuestAction extends ActionBase {
  readonly kind: "accept-quest";
  readonly objectiveId: string;
}

export interface RejectQuestAction extends ActionBase {
  readonly kind: "reject-quest";
  readonly objectiveId: string;
}

export interface RestAction extends ActionBase {
  readonly energyRecovery: number;
  readonly healthRecovery: number;
  readonly kind: "rest";
}

export interface RunAwayAction extends ActionBase {
  readonly escapeChance: number;
  readonly kind: "run-away";
  readonly targetId: string;
}

export interface CustomAction extends ActionBase {
  readonly kind: "custom";
  readonly text: string;
}

export type GameAction =
  | MoveAction
  | AttackAction
  | DefendAction
  | TalkAction
  | InspectAction
  | UseItemAction
  | AcceptQuestAction
  | RejectQuestAction
  | RestAction
  | RunAwayAction
  | CustomAction;

export type Effect =
  | {
      readonly amount: number;
      readonly type: "player-health";
    }
  | {
      readonly amount: number;
      readonly type: "player-energy";
    }
  | {
      readonly amount: number;
      readonly enemyId: string;
      readonly type: "enemy-health";
    }
  | {
      readonly amount: number;
      readonly type: "world-stability";
    }
  | {
      readonly amount: number;
      readonly npcId: string;
      readonly type: "npc-relationship";
    }
  | {
      readonly amount: number;
      readonly objectiveId: string;
      readonly type: "objective-progress";
    }
  | {
      readonly amount: number;
      readonly reason: string;
      readonly type: "score";
    }
  | {
      readonly item: InventoryItem;
      readonly quantity: number;
      readonly type: "inventory-add";
    }
  | {
      readonly itemId: string;
      readonly quantity: number;
      readonly type: "inventory-remove";
    }
  | {
      readonly itemId: string;
      readonly type: "inventory-use";
    }
  | {
      readonly enemyId: string;
      readonly status: Enemy["status"];
      readonly type: "enemy-status";
    }
  | {
      readonly objectiveId: string;
      readonly status: ObjectiveStatus;
      readonly type: "objective-status";
    }
  | {
      readonly amount: number;
      readonly type: "defend";
    };

export interface EventAnnouncement {
  readonly description: string;
  readonly id: string;
  readonly name: string;
  readonly parameters: RuleParameters;
  readonly ruleKey: RuleKey;
  readonly totalTurns: number;
  readonly type: "ruleshift-preview";
}

export interface LocalGameEvent {
  readonly announcement?: EventAnnouncement;
  readonly badge: string;
  readonly choices: readonly GameAction[];
  readonly dmAside: string;
  readonly enemyId?: string;
  readonly id: string;
  readonly kind: EventKind;
  readonly narration: string;
  readonly npcId?: string;
  readonly title: string;
}

export type GameEvent = LocalGameEvent;

export interface GameHistoryEntry {
  readonly actionId: string;
  readonly actionLabel: string;
  readonly description: string;
  readonly effects: readonly Effect[];
  readonly eventId: string;
  readonly id: string;
  readonly kind: EventKind;
  readonly ruleEvents: readonly RuleLifecycleEvent[];
  readonly title: string;
  readonly turn: number;
}

export interface Statistics {
  readonly actionsByKind: Readonly<Record<GameAction["kind"], number>>;
  readonly criticalActions: number;
  readonly damageDealt: number;
  readonly damageTaken: number;
  readonly itemsCollected: number;
  readonly rulesSurvived: number;
  readonly successfulEscapes: number;
  readonly turnsTaken: number;
}

export type VictoryCondition =
  | {
      readonly objectiveId: string;
      readonly type: "objective-completed";
    }
  | {
      readonly itemId: string;
      readonly quantity: number;
      readonly type: "inventory-contains";
    };

export type DefeatCondition =
  | {
      readonly type: "player-health-zero";
    }
  | {
      readonly type: "world-stability-zero";
    }
  | {
      readonly maximumTurns: number;
      readonly type: "turn-limit";
    };

export interface GameState {
  readonly activeRules: readonly ActiveRule[];
  readonly currentEvent: LocalGameEvent;
  readonly defeatConditions: readonly DefeatCondition[];
  readonly difficulty: Difficulty;
  readonly enemies: readonly Enemy[];
  readonly history: readonly GameHistoryEntry[];
  readonly lastAction: string | null;
  readonly npcs: readonly Npc[];
  readonly objectives: readonly Objective[];
  readonly player: Player;
  readonly processedActionIds: readonly string[];
  readonly randomState: number;
  readonly ruleEvents: readonly RuleLifecycleEvent[];
  readonly score: number;
  readonly seed: string;
  readonly sessionId: string;
  readonly statistics: Statistics;
  readonly status: GameStatus;
  readonly turn: number;
  readonly version: 1;
  readonly victoryConditions: readonly VictoryCondition[];
  readonly world: World;
}

export interface TurnResult {
  readonly effects: readonly Effect[];
  readonly event: LocalGameEvent;
  readonly ruleEvents: readonly RuleLifecycleEvent[];
  readonly state: GameState;
}

export interface EventProviderInput {
  readonly previousEventKind: EventKind;
  readonly randomState: number;
  readonly state: GameState;
}

export interface EventProviderOutput {
  readonly event: LocalGameEvent;
  readonly randomState: number;
}

export interface EventProvider {
  generateNextEvent(input: EventProviderInput): EventProviderOutput;
}

export interface ProcessTurnContext {
  readonly eventProvider: EventProvider;
}
import type {
  ActiveRule,
  RuleKey,
  RuleLifecycleEvent,
  RuleParameters,
} from "@/domain/rules/types";
