import {
  Backpack,
  CheckCircle2,
  Crown,
  Heart,
  ScrollText,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type {
  GameEvent,
  InventoryItem,
  MockGameState,
} from "@/features/adventure/types";

export function PlayerPanel({ state }: { state: MockGameState }) {
  return (
    <section aria-labelledby="player-panel-title" className="space-y-5">
      <div>
        <p className="font-system text-[0.6875rem] text-exploration">
          PLAYER SIGNAL
        </p>
        <h2
          className="mt-2 font-display text-lg font-semibold"
          id="player-panel-title"
        >
          {state.character.name}
        </h2>
        <p className="mt-1 text-sm text-secondary-foreground">
          {state.character.title}
        </p>
      </div>

      <div className="space-y-5">
        <StatBar
          icon={Heart}
          label="Health"
          value={state.health}
          variant={state.health <= 30 ? "danger" : "success"}
        />
        <StatBar
          icon={Zap}
          label="Energy"
          value={state.energy}
          variant={state.energy <= 25 ? "warning" : "exploration"}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 border-y border-border py-4">
        <div>
          <p className="font-system text-[0.6875rem] text-muted-foreground">
            SCORE
          </p>
          <p className="mt-1 text-lg font-semibold">{state.score}</p>
        </div>
        <div>
          <p className="font-system text-[0.6875rem] text-muted-foreground">
            TURN
          </p>
          <p className="mt-1 text-lg font-semibold">
            {Math.min(state.turnIndex + 1, 4)} / 4
          </p>
        </div>
      </div>

      <div>
        <p className="font-system text-[0.6875rem] text-muted-foreground">
          CARRYING
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm text-secondary-foreground">
          <Backpack aria-hidden="true" className="size-4" />
          {state.inventory.length === 0
            ? "No items yet"
            : `${state.inventory.length} legendary-looking item`}
        </p>
      </div>
    </section>
  );
}

type ProgressVariant =
  | "ai"
  | "exploration"
  | "ruleshift"
  | "success"
  | "warning"
  | "danger";

function StatBar({
  icon: Icon,
  label,
  value,
  variant,
}: {
  icon: typeof Heart;
  label: string;
  value: number;
  variant: ProgressVariant;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="inline-flex items-center gap-2 font-semibold">
          <Icon aria-hidden="true" className="size-4" />
          {label}
        </span>
        <span className="font-system text-xs text-secondary-foreground">
          {value} / 100
        </span>
      </div>
      <Progress
        label={`${label}: ${value} of 100`}
        value={value}
        valueLabel={`${value} of 100`}
        variant={variant}
      />
    </div>
  );
}

export function ObjectivePanel({ state }: { state: MockGameState }) {
  return (
    <section aria-labelledby="objective-title" className="space-y-4">
      <div className="flex items-start gap-3">
        <Crown
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-warning"
        />
        <div>
          <p className="font-system text-[0.6875rem] text-warning">
            PRIMARY OBJECTIVE
          </p>
          <h2 className="mt-2 text-sm font-semibold" id="objective-title">
            {state.objective}
          </h2>
        </div>
      </div>
      <Progress
        label="Quest progress"
        value={state.objectiveProgress}
        valueLabel={`${state.objectiveProgress} percent complete`}
        variant={state.objectiveProgress === 100 ? "success" : "warning"}
      />
      <p className="font-system text-[0.6875rem] text-muted-foreground">
        {state.objectiveProgress}% COMPLETE
      </p>
    </section>
  );
}

export function RulePanel({ state }: { state: MockGameState }) {
  if (!state.activeRule) {
    return (
      <section aria-labelledby="rule-panel-title">
        <p className="font-system text-[0.6875rem] text-muted-foreground">
          ACTIVE RULE
        </p>
        <h2 className="mt-2 text-sm font-semibold" id="rule-panel-title">
          Reality is currently stable
        </h2>
        <p className="mt-2 text-sm leading-6 text-secondary-foreground">
          The Dungeon Master is observing your decisions.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="rule-panel-title">
      <div className="flex items-center justify-between gap-3">
        <Badge variant="ruleshift">
          <Zap aria-hidden="true" className="size-3" />
          Active RuleShift
        </Badge>
        <span className="font-system text-xs text-ruleshift">
          {state.activeRule.remainingTurns} / {state.activeRule.totalTurns}
        </span>
      </div>
      <h2
        className="mt-4 font-display text-base font-semibold"
        id="rule-panel-title"
      >
        {state.activeRule.name}
      </h2>
      <p className="mt-2 text-sm leading-6 text-secondary-foreground">
        {state.activeRule.description}
      </p>
      <Progress
        className="mt-4"
        label="RuleShift duration"
        value={
          (state.activeRule.remainingTurns / state.activeRule.totalTurns) * 100
        }
        valueLabel={`${state.activeRule.remainingTurns} turns remaining`}
        variant="ruleshift"
      />
    </section>
  );
}

export function DungeonMasterPanel({
  aside,
  mood,
}: {
  aside: string;
  mood: string;
}) {
  return (
    <section aria-labelledby="dm-title" className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles aria-hidden="true" className="size-4 text-ai" />
        <h2
          className="font-system text-[0.6875rem] text-ai"
          id="dm-title"
        >
          DUNGEON MASTER
        </h2>
      </div>
      <p className="text-sm leading-6 text-secondary-foreground">“{aside}”</p>
      <p className="font-system text-[0.625rem] text-muted-foreground">
        MOOD: {mood.toUpperCase()} · SOURCE: SCRIPTED FALLBACK
      </p>
    </section>
  );
}

export function InventoryList({ items }: { items: InventoryItem[] }) {
  if (items.length === 0) {
    return (
      <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-strong-border bg-pressed p-6 text-center">
        <div>
          <Backpack
            aria-hidden="true"
            className="mx-auto size-7 text-muted-foreground"
          />
          <p className="mt-4 font-semibold">Your inventory is empty</p>
          <p className="mt-2 text-sm leading-6 text-secondary-foreground">
            Survive the RuleShift to discover a highly questionable reward.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} variant="success">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <Badge variant="success">{item.rarity}</Badge>
              <Star aria-hidden="true" className="size-5 text-warning" />
            </div>
            <CardTitle>{item.name}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export function TimelineList({ events }: { events: GameEvent[] }) {
  return (
    <ol className="space-y-0">
      {events.map((event, index) => (
        <li
          className="relative grid grid-cols-[2.5rem_1fr] gap-3 pb-6 last:pb-0"
          key={event.id}
        >
          {index < events.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute bottom-0 left-[1.18rem] top-8 w-px bg-border"
            />
          ) : null}
          <span
            aria-hidden="true"
            className="relative z-10 grid size-9 place-items-center rounded-md border border-border bg-pressed"
          >
            {event.tone === "objective" ? (
              <CheckCircle2 className="size-4 text-success" />
            ) : (
              <ScrollText className="size-4 text-exploration" />
            )}
          </span>
          <div className="pt-1">
            <p className="font-system text-[0.625rem] text-muted-foreground">
              TURN {event.turn}
            </p>
            <p className="mt-1 text-sm font-semibold">{event.title}</p>
            <p className="mt-1 text-sm leading-6 text-secondary-foreground">
              {event.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function RewardSummary({ state }: { state: MockGameState }) {
  if (state.inventory.length === 0) {
    return null;
  }

  return (
    <Card variant="success">
      <CardContent className="flex items-center gap-3 py-4">
        <Star aria-hidden="true" className="size-5 shrink-0 text-warning" />
        <p className="text-sm">
          Collected{" "}
          <span className="font-semibold">{state.inventory[0].name}</span>
        </p>
      </CardContent>
    </Card>
  );
}
