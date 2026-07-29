"use client";

import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Backpack,
  ChevronRight,
  CircleAlert,
  Clock3,
  Heart,
  Menu,
  ScrollText,
  Send,
  ShieldAlert,
  Sparkles,
  Swords,
  UserRound,
  Zap,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import { RuleShiftMark } from "@/components/brand/ruleshift-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  demoTurns,
  moodNarrativeCues,
} from "@/features/adventure/mock-data";
import type {
  MockAdventureTransport,
  MockGameState,
  TurnScene,
} from "@/features/adventure/types";
import {
  DungeonMasterPanel,
  InventoryList,
  ObjectivePanel,
  PlayerPanel,
  RewardSummary,
  RulePanel,
  TimelineList,
} from "@/features/game/game-panels";
import { useMockGame } from "@/features/game/use-mock-game";
import { cn } from "@/lib/utils";

const customActionSchema = z
  .string()
  .trim()
  .min(3, "Describe an action using at least three characters.")
  .max(300, "Keep the custom action under 300 characters.");

type MobilePanel = "player" | "rule" | "timeline" | "inventory" | null;

interface GameScreenProps {
  onComplete?: (sessionId: string) => void;
  sessionId: string;
  transport?: MockAdventureTransport;
}

export function GameScreen({
  onComplete,
  sessionId,
  transport,
}: GameScreenProps) {
  const router = useRouter();
  const {
    dismissRuleShift,
    error,
    isLoading,
    isSubmitting,
    state,
    submitAction,
  } = useMockGame(sessionId, transport);
  const [customAction, setCustomAction] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const sceneHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (state && state.turnsTaken > 0 && !state.showRuleShift) {
      sceneHeadingRef.current?.focus();
    }
  }, [state]);

  async function resolveAction(request: {
    actionId?: string;
    customAction?: string;
  }): Promise<void> {
    if (isSubmitting) {
      return;
    }

    const nextState = await submitAction(request);
    if (nextState && nextState.status !== "playing") {
      if (onComplete) {
        onComplete(nextState.sessionId);
      } else {
        router.push(`/result/${nextState.sessionId}`);
      }
    }
  }

  async function submitCustomAction(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const result = customActionSchema.safeParse(customAction);
    if (!result.success) {
      setCustomError(result.error.issues[0]?.message ?? "Describe an action.");
      return;
    }

    setCustomError(null);
    await resolveAction({ customAction: result.data });
    setCustomAction("");
  }

  if (isLoading) {
    return <GameLoading />;
  }

  if (!state) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <Card className="w-full max-w-lg" variant="danger">
          <CardHeader>
            <CircleAlert aria-hidden="true" className="size-7 text-danger" />
            <CardTitle>Adventure signal lost</CardTitle>
            <CardDescription>
              {error ??
                "This local adventure was not found. Create a new passport to continue."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/create")}>
              Create a new passport
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scene = demoTurns[state.turnIndex];

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground lg:pb-0">
      <GameHeader
        onInventory={() => setInventoryOpen(true)}
        onTimeline={() => setTimelineOpen(true)}
        state={state}
      />

      <main className="mx-auto grid w-full max-w-[100rem] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[15.5rem_minmax(0,1fr)_18rem] lg:gap-6 lg:px-8 lg:py-7">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-lg border border-border bg-card p-5">
            <PlayerPanel state={state} />
          </div>
        </aside>

        <section aria-labelledby="scene-title" className="min-w-0 space-y-5">
          <ScenePanel
            headingRef={sceneHeadingRef}
            scene={scene}
            state={state}
          />
          <RewardSummary state={state} />

          <div aria-labelledby="actions-title">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-system text-[0.6875rem] text-exploration">
                  YOUR MOVE
                </p>
                <h2
                  className="mt-1 font-display text-xl font-semibold"
                  id="actions-title"
                >
                  Choose an action
                </h2>
              </div>
              <span className="font-system text-xs text-muted-foreground">
                {scene.actions.length} OPTIONS
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {scene.actions.map((action) => (
                <button
                  className={cn(
                    "group min-h-28 rounded-lg border border-border bg-card p-5 text-left outline-none transition-[border-color,background-color,transform]",
                    "hover:-translate-y-0.5 hover:border-exploration/60 hover:bg-exploration/5",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "disabled:pointer-events-none disabled:opacity-45",
                  )}
                  disabled={isSubmitting}
                  key={action.id}
                  onClick={() => void resolveAction({ actionId: action.id })}
                  type="button"
                >
                  <span className="flex items-start justify-between gap-4">
                    <span className="text-sm font-semibold leading-6">
                      {action.label}
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-exploration"
                    />
                  </span>
                  <span className="mt-4 flex items-center justify-between gap-3 font-system text-[0.625rem] text-muted-foreground">
                    <span>{action.risk.toUpperCase()} RISK</span>
                    <span>−{action.energyCost} ENERGY</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <form
            className="rounded-lg border border-border bg-card p-5"
            onSubmit={(event) => void submitCustomAction(event)}
          >
            <div className="flex items-center gap-2">
              <Sparkles aria-hidden="true" className="size-4 text-ai" />
              <label className="text-sm font-semibold" htmlFor="custom-action">
                Try a custom action
              </label>
            </div>
            <p className="mt-2 text-sm leading-6 text-secondary-foreground">
              This demo interprets every custom action through the same safe,
              scripted turn result.
            </p>
            <Textarea
              aria-describedby={customError ? "custom-action-error" : undefined}
              aria-invalid={Boolean(customError)}
              className="mt-4 min-h-24"
              disabled={isSubmitting}
              id="custom-action"
              maxLength={300}
              onChange={(event) => setCustomAction(event.target.value)}
              placeholder="Example: Convince the examiner that recursion is a soft skill."
              value={customAction}
            />
            {customError ? (
              <p
                className="mt-2 text-sm text-danger"
                id="custom-action-error"
                role="alert"
              >
                {customError}
              </p>
            ) : null}
            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-system text-[0.625rem] text-muted-foreground">
                {customAction.length} / 300
              </span>
              <Button
                disabled={customAction.trim().length === 0}
                loading={isSubmitting}
                type="submit"
              >
                <Send aria-hidden="true" className="size-4" />
                Resolve custom action
              </Button>
            </div>
          </form>

          {isSubmitting ? (
            <div
              aria-live="polite"
              className="flex items-center gap-3 rounded-md border border-ai/35 bg-ai/8 px-4 py-3 text-sm"
              role="status"
            >
              <Sparkles
                aria-hidden="true"
                className="size-4 animate-pulse text-ai motion-reduce:animate-none"
              />
              The Dungeon Master is resolving one safe scripted outcome…
            </div>
          ) : null}

          {error ? (
            <div
              className="flex items-start gap-3 rounded-md border border-danger/45 bg-danger/8 px-4 py-3 text-sm text-danger"
              role="alert"
            >
              <CircleAlert
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              {error}
            </div>
          ) : null}
        </section>

        <aside className="hidden space-y-5 lg:block">
          <div className="rounded-lg border border-warning/35 bg-card p-5">
            <ObjectivePanel state={state} />
          </div>
          <div
            className={cn(
              "rounded-lg bg-card p-5",
              state.activeRule
                ? "border border-ruleshift/45 shadow-[var(--shadow-ruleshift)]"
                : "border border-border",
            )}
          >
            <RulePanel state={state} />
          </div>
          <div className="rounded-lg border border-ai/35 bg-ai/6 p-5">
            <DungeonMasterPanel
              aside={scene.dmAside}
              mood={state.character.mood}
            />
          </div>
        </aside>
      </main>

      <MobileCommandDock
        onOpen={setMobilePanel}
        state={state}
      />

      <Sheet onOpenChange={setInventoryOpen} open={inventoryOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <Badge className="w-fit" variant="success">
              Inventory
            </Badge>
            <SheetTitle>Carried anomalies</SheetTitle>
            <SheetDescription>
              Items collected during this local scripted adventure.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-7">
            <InventoryList items={state.inventory} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet onOpenChange={setTimelineOpen} open={timelineOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <Badge className="w-fit" variant="exploration">
              Timeline
            </Badge>
            <SheetTitle>Adventure events</SheetTitle>
            <SheetDescription>
              Every resolved turn and deterministic reward in this session.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-7">
            <TimelineList events={state.timeline} />
          </div>
        </SheetContent>
      </Sheet>

      <MobilePanelSheet
        onClose={() => setMobilePanel(null)}
        panel={mobilePanel}
        scene={scene}
        state={state}
      />

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            void dismissRuleShift();
          }
        }}
        open={state.showRuleShift}
      >
        <DialogContent className="border-ruleshift/60">
          <DialogHeader>
            <Badge className="w-fit" variant="ruleshift">
              <Zap aria-hidden="true" className="size-3" />
              Reality rewrite
            </Badge>
            <DialogTitle>Incorrectly Correct</DialogTitle>
            <DialogDescription>
              For three turns, incorrect answers damage enemies while correct
              answers restore their confidence. Health, energy, score, and
              victory remain deterministic.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-pressed p-4">
              <p className="font-system text-[0.625rem] text-muted-foreground">
                BEFORE
              </p>
              <p className="mt-2 text-sm text-secondary-foreground line-through">
                Correct answers deal damage.
              </p>
            </div>
            <div className="rounded-md border border-ruleshift/50 bg-ruleshift/8 p-4">
              <p className="font-system text-[0.625rem] text-ruleshift">
                AFTER
              </p>
              <p className="mt-2 text-sm font-semibold">
                Wrong answers deal damage.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => void dismissRuleShift()} variant="ruleshift">
              I understand the new rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GameHeader({
  onInventory,
  onTimeline,
  state,
}: {
  onInventory: () => void;
  onTimeline: () => void;
  state: MockGameState;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95">
      <div className="mx-auto flex min-h-16 w-full max-w-[100rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <RuleShiftMark className="shrink-0" compact />
          <span aria-hidden="true" className="hidden h-6 w-px bg-border sm:block" />
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold">{state.worldTitle}</p>
            <p className="font-system text-[0.625rem] text-muted-foreground">
              TURN {Math.min(state.turnIndex + 1, 4)} / 4 · SCORE {state.score}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            aria-label="Open inventory"
            onClick={onInventory}
            size="icon"
            variant="ghost"
          >
            <Backpack aria-hidden="true" className="size-5" />
          </Button>
          <Button
            aria-label="Open timeline"
            onClick={onTimeline}
            size="icon"
            variant="ghost"
          >
            <Clock3 aria-hidden="true" className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function ScenePanel({
  headingRef,
  scene,
  state,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
  scene: TurnScene;
  state: MockGameState;
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-strong-border bg-card shadow-[var(--shadow-elevated)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-pressed px-5 py-3">
        <Badge
          variant={
            scene.tone === "ruleshift"
              ? "ruleshift"
              : scene.tone === "reward"
                ? "success"
                : scene.tone === "encounter"
                  ? "danger"
                  : "exploration"
          }
        >
          {scene.tone === "encounter" ? (
            <Swords aria-hidden="true" className="size-3" />
          ) : (
            <Sparkles aria-hidden="true" className="size-3" />
          )}
          {scene.badge}
        </Badge>
        <span className="font-system text-[0.6875rem] text-muted-foreground">
          SCENE {state.turnIndex + 1} / 4
        </span>
      </div>

      <div className="p-5 sm:p-8">
        <h1
          className="rounded-sm font-display text-2xl font-semibold tracking-[-0.03em] outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-3xl"
          id="scene-title"
          ref={headingRef}
          tabIndex={-1}
        >
          {scene.title}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-secondary-foreground">
          {scene.narration}
        </p>
        <p className="mt-5 max-w-3xl rounded-md border border-ai/25 bg-ai/6 px-4 py-3 text-sm leading-6 text-secondary-foreground">
          {moodNarrativeCues[state.character.mood]}
        </p>

        {scene.encounter ? (
          <div className="mt-7 grid gap-4 rounded-lg border border-border bg-pressed p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-md border",
                  scene.encounter.kind === "enemy"
                    ? "border-danger/45 bg-danger/10 text-danger"
                    : "border-ai/45 bg-ai/10 text-ai",
                )}
              >
                {scene.encounter.kind === "enemy" ? (
                  <ShieldAlert className="size-5" />
                ) : (
                  <UserRound className="size-5" />
                )}
              </span>
              <div>
                <p className="font-system text-[0.625rem] text-muted-foreground">
                  {scene.encounter.kind.toUpperCase()} SIGNAL
                </p>
                <h2 className="mt-1 font-display text-base font-semibold">
                  {scene.encounter.name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-secondary-foreground">
                  {scene.encounter.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:pl-5">
              <Heart aria-hidden="true" className="size-4 text-danger" />
              <span className="font-system text-xs">
                {scene.encounter.health} HP
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function MobileCommandDock({
  onOpen,
  state,
}: {
  onOpen: (panel: MobilePanel) => void;
  state: MockGameState;
}) {
  return (
    <nav
      aria-label="Mobile game navigation"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-strong-border bg-background p-1 lg:hidden"
    >
      <MobileDockButton
        icon={UserRound}
        label="Player"
        onClick={() => onOpen("player")}
      />
      <MobileDockButton
        icon={Zap}
        label={state.activeRule ? "Rule active" : "Rule"}
        onClick={() => onOpen("rule")}
      />
      <MobileDockButton
        icon={Backpack}
        label="Items"
        onClick={() => onOpen("inventory")}
      />
      <MobileDockButton
        icon={ScrollText}
        label="Timeline"
        onClick={() => onOpen("timeline")}
      />
    </nav>
  );
}

function MobileDockButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Menu;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-[0.6875rem] font-semibold text-secondary-foreground outline-none hover:bg-white/7 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </button>
  );
}

function MobilePanelSheet({
  onClose,
  panel,
  scene,
  state,
}: {
  onClose: () => void;
  panel: MobilePanel;
  scene: TurnScene;
  state: MockGameState;
}) {
  return (
    <Sheet
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      open={panel !== null}
    >
      <SheetContent side="bottom">
        <SheetHeader>
          <Badge className="w-fit" variant="ai">
            Mobile console
          </Badge>
          <SheetTitle>
            {panel === "player"
              ? "Player status"
              : panel === "rule"
                ? "Rule and objective"
                : panel === "inventory"
                  ? "Inventory"
                  : "Adventure timeline"}
          </SheetTitle>
          <SheetDescription>
            Quick access without leaving the active story turn.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 max-h-[55vh] overflow-y-auto pb-4">
          {panel === "player" ? <PlayerPanel state={state} /> : null}
          {panel === "rule" ? (
            <div className="space-y-6">
              <ObjectivePanel state={state} />
              <RulePanel state={state} />
              <DungeonMasterPanel
                aside={scene.dmAside}
                mood={state.character.mood}
              />
            </div>
          ) : null}
          {panel === "inventory" ? (
            <InventoryList items={state.inventory} />
          ) : null}
          {panel === "timeline" ? (
            <TimelineList events={state.timeline} />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function GameLoading() {
  return (
    <div
      aria-live="polite"
      className="grid min-h-screen place-items-center bg-background px-4"
      role="status"
    >
      <div className="text-center">
        <Sparkles
          aria-hidden="true"
          className="mx-auto size-8 animate-pulse text-ai motion-reduce:animate-none"
        />
        <p className="mt-4 font-display text-lg font-semibold">
          Restoring the local adventure
        </p>
        <p className="mt-2 text-sm text-secondary-foreground">
          Reconnecting the scripted reality cartridge…
        </p>
      </div>
    </div>
  );
}
