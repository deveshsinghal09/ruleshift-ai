"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Backpack,
  ChevronRight,
  CircleAlert,
  CircleHelp,
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
import { AudioControls } from "@/components/audio/audio-controls";
import { useAudio } from "@/components/audio/audio-provider";
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
import { getActionEnergyCost } from "@/domain/game/difficulty";
import { customActionTextSchema } from "@/domain/game/schemas";
import type { LocalGameEvent } from "@/domain/game/types";
import { getRuleActionAvailability } from "@/domain/rules/lifecycle";
import { moodNarrativeCues } from "@/features/adventure/mock-data";
import type {
  AdventureTransport,
  GameState,
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
import { FirstTurnGuide } from "@/features/game/first-turn-guide";
import { getRuleBeforeExplanation } from "@/features/game/rule-explanations";
import {
  buildTurnResolutionReceipt,
  type TurnResolutionReceipt as TurnResolutionReceiptModel,
} from "@/features/game/turn-resolution";
import { TurnResolutionReceipt } from "@/features/game/turn-resolution-receipt";
import { useGame } from "@/features/game/use-game";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { getMotionTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";

type MobilePanel = "player" | "rule" | "timeline" | "inventory" | null;

const onboardingStorageKey = "ruleshift:first-turn-briefing:v1";

function hasDismissedFirstTurnBriefing(): boolean {
  if (typeof globalThis.localStorage === "undefined") {
    return false;
  }
  try {
    return globalThis.localStorage.getItem(onboardingStorageKey) === "complete";
  } catch {
    return false;
  }
}

interface GameScreenProps {
  onComplete?: (sessionId: string) => void;
  sessionId: string;
  transport?: AdventureTransport;
}

export function GameScreen({
  onComplete,
  sessionId,
  transport,
}: GameScreenProps) {
  const router = useRouter();
  const {
    error,
    isLoading,
    isSubmitting,
    state,
    submitAction,
  } = useGame(sessionId, transport);
  const [customAction, setCustomAction] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const [briefingDismissed, setBriefingDismissed] = useState(
    hasDismissedFirstTurnBriefing,
  );
  const [briefingRequested, setBriefingRequested] = useState(false);
  const [turnReceipt, setTurnReceipt] =
    useState<TurnResolutionReceiptModel | null>(null);
  const [dismissedAnnouncementId, setDismissedAnnouncementId] = useState<
    string | null
  >(null);
  const sceneHeadingRef = useRef<HTMLHeadingElement>(null);
  const actionsHeadingRef = useRef<HTMLHeadingElement>(null);
  const reduceMotion = useReducedMotionPreference();
  const { playCue } = useAudio();

  useEffect(() => {
    if (
      state &&
      state.turn > 0 &&
      (!state.currentEvent.announcement ||
        state.currentEvent.announcement.id === dismissedAnnouncementId)
    ) {
      sceneHeadingRef.current?.focus();
    }
  }, [dismissedAnnouncementId, state]);

  function dismissBriefing(): void {
    try {
      globalThis.localStorage.setItem(onboardingStorageKey, "complete");
    } catch {
      // The briefing still dismisses when storage is blocked.
    }
    setBriefingDismissed(true);
    setBriefingRequested(false);
    actionsHeadingRef.current?.focus();
  }

  async function resolveAction(request: {
    actionId?: string;
    customAction?: string;
  }): Promise<void> {
    if (isSubmitting || !state) {
      return;
    }

    const previousState = state;
    playCue("action");
    const nextState = await submitAction(request);
    if (nextState) {
      setTurnReceipt(buildTurnResolutionReceipt(previousState, nextState));
      const previousItems = previousState.player.inventory.reduce(
        (total, item) => total + item.quantity,
        0,
      );
      const nextItems = nextState.player.inventory.reduce(
        (total, item) => total + item.quantity,
        0,
      );
      const activatedRule = nextState.activeRules.some(
        (rule) =>
          !previousState.activeRules.some(
            (previousRule) => previousRule.id === rule.id,
          ),
      );
      if (nextState.status === "victory") {
        playCue("victory");
      } else if (nextState.status === "defeat") {
        playCue("defeat");
      } else if (activatedRule) {
        playCue("ruleshift");
      } else if (nextItems > previousItems) {
        playCue("item");
      } else if (nextState.player.health < previousState.player.health) {
        playCue("damage");
      }
    }
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
    const result = customActionTextSchema.safeParse(customAction);
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
      <main
        className="grid min-h-screen place-items-center bg-background px-4"
        id="main-content"
        tabIndex={-1}
      >
        <Card className="w-full max-w-lg" variant="danger">
          <CardHeader>
            <CircleAlert aria-hidden="true" className="size-7 text-danger" />
            <CardTitle>Adventure signal lost</CardTitle>
            <CardDescription>
              {error ??
                "This adventure was not found. Create a new passport to continue."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/create")}>
              Create a new passport
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const scene = state.currentEvent;
  const announcement = scene.announcement;
  const announcedRule = announcement
    ? state.activeRules.find((rule) => rule.id === announcement.id)
    : undefined;
  const latestRuleEvent = state.ruleEvents.at(-1);
  const showAnnouncement =
    announcement !== undefined &&
    announcement.id !== dismissedAnnouncementId;
  const showBriefing =
    briefingRequested || (state.turn === 0 && !briefingDismissed);

  return (
    <div className="game-shell min-h-screen bg-background pb-20 text-foreground lg:pb-0">
      <GameHeader
        onBriefing={() => setBriefingRequested(true)}
        onInventory={() => setInventoryOpen(true)}
        onTimeline={() => setTimelineOpen(true)}
        state={state}
      />

      <GameAnnouncements state={state} />

      <main className="mx-auto grid w-full max-w-[100rem] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[15.5rem_minmax(0,1fr)_18rem] lg:gap-6 lg:px-8 lg:py-7" id="main-content" tabIndex={-1}>
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-lg border border-border bg-card p-5">
            <PlayerPanel state={state} />
          </div>
        </aside>

        <section aria-labelledby="scene-title" className="min-w-0 space-y-5">
          {showBriefing ? (
            <FirstTurnGuide
              objective={state.objectives[0]?.title ?? "Complete the active objective"}
              onDismiss={dismissBriefing}
            />
          ) : null}

          <div className="rounded-lg border border-warning/35 bg-card p-5 lg:hidden">
            <ObjectivePanel state={state} />
          </div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{
              opacity: reduceMotion ? 1 : 0.76,
              y: reduceMotion ? 0 : 8,
            }}
            key={scene.id}
            transition={getMotionTransition("deliberate", reduceMotion)}
          >
            <ScenePanel
              headingRef={sceneHeadingRef}
              scene={scene}
              state={state}
            />
          </motion.div>
          <RewardSummary state={state} />
          {turnReceipt ? <TurnResolutionReceipt receipt={turnReceipt} /> : null}

          <div aria-labelledby="actions-title">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-system text-[0.6875rem] text-exploration">
                  YOUR MOVE
                </p>
                <h2
                  className="mt-1 font-display text-xl font-semibold"
                  id="actions-title"
                  ref={actionsHeadingRef}
                  tabIndex={-1}
                >
                  Choose an action
                </h2>
              </div>
              <span className="font-system text-xs text-muted-foreground">
                {scene.choices.length} OPTIONS
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {scene.choices.map((action) => {
                const energyCost = getActionEnergyCost(
                  state.difficulty,
                  action.energyCost,
                );
                const ruleAvailability = getRuleActionAvailability(
                  state,
                  action,
                );
                const unavailableReason =
                  action.unavailableReason ??
                  ruleAvailability.reason ??
                  (state.player.energy < energyCost
                    ? "Not enough energy for this action."
                    : undefined);
                return (
                  <button
                    aria-describedby={
                      unavailableReason ? `${action.id}-reason` : undefined
                    }
                    aria-disabled={Boolean(unavailableReason) || undefined}
                    className={cn(
                      "group min-h-28 rounded-lg border border-border bg-card p-5 text-left outline-none transition-[border-color,background-color,transform]",
                      "hover:-translate-y-0.5 hover:border-exploration/60 hover:bg-exploration/5",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      "disabled:pointer-events-none disabled:opacity-45 aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
                    )}
                    disabled={isSubmitting}
                    key={action.id}
                    onClick={() => {
                      if (!unavailableReason) {
                        void resolveAction({ actionId: action.id });
                      }
                    }}
                    title={unavailableReason}
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
                      <span>−{energyCost} ENERGY</span>
                    </span>
                    {unavailableReason ? (
                      <span
                        className="mt-2 block text-xs leading-5 text-danger"
                        id={`${action.id}-reason`}
                      >
                        Unavailable: {unavailableReason}
                      </span>
                    ) : null}
                  </button>
                );
              })}
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
              Custom text is validated, then resolved through the same
              deterministic engine as every prepared action.
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
              The deterministic engine is resolving this turn…
            </div>
          ) : null}

          {latestRuleEvent &&
          latestRuleEvent.turn === state.turn &&
          (latestRuleEvent.type === "expired" ||
            latestRuleEvent.type === "replaced" ||
            latestRuleEvent.type === "rejected") ? (
            <div
              aria-live="polite"
              className="flex items-start gap-3 rounded-md border border-ruleshift/35 bg-ruleshift/8 px-4 py-3 text-sm"
              role="status"
            >
              <Zap
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-ruleshift"
              />
              <span>
                <strong className="font-semibold">
                  RuleShift {latestRuleEvent.type}.
                </strong>{" "}
                {latestRuleEvent.message}
              </span>
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
              state.currentEvent.announcement
                ? "border border-ruleshift/45 shadow-[var(--shadow-ruleshift)]"
                : "border border-border",
            )}
          >
            <RulePanel state={state} />
          </div>
          <div className="rounded-lg border border-ai/35 bg-ai/6 p-5">
            <DungeonMasterPanel
              aside={scene.dmAside}
              mood={state.player.profile.mood}
            />
          </div>
        </aside>
      </main>

      <MobileCommandDock
        onStory={() => {
          setMobilePanel(null);
          sceneHeadingRef.current?.scrollIntoView({ block: "start" });
          sceneHeadingRef.current?.focus();
        }}
        onOpen={setMobilePanel}
        state={state}
      />

      <Sheet onOpenChange={setInventoryOpen} open={inventoryOpen}>
        <SheetContent side="responsive">
          <SheetHeader>
            <Badge className="w-fit" variant="success">
              Inventory
            </Badge>
            <SheetTitle>Carried anomalies</SheetTitle>
            <SheetDescription>
              Items collected by deterministic engine effects.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-7">
            <InventoryList items={state.player.inventory} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet onOpenChange={setTimelineOpen} open={timelineOpen}>
        <SheetContent side="responsive">
          <SheetHeader>
            <Badge className="w-fit" variant="exploration">
              History
            </Badge>
            <SheetTitle>Adventure history</SheetTitle>
            <SheetDescription>
              Every resolved turn and deterministic reward in this session.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-7">
            <TimelineList events={state.history} />
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
          if (!open && announcement) {
            setDismissedAnnouncementId(announcement.id);
          }
        }}
        open={showAnnouncement}
      >
        <DialogContent className="border-ruleshift/60">
          <DialogHeader>
            <Badge className="w-fit" variant="ruleshift">
              <Zap aria-hidden="true" className="size-3" />
              Reality rewrite
            </Badge>
            <DialogTitle>{announcement?.name}</DialogTitle>
            <DialogDescription>
              {announcement?.description} The registered rule may alter this
              turn, while health, energy, score, inventory, objectives, and
              outcomes remain validated by the deterministic engine.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-pressed p-4">
              <p className="font-system text-[0.6875rem] font-semibold text-secondary-foreground">
                BEFORE
              </p>
              <p className="mt-2 text-sm text-secondary-foreground line-through">
                {announcement
                  ? getRuleBeforeExplanation(announcement.ruleKey)
                  : "Ordinary deterministic rules apply."}
              </p>
            </div>
            <div className="rounded-md border border-ruleshift/50 bg-ruleshift/8 p-4">
              <p className="font-system text-[0.6875rem] font-semibold text-[#fda4af]">
                NOW
              </p>
              <p className="mt-2 text-sm font-semibold">
                {announcedRule?.uiExplanation ??
                  "The proposal was rejected by the safe rule registry."}
              </p>
            </div>
          </div>
          {announcedRule ? (
            <p className="mt-4 font-system text-xs font-semibold text-[#fda4af]">
              {announcedRule.remainingTurns} OF {announcedRule.totalTurns} TURNS
              REMAIN
            </p>
          ) : null}
          <DialogFooter>
            <Button
              onClick={() =>
                setDismissedAnnouncementId(announcement?.id ?? null)
              }
              variant="ruleshift"
            >
              Continue with deterministic rules
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GameHeader({
  onBriefing,
  onInventory,
  onTimeline,
  state,
}: {
  onBriefing: () => void;
  onInventory: () => void;
  onTimeline: () => void;
  state: GameState;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95">
      <div className="mx-auto flex min-h-16 w-full max-w-[100rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <RuleShiftMark className="shrink-0" compact />
          <span aria-hidden="true" className="hidden h-6 w-px bg-border sm:block" />
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold">
              {state.world.title}
            </p>
            <p className="font-system text-[0.625rem] text-muted-foreground">
              TURN {Math.min(state.turn + 1, 4)} / 4 · SCORE {state.score}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            aria-label="Show game briefing"
            onClick={onBriefing}
            size="icon"
            variant="ghost"
          >
            <CircleHelp aria-hidden="true" className="size-5" />
          </Button>
          <Button
            aria-label="Open inventory"
            onClick={onInventory}
            size="icon"
            variant="ghost"
          >
            <Backpack aria-hidden="true" className="size-5" />
          </Button>
          <Button
            aria-label="Open adventure history"
            onClick={onTimeline}
            size="icon"
            variant="ghost"
          >
            <Clock3 aria-hidden="true" className="size-5" />
          </Button>
          <AudioControls />
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
  scene: LocalGameEvent;
  state: GameState;
}) {
  const encounter = scene.enemyId
    ? state.enemies.find((enemy) => enemy.id === scene.enemyId)
    : scene.npcId
      ? state.npcs.find((npc) => npc.id === scene.npcId)
      : undefined;
  const encounterKind = scene.enemyId ? "enemy" : "npc";

  return (
    <article className="overflow-hidden rounded-lg border border-strong-border bg-card shadow-[var(--shadow-elevated)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-pressed px-5 py-3">
        <Badge
          variant={
            scene.announcement
              ? "ruleshift"
              : scene.kind === "reward"
                ? "success"
                : scene.kind === "combat" || scene.kind === "trap"
                  ? "danger"
                  : "exploration"
          }
        >
          {scene.kind === "combat" ? (
            <Swords aria-hidden="true" className="size-3" />
          ) : (
            <Sparkles aria-hidden="true" className="size-3" />
          )}
          {scene.badge}
        </Badge>
        <span className="font-system text-[0.6875rem] text-muted-foreground">
          SCENE {Math.min(state.turn + 1, 4)} / 4
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
          {moodNarrativeCues[state.player.profile.mood]}
        </p>

        {encounter ? (
          <div className="mt-7 grid gap-4 rounded-lg border border-border bg-pressed p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-md border",
                  encounterKind === "enemy"
                    ? "border-danger/45 bg-danger/10 text-danger"
                    : "border-ai/45 bg-ai/10 text-ai",
                )}
              >
                {encounterKind === "enemy" ? (
                  <ShieldAlert className="size-5" />
                ) : (
                  <UserRound className="size-5" />
                )}
              </span>
              <div>
                <p className="font-system text-[0.625rem] text-muted-foreground">
                  {encounterKind.toUpperCase()} SIGNAL
                </p>
                <h2 className="mt-1 font-display text-base font-semibold">
                  {encounter.name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-secondary-foreground">
                  {encounter.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:pl-5">
              <Heart aria-hidden="true" className="size-4 text-danger" />
              <span className="font-system text-xs">
                {"health" in encounter
                  ? `${encounter.health} / ${encounter.maxHealth} HP`
                  : `${encounter.relationship} RELATIONSHIP`}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function GameAnnouncements({ state }: { state: GameState }) {
  const previousStateRef = useRef(state);
  const [politeMessage, setPoliteMessage] = useState("");
  const [urgentMessage, setUrgentMessage] = useState("");

  useEffect(() => {
    const previous = previousStateRef.current;
    if (previous === state) {
      return;
    }

    const polite: string[] = [];
    const urgent: string[] = [];
    const healthChange = state.player.health - previous.player.health;
    const energyChange = state.player.energy - previous.player.energy;

    if (healthChange < 0) {
      urgent.push(
        `Health decreased by ${Math.abs(healthChange)} to ${state.player.health}.`,
      );
    } else if (healthChange > 0) {
      polite.push(
        `Health increased by ${healthChange} to ${state.player.health}.`,
      );
    }

    if (energyChange !== 0) {
      polite.push(
        `Energy ${energyChange > 0 ? "increased" : "decreased"} by ${Math.abs(energyChange)} to ${state.player.energy}.`,
      );
    }

    if (state.currentEvent.id !== previous.currentEvent.id) {
      polite.push(
        `New narration: ${state.currentEvent.title}. ${state.currentEvent.narration}`,
      );
    }

    const previousRuleIds = new Set(
      previous.ruleEvents.map((event) => event.id),
    );
    const newRuleEvent = state.ruleEvents.find(
      (event) => !previousRuleIds.has(event.id),
    );
    if (newRuleEvent) {
      urgent.push(
        newRuleEvent.type === "activated"
          ? `RuleShift activated: ${newRuleEvent.ruleName}.`
          : `Rule ${newRuleEvent.type}: ${newRuleEvent.ruleName}.`,
      );
    }

    const previousItems = new Map(
      previous.player.inventory.map((item) => [item.id, item.quantity]),
    );
    const gainedItem = state.player.inventory.find(
      (item) => item.quantity > (previousItems.get(item.id) ?? 0),
    );
    if (gainedItem) {
      polite.push(`${gainedItem.name} added to inventory.`);
    }

    setPoliteMessage(polite.join(" "));
    setUrgentMessage(urgent.join(" "));
    previousStateRef.current = state;
  }, [state]);

  return (
    <>
      <p aria-atomic="true" aria-live="polite" className="sr-only">
        {politeMessage}
      </p>
      <p aria-atomic="true" aria-live="assertive" className="sr-only">
        {urgentMessage}
      </p>
    </>
  );
}

function MobileCommandDock({
  onOpen,
  onStory,
  state,
}: {
  onOpen: (panel: MobilePanel) => void;
  onStory: () => void;
  state: GameState;
}) {
  return (
    <nav
      aria-label="Mobile game navigation"
      className="game-mobile-dock fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-strong-border bg-background p-1 transition-transform duration-150 lg:hidden motion-reduce:transition-none"
    >
      <MobileDockButton
        current
        icon={ScrollText}
        label="Story"
        onClick={onStory}
      />
      <MobileDockButton
        icon={UserRound}
        label="Player"
        onClick={() => onOpen("player")}
      />
      <MobileDockButton
        icon={Zap}
        label={
          state.activeRules.length > 0
            ? `Rules ${state.activeRules.length}`
            : "Rules"
        }
        onClick={() => onOpen("rule")}
      />
      <MobileDockButton
        icon={Backpack}
        label="Inventory"
        onClick={() => onOpen("inventory")}
      />
      <MobileDockButton
        icon={Clock3}
        label="History"
        onClick={() => onOpen("timeline")}
      />
    </nav>
  );
}

function MobileDockButton({
  current = false,
  icon: Icon,
  label,
  onClick,
}: {
  current?: boolean;
  icon: typeof Menu;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-current={current ? "page" : undefined}
      className="flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 text-[0.625rem] font-semibold text-secondary-foreground outline-none hover:bg-white/7 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:text-[0.6875rem]"
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
  scene: LocalGameEvent;
  state: GameState;
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
      <SheetContent side="responsive">
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
                  : "Adventure history"}
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
                mood={state.player.profile.mood}
              />
            </div>
          ) : null}
          {panel === "inventory" ? (
            <InventoryList items={state.player.inventory} />
          ) : null}
          {panel === "timeline" ? (
            <TimelineList events={state.history} />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function GameLoading() {
  return (
    <main
      aria-live="polite"
      className="grid min-h-screen place-items-center bg-background px-4"
      id="main-content"
      role="status"
      tabIndex={-1}
    >
      <div className="text-center">
        <Sparkles
          aria-hidden="true"
          className="mx-auto size-8 animate-pulse text-ai motion-reduce:animate-none"
        />
        <p className="mt-4 font-display text-lg font-semibold">
          Restoring your adventure
        </p>
        <p className="mt-2 text-sm text-secondary-foreground">
          Reconnecting the deterministic reality cartridge…
        </p>
      </div>
    </main>
  );
}
