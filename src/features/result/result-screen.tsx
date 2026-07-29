"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Crown,
  Gauge,
  Medal,
  RefreshCw,
  Share2,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PageBackground } from "@/components/layout/page-background";
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
import { Input } from "@/components/ui/input";
import { createHttpAdventureTransport } from "@/features/adventure/http-transport";
import type {
  AdventureTransport,
  CharacterPassport,
  Difficulty,
} from "@/features/adventure/types";
import { TimelineList } from "@/features/game/game-panels";
import { useGame } from "@/features/game/use-game";

interface ResultScreenProps {
  sessionId: string;
  transport?: AdventureTransport;
}

const harderDifficulty: Record<Difficulty, Difficulty> = {
  easy: "normal",
  normal: "hard",
  hard: "hard",
};

export function ResultScreen({ sessionId, transport }: ResultScreenProps) {
  const router = useRouter();
  const adventureTransport = useMemo(
    () => transport ?? createHttpAdventureTransport(),
    [transport],
  );
  const { error, isLoading, state } = useGame(
    sessionId,
    adventureTransport,
  );
  const [shareOpen, setShareOpen] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  async function restart(passport: CharacterPassport): Promise<void> {
    if (isRestarting) {
      return;
    }

    setIsRestarting(true);
    try {
      const next = await adventureTransport.createSession(passport);
      router.push(`/game/${next.sessionId}`);
    } finally {
      setIsRestarting(false);
    }
  }

  if (isLoading) {
    return (
      <div
        className="grid min-h-screen place-items-center bg-background px-4"
        role="status"
      >
        <p className="font-display text-lg font-semibold">
          Compiling your adventure record…
        </p>
      </div>
    );
  }

  if (!state) {
    return (
      <PageBackground>
        <main className="grid min-h-screen place-items-center px-4">
          <Card className="w-full max-w-lg" variant="danger">
            <CardHeader>
              <CardTitle>Result unavailable</CardTitle>
              <CardDescription>
                {error ?? "The persisted result could not be restored."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/create")}>
                Start a new adventure
              </Button>
            </CardContent>
          </Card>
        </main>
      </PageBackground>
    );
  }

  const isVictory = state.status === "victory";
  const rarestItem = state.player.inventory[0];
  const passport: CharacterPassport = {
    ...state.player.profile,
    difficulty: state.difficulty,
  };

  return (
    <PageBackground tone={isVictory ? "exploration" : "ruleshift"}>
      <header className="mx-auto flex w-full max-w-[90rem] items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-10">
        <RuleShiftMark />
        <Badge variant={isVictory ? "success" : "danger"}>
          {isVictory ? "Adventure complete" : "Timeline collapsed"}
        </Badge>
      </header>

      <main className="mx-auto w-full max-w-[90rem] px-4 pb-20 pt-8 sm:px-6 lg:px-10 lg:pb-28 lg:pt-14">
        <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div>
            {isVictory ? (
              <Trophy
                aria-hidden="true"
                className="size-10 text-warning"
              />
            ) : (
              <Sparkles
                aria-hidden="true"
                className="size-10 text-danger"
              />
            )}
            <p className="mt-7 font-system text-xs text-muted-foreground">
              {state.world.title.toUpperCase()}
            </p>
            <h1 className="mt-4 max-w-4xl font-display text-4xl font-semibold tracking-[-0.035em] sm:text-6xl">
              {isVictory
                ? "The Golden Offer Letter is yours."
                : "The campus keeps your application."}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-secondary-foreground">
              {isVictory
                ? `${state.player.profile.name} survived a hostile assessment and left the haunted campus with a legendary résumé and one suspiciously real future.`
                : `${state.player.profile.name} reached the edge of the objective before this timeline failed. The next attempt begins with everything learned.`}
            </p>
          </div>

          <div className="border-y border-success/40 bg-card px-6 py-7">
            <p className="font-system text-xs text-success">FINAL SCORE</p>
            <p className="mt-3 font-display text-5xl font-semibold tracking-[-0.04em]">
              {state.score}
            </p>
            <p className="mt-3 text-sm text-secondary-foreground">
              {state.statistics.turnsTaken} turns ·{" "}
              {state.statistics.rulesSurvived} rules survived
            </p>
          </div>
        </section>

        <section
          aria-label="Adventure highlights"
          className="mt-14 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 xl:grid-cols-4"
        >
          <ResultMetric
            icon={Medal}
            label="Outcome"
            value={isVictory ? "Victory" : "Defeat"}
          />
          <ResultMetric
            icon={Gauge}
            label="Turns"
            value={String(state.statistics.turnsTaken)}
          />
          <ResultMetric
            icon={Sparkles}
            label="Rules survived"
            value={String(state.statistics.rulesSurvived)}
          />
          <ResultMetric
            icon={Star}
            label="Rarest item"
            value={rarestItem?.name ?? "None collected"}
          />
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
          <Card variant="ai">
            <CardHeader>
              <Badge className="w-fit" variant="ai">
                Most creative action
              </Badge>
              <CardTitle className="text-xl">
                “{state.lastAction ?? "Entered the unknown"}”
              </CardTitle>
              <CardDescription>
                The deterministic engine recorded the final resolved action as
                the signature move of this session.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card variant="success">
            <CardHeader>
              <Badge className="w-fit" variant="success">
                Legendary reward
              </Badge>
              <CardTitle>
                {rarestItem?.name ?? "Golden Offer Letter"}
              </CardTitle>
              <CardDescription>
                {rarestItem?.description ??
                  "Proof that the objective was completed."}
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section className="mt-14 grid gap-8 border-t border-border pt-10 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div>
            <p className="font-system text-xs text-exploration">
              SESSION RECORD
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold">
              The complete timeline
            </h2>
            <p className="mt-3 text-sm leading-6 text-secondary-foreground">
              Every authoritative turn was validated by the game engine and
              stored with before-and-after snapshots.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 sm:p-7">
            <TimelineList events={state.history} />
          </div>
        </section>

        <section className="mt-14 flex flex-col gap-5 border-t border-border pt-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              Rewrite the run?
            </h2>
            <p className="mt-2 text-sm text-secondary-foreground">
              Replay the same passport or raise the internal difficulty.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              loading={isRestarting}
              onClick={() => void restart(passport)}
              variant="secondary"
            >
              <RefreshCw aria-hidden="true" className="size-4" />
              Play again
            </Button>
            <Button
              disabled={state.difficulty === "hard"}
              loading={isRestarting}
              onClick={() =>
                void restart({
                  ...passport,
                  difficulty: harderDifficulty[state.difficulty],
                })
              }
              variant="ruleshift"
            >
              <Gauge aria-hidden="true" className="size-4" />
              Harder remix
            </Button>
            <Button onClick={() => setShareOpen(true)} variant="ghost">
              <Share2 aria-hidden="true" className="size-4" />
              Share result
            </Button>
          </div>
        </section>
      </main>

      <Dialog onOpenChange={setShareOpen} open={shareOpen}>
        <DialogContent>
          <DialogHeader>
            <Badge className="w-fit" variant="ai">
              Share placeholder
            </Badge>
            <DialogTitle>Result links arrive in a later phase</DialogTitle>
            <DialogDescription>
              Sessions are private to this browser owner token. Public sharing
              remains intentionally disabled.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 space-y-2">
            <label className="text-sm font-semibold" htmlFor="share-preview">
              Future share link
            </label>
            <Input
              id="share-preview"
              readOnly
              value={`/result/${state.sessionId}`}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setShareOpen(false)}>
              Keep this result private
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageBackground>
  );
}

function ResultMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Crown;
  label: string;
  value: string;
}) {
  return (
    <div className="min-h-36 bg-card p-5 sm:p-6">
      <Icon aria-hidden="true" className="size-5 text-exploration" />
      <p className="mt-6 font-system text-[0.625rem] text-muted-foreground">
        {label.toUpperCase()}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6">{value}</p>
    </div>
  );
}
