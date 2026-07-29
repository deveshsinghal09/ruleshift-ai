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
  GameHistoryEntry,
  GameState,
  InventoryItem,
} from "@/features/adventure/types";

export function PlayerPanel({ state }: { state: GameState }) {
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
          {state.player.profile.name}
        </h2>
        <p className="mt-1 text-sm text-secondary-foreground">
          {state.player.profile.title}
        </p>
      </div>

      <div className="space-y-5">
        <StatBar
          icon={Heart}
          label="Health"
          maximum={state.player.maxHealth}
          value={state.player.health}
          variant={state.player.health <= 30 ? "danger" : "success"}
        />
        <StatBar
          icon={Zap}
          label="Energy"
          maximum={state.player.maxEnergy}
          value={state.player.energy}
          variant={state.player.energy <= 25 ? "warning" : "exploration"}
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
            {Math.min(state.turn + 1, 4)} / 4
          </p>
        </div>
      </div>

      <div>
        <p className="font-system text-[0.6875rem] text-muted-foreground">
          CARRYING
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm text-secondary-foreground">
          <Backpack aria-hidden="true" className="size-4" />
          {state.player.inventory.length === 0
            ? "No items yet"
            : `${state.player.inventory.reduce(
                (total, item) => total + item.quantity,
                0,
              )} carried item`}
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
  maximum,
  value,
  variant,
}: {
  icon: typeof Heart;
  label: string;
  maximum: number;
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
          {value} / {maximum}
        </span>
      </div>
      <Progress
        label={`${label}: ${value} of ${maximum}`}
        value={(value / maximum) * 100}
        valueLabel={`${value} of ${maximum}`}
        variant={variant}
      />
    </div>
  );
}

export function ObjectivePanel({ state }: { state: GameState }) {
  const objective = state.objectives[0];
  const progress = (objective.progress / objective.target) * 100;

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
            {objective.title}
          </h2>
        </div>
      </div>
      <Progress
        label="Quest progress"
        value={progress}
        valueLabel={`${Math.round(progress)} percent complete`}
        variant={objective.status === "completed" ? "success" : "warning"}
      />
      <p className="font-system text-[0.6875rem] text-muted-foreground">
        {Math.round(progress)}% COMPLETE
      </p>
    </section>
  );
}

export function RulePanel({ state }: { state: GameState }) {
  if (state.activeRules.length === 0) {
    return (
      <section aria-labelledby="rule-panel-title">
        <p className="font-system text-[0.6875rem] text-muted-foreground">
          ACTIVE RULE
        </p>
        <h2 className="mt-2 text-sm font-semibold" id="rule-panel-title">
          Reality is currently stable
        </h2>
        <p className="mt-2 text-sm leading-6 text-secondary-foreground">
          No registered gameplay mutation is active this turn.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="rule-panel-title" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge variant="ruleshift">
          <Zap aria-hidden="true" className="size-3" />
          {state.activeRules.length} active
        </Badge>
        <span className="font-system text-xs text-ruleshift">
          REGISTERED
        </span>
      </div>
      <h2 className="sr-only" id="rule-panel-title">
        Active RuleShifts
      </h2>
      <div className="space-y-5">
        {state.activeRules.map((rule) => (
          <article className="min-w-0" key={rule.id}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="min-w-0 break-words font-display text-base font-semibold">
                {rule.name}
              </h3>
              <span className="shrink-0 font-system text-xs text-ruleshift">
                {rule.remainingTurns}/{rule.totalTurns}
              </span>
            </div>
            <p className="mt-2 break-words text-sm leading-6 text-secondary-foreground">
              {rule.uiExplanation}
            </p>
            <Progress
              className="mt-4"
              label={`${rule.name} duration`}
              value={(rule.remainingTurns / rule.totalTurns) * 100}
              valueLabel={`${rule.remainingTurns} turns remaining`}
              variant="ruleshift"
            />
          </article>
        ))}
      </div>
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
        MOOD: {mood.toUpperCase()} · SOURCE: LOCAL ENGINE
      </p>
    </section>
  );
}

export function InventoryList({
  items,
}: {
  items: readonly InventoryItem[];
}) {
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
            <p className="font-system text-[0.625rem] text-muted-foreground">
              QUANTITY {item.quantity} · USES {item.usesRemaining}
            </p>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export function TimelineList({
  events,
}: {
  events: readonly GameHistoryEntry[];
}) {
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
            {event.kind === "reward" || event.kind === "quest" ? (
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
            {event.ruleEvents.map((ruleEvent) => (
              <p
                className="mt-2 flex items-start gap-2 text-sm leading-6 text-ruleshift"
                key={ruleEvent.id}
              >
                <Zap
                  aria-hidden="true"
                  className="mt-1 size-3.5 shrink-0"
                />
                <span>
                  <span className="font-semibold">{ruleEvent.ruleName}</span>{" "}
                  {ruleEvent.type}: {ruleEvent.message}
                </span>
              </p>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function RewardSummary({ state }: { state: GameState }) {
  if (state.player.inventory.length === 0) {
    return null;
  }

  return (
    <Card variant="success">
      <CardContent className="flex items-center gap-3 py-4">
        <Star aria-hidden="true" className="size-5 shrink-0 text-warning" />
        <p className="text-sm">
          Collected{" "}
          <span className="font-semibold">
            {state.player.inventory[0].name}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
