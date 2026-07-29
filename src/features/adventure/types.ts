export type Difficulty = "easy" | "normal" | "hard";

export type MoodId =
  | "fantasy"
  | "mysterious"
  | "chaotic"
  | "funny"
  | "horror"
  | "wholesome"
  | "scifi";

export interface CharacterOption {
  archetype: string;
  description: string;
  id: string;
  name: string;
  title: string;
}

export interface CharacterPassport {
  archetype: string;
  difficulty: Difficulty;
  mood: MoodId;
  name: string;
  title: string;
}

export type EventTone =
  | "exploration"
  | "encounter"
  | "ruleshift"
  | "reward"
  | "objective";

export interface GameEvent {
  description: string;
  id: string;
  title: string;
  tone: EventTone;
  turn: number;
}

export interface InventoryItem {
  description: string;
  id: string;
  name: string;
  rarity: "common" | "rare" | "legendary";
}

export interface ActiveRule {
  description: string;
  id: string;
  name: string;
  remainingTurns: number;
  totalTurns: number;
}

export interface GameAction {
  energyCost: number;
  id: string;
  label: string;
  risk: "safe" | "bold" | "wild";
}

export interface TurnScene {
  actions: GameAction[];
  badge: string;
  dmAside: string;
  encounter?: {
    description: string;
    health: number;
    kind: "enemy" | "npc";
    name: string;
  };
  id: string;
  narration: string;
  title: string;
  tone: EventTone;
}

export type GameStatus = "playing" | "victory" | "defeat";

export interface MockGameState {
  activeRule: ActiveRule | null;
  character: CharacterPassport;
  energy: number;
  health: number;
  inventory: InventoryItem[];
  lastAction: string | null;
  objective: string;
  objectiveProgress: number;
  processedRequestIds: string[];
  rulesSurvived: number;
  score: number;
  sessionId: string;
  showRuleShift: boolean;
  status: GameStatus;
  timeline: GameEvent[];
  turnIndex: number;
  turnsTaken: number;
  worldTitle: string;
}

export interface SubmitActionRequest {
  actionId?: string;
  customAction?: string;
  requestId: string;
}

export interface MockAdventureTransport {
  createSession(passport: CharacterPassport): Promise<MockGameState>;
  dismissRuleShift(sessionId: string): Promise<MockGameState>;
  getSession(sessionId: string): Promise<MockGameState | null>;
  submitAction(
    sessionId: string,
    request: SubmitActionRequest,
  ): Promise<MockGameState>;
}
