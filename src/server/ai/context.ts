import type {
  GameAction,
  GameState,
} from "@/domain/game/types";

export interface CompactGameContext {
  readonly action: {
    readonly kind: GameAction["kind"];
    readonly label: string;
    readonly untrustedCustomText: string | null;
  } | null;
  readonly activeRules: readonly {
    readonly key: string;
    readonly remainingTurns: number;
  }[];
  readonly difficulty: GameState["difficulty"];
  readonly enemies: readonly {
    readonly healthPercent: number;
    readonly id: string;
    readonly name: string;
    readonly status: string;
  }[];
  readonly inventoryNames: readonly string[];
  readonly memory: readonly string[];
  readonly mood: GameState["player"]["profile"]["mood"];
  readonly npcs: readonly {
    readonly id: string;
    readonly name: string;
    readonly relationship: number;
  }[];
  readonly objectives: readonly {
    readonly id: string;
    readonly progressPercent: number;
    readonly status: string;
    readonly title: string;
  }[];
  readonly player: {
    readonly archetype: string;
    readonly name: string;
    readonly title: string;
  };
  readonly previousEventKind: GameState["currentEvent"]["kind"];
  readonly turn: number;
  readonly world: {
    readonly stabilityBand: "critical" | "shaky" | "stable";
    readonly title: string;
  };
}

function percent(value: number, maximum: number): number {
  return Math.round((value / Math.max(1, maximum)) * 100);
}

export function createCompactGameContext(
  state: GameState,
  action: GameAction | null = null,
): CompactGameContext {
  return {
    action: action
      ? {
          kind: action.kind,
          label: action.label.slice(0, 180),
          untrustedCustomText:
            action.kind === "custom" ? action.text.slice(0, 300) : null,
        }
      : null,
    activeRules: state.activeRules.map((rule) => ({
      key: rule.key,
      remainingTurns: rule.remainingTurns,
    })),
    difficulty: state.difficulty,
    enemies: state.enemies.map((enemy) => ({
      healthPercent: percent(enemy.health, enemy.maxHealth),
      id: enemy.id,
      name: enemy.name,
      status: enemy.status,
    })),
    inventoryNames: state.player.inventory.map((item) => item.name),
    memory: state.history.slice(-4).map((entry) => entry.title),
    mood: state.player.profile.mood,
    npcs: state.npcs.map((npc) => ({
      id: npc.id,
      name: npc.name,
      relationship: npc.relationship,
    })),
    objectives: state.objectives.map((objective) => ({
      id: objective.id,
      progressPercent: percent(objective.progress, objective.target),
      status: objective.status,
      title: objective.title,
    })),
    player: {
      archetype: state.player.profile.archetype,
      name: state.player.profile.name,
      title: state.player.profile.title,
    },
    previousEventKind: state.currentEvent.kind,
    turn: state.turn,
    world: {
      stabilityBand:
        state.world.stability <= 25
          ? "critical"
          : state.world.stability <= 60
            ? "shaky"
            : "stable",
      title: state.world.title,
    },
  };
}
