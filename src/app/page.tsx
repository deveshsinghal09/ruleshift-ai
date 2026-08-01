/*
THESIS: The landing page presents RuleShift as a physical reality cartridge,
not a chatbot or generic game grid.
OWN-WORLD: Ink hardware, graphite plates, etched typography, cyan wayfinding,
and one magenta seam reserved for rewritten rules.
STORY: See a rule change, understand the safe-chaos premise, then enter a short
adventure.
FIRST VIEWPORT: A left-aligned promise and CTA face a working rule cartridge at
equal scale; the mechanism is visible before any explanation.
FORM: An established-world Persuade surface using an asymmetrical console-bay
composition; no new visual-world seed was needed.
*/

import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Cpu,
  Crown,
  Map,
  ShieldCheck,
  Sparkles,
  Swords,
  Zap,
} from "lucide-react";
import { PageBackground } from "@/components/layout/page-background";
import { SiteHeader } from "@/components/navigation/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RulePreview } from "@/features/landing/rule-preview";
import { exampleWorlds } from "@/features/adventure/mock-data";

const steps = [
  {
    icon: Crown,
    title: "Create your hero",
    description:
      "Choose a character, mood, and hidden difficulty profile in under a minute.",
  },
  {
    icon: Map,
    title: "Read the world",
    description:
      "Every turn gives you a clear objective, a short scene, and meaningful actions.",
  },
  {
    icon: Zap,
    title: "Survive the shift",
    description:
      "Temporary rules invert familiar logic without taking control away from you.",
  },
] as const;

export default function HomePage() {
  return (
    <PageBackground tone="ai">
      <SiteHeader />

      <main id="main-content" tabIndex={-1}>
        <section className="mx-auto grid min-h-[calc(100svh-84px)] w-full max-w-[90rem] items-center gap-12 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.8fr)] lg:gap-16 lg:px-10 lg:pb-24">
          <div className="max-w-3xl">
            <Badge className="mb-6" variant="ai">
              <Sparkles aria-hidden="true" className="size-3" />
              AI creates the surprise. The engine keeps it fair.
            </Badge>
            <h1 className="font-display text-[clamp(2.75rem,7vw,5.8rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-foreground">
              The world is stable.
              <span className="mt-2 block text-ruleshift">
                Until it changes the rules.
              </span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-secondary-foreground sm:text-xl">
              Generative games are creative but unreliable when the model also
              controls the rules. Here, AI invents the story while a
              deterministic engine calculates every consequence.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild className="w-full sm:w-auto" size="lg">
                <Link href="/create">
                  Start your adventure
                  <ArrowRight aria-hidden="true" className="size-5" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                No account. No install. Your session resumes in this browser.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-5 text-sm text-secondary-foreground">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck
                  aria-hidden="true"
                  className="size-4 text-success"
                />
                Registered RuleShifts
              </span>
              <span className="inline-flex items-center gap-2">
                <Cpu aria-hidden="true" className="size-4 text-ai" />
                Survives AI failure
              </span>
              <span className="inline-flex items-center gap-2">
                <Compass
                  aria-hidden="true"
                  className="size-4 text-exploration"
                />
                Deterministic outcomes
              </span>
            </div>
          </div>

          <RulePreview />
        </section>

        <section className="border-y border-border bg-surface-secondary">
          <div className="mx-auto grid w-full max-w-[90rem] gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16 lg:px-10 lg:py-20">
            <div>
              <p className="font-system text-xs text-ruleshift">
                THE PROBLEM
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
                Creative AI should not be the referee.
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-danger">
                  Ordinary generative play
                </p>
                <p className="mt-2 text-base leading-7 text-secondary-foreground">
                  A model can forget state, invent mechanics, contradict an
                  earlier turn, or make an unfair call.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-success">
                  RuleShift&apos;s contract
                </p>
                <p className="mt-2 text-base leading-7 text-secondary-foreground">
                  AI proposes creative content. Validated TypeScript rules and
                  a seeded engine decide what actually happens.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="border-b border-border bg-background"
          id="how-it-works"
        >
          <div className="mx-auto grid w-full max-w-[90rem] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[18rem_1fr] lg:px-10 lg:py-28">
            <div>
              <p className="font-system text-xs text-exploration">
                ADVENTURE PROTOCOL
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em]">
                Three moves from blank page to broken reality.
              </h2>
            </div>
            <ol className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
              {steps.map((step, index) => (
                <li className="bg-card p-6 sm:p-8" key={step.title}>
                  <div className="mb-10 flex items-center justify-between">
                    <step.icon
                      aria-hidden="true"
                      className="size-6 text-exploration"
                    />
                    <span className="font-system text-xs text-muted-foreground">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-secondary-foreground">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[90rem] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:items-end">
            <div>
              <Badge variant="exploration">Example worlds</Badge>
              <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                Every adventure begins somewhere impossible.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-secondary-foreground lg:justify-self-end">
              Worlds carry their own objective, cast, danger, and comic logic.
              The demo begins where campus placement season became a dark
              fantasy.
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-[1.3fr_0.85fr_0.85fr]">
            {exampleWorlds.map((world, index) => (
              <article
                className={
                  index === 0
                    ? "min-h-80 rounded-lg border border-exploration/40 bg-card p-7 shadow-[var(--shadow-elevated)]"
                    : "min-h-64 rounded-lg border border-border bg-card p-7"
                }
                key={world.title}
              >
                <div className="flex h-full flex-col justify-between gap-10">
                  <div className="flex items-center justify-between gap-4">
                    {index === 0 ? (
                      <Swords
                        aria-hidden="true"
                        className="size-7 text-exploration"
                      />
                    ) : (
                      <Compass
                        aria-hidden="true"
                        className="size-6 text-muted-foreground"
                      />
                    )}
                    <span className="font-system text-[0.6875rem] text-muted-foreground">
                      {world.signal}
                    </span>
                  </div>
                  <div>
                    <h3
                      className={
                        index === 0
                          ? "font-display text-2xl font-semibold tracking-[-0.025em]"
                          : "font-display text-lg font-semibold tracking-[-0.02em]"
                      }
                    >
                      {world.title}
                    </h3>
                    <p className="mt-4 text-sm leading-6 text-secondary-foreground">
                      {world.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-ruleshift/25 bg-card">
          <div className="relative mx-auto grid w-full max-w-[90rem] gap-10 overflow-hidden px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-10 lg:py-28">
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-px w-[55rem] -translate-x-1/2 -rotate-6 bg-ruleshift opacity-45 shadow-[18px_12px_0_rgb(34_211_238_/_35%)]"
            />
            <div className="relative">
              <Badge variant="ruleshift">Rule showcase</Badge>
              <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
                Chaos has a contract.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-secondary-foreground">
                A RuleShift can invert combat, alter item value, or reward the
                unexpected. It can never execute code or secretly rewrite your
                health, score, or victory conditions.
              </p>
            </div>

            <div className="relative border-y border-ruleshift/55 bg-pressed px-5 py-8 shadow-[var(--shadow-ruleshift)] sm:px-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-system text-xs text-[#fda4af]">
                  ACTIVE RULE / 3 TURNS
                </span>
                <Zap aria-hidden="true" className="size-5 text-ruleshift" />
              </div>
              <p className="mt-8 font-display text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
                Incorrect answers damage enemies.
              </p>
              <p className="mt-4 text-secondary-foreground">
                Correct answers restore their confidence.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-[90rem] flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-10 lg:py-32">
          <Sparkles aria-hidden="true" className="size-8 text-ai" />
          <h2 className="mt-6 max-w-4xl font-display text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
            Your next wrong answer might save the world.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-secondary-foreground">
            Build a hero, survive four connected turns, and claim the Golden
            Offer Letter through AI creativity and deterministic consequences.
          </p>
          <Button asChild className="mt-8" size="lg">
            <Link href="/create">
              Begin the demo
              <ArrowRight aria-hidden="true" className="size-5" />
            </Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
          <span>RuleShift AI · Deterministic adventure engine</span>
          <span>Reality changes. The rules stay safe.</span>
        </div>
      </footer>
    </PageBackground>
  );
}
