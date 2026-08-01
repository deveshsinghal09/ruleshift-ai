"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Dices,
  Feather,
  Gauge,
  RefreshCw,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  demoCharacters,
  difficultyLabels,
  difficultyOptions,
  mockGeneratedSuggestions,
  moods,
} from "@/features/adventure/mock-data";
import { createHttpAdventureTransport } from "@/features/adventure/http-transport";
import { characterPassportSchema } from "@/features/adventure/schema";
import {
  loadCharacterDraft,
  saveCharacterDraft,
} from "@/features/adventure/storage";
import type {
  CharacterOption,
  CharacterPassport,
  Difficulty,
  AdventureTransport,
  MoodId,
} from "@/features/adventure/types";
import { cn } from "@/lib/utils";

const steps = [
  { icon: UserRound, label: "Character" },
  { icon: Feather, label: "Mood" },
  { icon: Gauge, label: "Difficulty" },
  { icon: Check, label: "Passport" },
] as const;

const defaultPassport: CharacterPassport = {
  archetype: demoCharacters[0].archetype,
  difficulty: "normal",
  mood: "fantasy",
  name: demoCharacters[0].name,
  title: demoCharacters[0].title,
};

interface CharacterCreatorProps {
  onComplete?: (sessionId: string) => void;
  transport?: AdventureTransport;
}

function matchesCharacter(
  passport: CharacterPassport,
  character: CharacterOption,
): boolean {
  return (
    passport.name === character.name &&
    passport.title === character.title &&
    passport.archetype === character.archetype
  );
}

export function CharacterCreator({
  onComplete,
  transport,
}: CharacterCreatorProps) {
  const router = useRouter();
  const adventureTransport = useMemo(
    () => transport ?? createHttpAdventureTransport(),
    [transport],
  );
  const [step, setStep] = useState(0);
  const [passport, setPassport] =
    useState<CharacterPassport>(defaultPassport);
  const [selectedId, setSelectedId] = useState(demoCharacters[0].id);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const previousStepRef = useRef(step);

  useEffect(() => {
    if (previousStepRef.current === step) {
      return;
    }
    previousStepRef.current = step;
    const headingIds = [
      "character-heading",
      "mood-heading",
      "difficulty-heading",
      "passport-heading",
    ] as const;
    document.getElementById(headingIds[step])?.focus();
  }, [step]);

  useEffect(() => {
    let isActive = true;

    queueMicrotask(() => {
      if (!isActive) {
        return;
      }

      const draft = loadCharacterDraft();
      if (draft) {
        setPassport(draft);
        const knownCharacter = [
          ...demoCharacters,
          ...mockGeneratedSuggestions,
        ].find((character) => matchesCharacter(draft, character));
        setSelectedId(knownCharacter?.id ?? "custom");
      }
      setHasHydrated(true);
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (hasHydrated) {
      saveCharacterDraft(passport);
    }
  }, [hasHydrated, passport]);

  function selectCharacter(character: CharacterOption): void {
    setPassport((current) => ({
      ...current,
      archetype: character.archetype,
      name: character.name,
      title: character.title,
    }));
    setSelectedId(character.id);
    setError(null);
  }

  function chooseSurprise(): void {
    const candidates = [...demoCharacters, ...mockGeneratedSuggestions];
    const nextIndex =
      (candidates.findIndex((candidate) => candidate.id === selectedId) + 3) %
      candidates.length;
    selectCharacter(candidates[nextIndex]);
    setShowSuggestions(true);
  }

  function validateCharacter(): boolean {
    const result = characterPassportSchema.safeParse(passport);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Complete this step.");
      return false;
    }

    setPassport(result.data);
    setError(null);
    return true;
  }

  function nextStep(): void {
    if (step === 0 && !validateCharacter()) {
      return;
    }

    setStep((current) => Math.min(steps.length - 1, current + 1));
  }

  function previousStep(): void {
    setError(null);
    setStep((current) => Math.max(0, current - 1));
  }

  async function startAdventure(): Promise<void> {
    if (!validateCharacter() || isStarting) {
      return;
    }

    setIsStarting(true);
    try {
      const session = await adventureTransport.createSession(passport);
      if (onComplete) {
        onComplete(session.sessionId);
      } else {
        router.push(`/game/${session.sessionId}`);
      }
    } catch {
      setError(
        "The adventure archive could not start. Review the passport and try again.",
      );
      setIsStarting(false);
    }
  }

  const mood = moods.find((candidate) => candidate.id === passport.mood);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-4 sm:px-6 lg:px-10 lg:pb-24">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Button
          aria-label={step === 0 ? "Return home" : "Previous step"}
          onClick={() => {
            if (step === 0) {
              router.push("/");
            } else {
              previousStep();
            }
          }}
          size="icon"
          variant="ghost"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Button>
        <p className="font-system text-xs text-muted-foreground">
          PASSPORT / {step + 1} OF {steps.length}
        </p>
      </div>

      <ol
        aria-label="Character creation progress"
        className="mb-10 grid grid-cols-4 gap-2"
      >
        {steps.map((item, index) => (
          <li
            aria-current={index === step ? "step" : undefined}
            className={cn(
              "flex min-h-12 items-center justify-center gap-2 border-b-2 px-2 text-xs font-semibold text-muted-foreground",
              index < step && "border-success text-success",
              index === step && "border-exploration text-foreground",
              index > step && "border-border",
            )}
            key={item.label}
          >
            <item.icon aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <section aria-labelledby="character-heading">
          <div className="max-w-3xl">
            <Badge variant="exploration">Choose a playable identity</Badge>
            <h1
              className="mt-5 font-display text-3xl font-semibold tracking-[-0.03em] sm:text-5xl"
              id="character-heading"
              tabIndex={-1}
            >
              Who enters the unstable world?
            </h1>
            <p className="mt-4 text-base leading-7 text-secondary-foreground">
              Pick a prepared hero, use a local suggestion, or write your own.
              Your selection survives every back step.
            </p>
          </div>

          <div
            aria-label="Prepared characters"
            className="mt-10 grid gap-4 md:grid-cols-3"
            role="group"
          >
            {demoCharacters.map((character) => (
              <CharacterChoice
                character={character}
                isSelected={selectedId === character.id}
                key={character.id}
                onSelect={selectCharacter}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              onClick={() => setShowSuggestions((current) => !current)}
              variant="secondary"
            >
              <RefreshCw aria-hidden="true" className="size-4" />
              {showSuggestions ? "Hide suggestions" : "Generate 3 suggestions"}
            </Button>
            <Button onClick={chooseSurprise} variant="ghost">
              <Dices aria-hidden="true" className="size-4" />
              Surprise me
            </Button>
          </div>

          {showSuggestions ? (
            <div className="mt-6 rounded-lg border border-ai/35 bg-ai/6 p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-base font-semibold">
                  Locally generated suggestions
                </h2>
                <Badge variant="ai">Mock generator</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {mockGeneratedSuggestions.map((character) => (
                  <CharacterChoice
                    character={character}
                    compact
                    isSelected={selectedId === character.id}
                    key={character.id}
                    onSelect={selectCharacter}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8 rounded-lg border border-border bg-card p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold">
                  Write your own
                </h2>
                <p className="mt-1 text-sm text-secondary-foreground">
                  A name and title are enough for the scripted demo.
                </p>
              </div>
              {selectedId === "custom" ? (
                <Badge variant="exploration">Selected</Badge>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="hero-name">
                  Character name
                </label>
                <Input
                  aria-describedby={error ? "character-error" : undefined}
                  aria-invalid={Boolean(error)}
                  id="hero-name"
                  maxLength={32}
                  onChange={(event) => {
                    setPassport((current) => ({
                      ...current,
                      name: event.target.value,
                    }));
                    setSelectedId("custom");
                  }}
                  value={passport.name}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="hero-title">
                  Character title
                </label>
                <Input
                  aria-describedby={error ? "character-error" : undefined}
                  aria-invalid={Boolean(error)}
                  id="hero-title"
                  maxLength={56}
                  onChange={(event) => {
                    const title = event.target.value;
                    setPassport((current) => ({
                      ...current,
                      archetype: title.replace(/^the\s+/i, "") || "Adventurer",
                      title,
                    }));
                    setSelectedId("custom");
                  }}
                  value={passport.title}
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section aria-labelledby="mood-heading">
          <Badge variant="ai">Set the narrative signal</Badge>
          <h1
            className="mt-5 font-display text-3xl font-semibold tracking-[-0.03em] sm:text-5xl"
            id="mood-heading"
            tabIndex={-1}
          >
            How should this world feel?
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-secondary-foreground">
            Mood changes presentation and tone. It never hides objectives or
            mechanical consequences.
          </p>

          <div
            aria-label="Adventure mood"
            className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            role="group"
          >
            {moods.map((option) => {
              const selected = passport.mood === option.id;
              return (
                <button
                  aria-pressed={selected}
                  className={cn(
                    "min-h-32 rounded-lg border bg-card p-5 text-left outline-none transition-[border-color,background-color,transform]",
                    "hover:-translate-y-0.5 hover:border-ai/55 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    selected
                      ? "border-ai bg-ai/10 shadow-[var(--shadow-action)]"
                      : "border-border",
                  )}
                  key={option.id}
                  onClick={() =>
                    setPassport((current) => ({
                      ...current,
                      mood: option.id as MoodId,
                    }))
                  }
                  type="button"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-display font-semibold">
                      {option.label}
                    </span>
                    {selected ? (
                      <Check aria-hidden="true" className="size-5 text-ai" />
                    ) : null}
                  </span>
                  <span className="mt-3 block text-sm leading-6 text-secondary-foreground">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section aria-labelledby="difficulty-heading">
          <Badge variant="warning">Choose world stability</Badge>
          <h1
            className="mt-5 font-display text-3xl font-semibold tracking-[-0.03em] sm:text-5xl"
            id="difficulty-heading"
            tabIndex={-1}
          >
            How hard should reality push back?
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-secondary-foreground">
            Choose the player-facing stability level. The strict internal value
            stays behind the adventure interface.
          </p>

          <div
            aria-label="Adventure difficulty"
            className="mt-10 grid gap-4 md:grid-cols-3"
            role="group"
          >
            {difficultyOptions.map((option) => {
              const selected = passport.difficulty === option.internal;
              return (
                <button
                  aria-pressed={selected}
                  className={cn(
                    "min-h-48 rounded-lg border bg-card p-6 text-left outline-none transition-[border-color,background-color,transform]",
                    "hover:-translate-y-0.5 hover:border-warning/55 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    selected
                      ? "border-warning bg-warning/8 shadow-[var(--shadow-action)]"
                      : "border-border",
                  )}
                  key={option.internal}
                  onClick={() =>
                    setPassport((current) => ({
                      ...current,
                      difficulty: option.internal as Difficulty,
                    }))
                  }
                  type="button"
                >
                  <span className="font-system text-xs text-muted-foreground">
                    WORLD STABILITY
                  </span>
                  <span className="mt-8 flex items-center justify-between gap-3">
                    <span className="font-display text-xl font-semibold">
                      {option.label}
                    </span>
                    {selected ? (
                      <Check
                        aria-hidden="true"
                        className="size-5 text-warning"
                      />
                    ) : null}
                  </span>
                  <span className="mt-3 block text-sm leading-6 text-secondary-foreground">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section aria-labelledby="passport-heading">
          <Badge variant="success">Passport ready</Badge>
          <h1
            className="mt-5 font-display text-3xl font-semibold tracking-[-0.03em] sm:text-5xl"
            id="passport-heading"
            tabIndex={-1}
          >
            One hero. One unstable world.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-secondary-foreground">
            Review the final passport. You can move backward without losing any
            selection.
          </p>

          <div className="mt-10 grid overflow-hidden rounded-lg border border-exploration/45 bg-card shadow-[var(--shadow-elevated)] lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-80 overflow-hidden bg-pressed p-7 sm:p-10">
              <div
                aria-hidden="true"
                className="absolute -right-20 top-24 h-px w-96 -rotate-12 bg-exploration opacity-50 shadow-[12px_9px_0_rgb(244_63_94_/_45%)]"
              />
              <Sparkles
                aria-hidden="true"
                className="size-8 text-exploration"
              />
              <p className="mt-16 font-system text-xs text-muted-foreground">
                RULESHIFT TRAVEL DOCUMENT
              </p>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.03em]">
                {passport.name}
              </h2>
              <p className="mt-2 text-lg text-exploration">{passport.title}</p>
              <p className="mt-7 max-w-md text-sm leading-6 text-secondary-foreground">
                Authorized to enter the Haunted Campus of Infinite Assessments
                in pursuit of the Golden Offer Letter.
              </p>
            </div>
            <dl className="grid content-center gap-0 p-6 sm:p-8">
              <PassportRow label="Archetype" value={passport.archetype} />
              <PassportRow label="Mood" value={mood?.label ?? passport.mood} />
              <PassportRow
                label="World stability"
                value={difficultyLabels[passport.difficulty]}
              />
              <PassportRow label="Demo length" value="4 connected turns" />
            </dl>
          </div>
        </section>
      ) : null}

      {error ? (
        <p
          className="mt-6 rounded-md border border-danger/45 bg-danger/8 px-4 py-3 text-sm text-danger"
          id="character-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Button
          disabled={step === 0}
          onClick={previousStep}
          variant="ghost"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back
        </Button>
        {step < steps.length - 1 ? (
          <Button onClick={nextStep}>
            Continue
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        ) : (
          <Button loading={isStarting} onClick={() => void startAdventure()}>
            Enter the haunted campus
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface CharacterChoiceProps {
  character: CharacterOption;
  compact?: boolean;
  isSelected: boolean;
  onSelect: (character: CharacterOption) => void;
}

function CharacterChoice({
  character,
  compact = false,
  isSelected,
  onSelect,
}: CharacterChoiceProps) {
  return (
    <button
      aria-label={`${character.name}, ${character.title}`}
      aria-pressed={isSelected}
      className={cn(
        "rounded-lg border bg-card text-left outline-none transition-[border-color,background-color,transform]",
        "hover:-translate-y-0.5 hover:border-exploration/55 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        compact ? "min-h-40 p-4" : "min-h-56 p-6",
        isSelected
          ? "border-exploration bg-exploration/8 shadow-[var(--shadow-action)]"
          : "border-border",
      )}
      onClick={() => onSelect(character)}
      type="button"
    >
      <span className="flex items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-pressed font-display text-sm text-exploration"
        >
          {character.name.slice(0, 1)}
        </span>
        {isSelected ? (
          <Check aria-hidden="true" className="size-5 text-exploration" />
        ) : null}
      </span>
      <span className="mt-6 block font-display text-lg font-semibold">
        {character.name}
      </span>
      <span className="mt-1 block text-sm font-semibold text-exploration">
        {character.title}
      </span>
      <span className="mt-3 block text-sm leading-6 text-secondary-foreground">
        {character.description}
      </span>
    </button>
  );
}

function PassportRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-4 border-b border-border py-4 last:border-b-0">
      <dt className="font-system text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}
