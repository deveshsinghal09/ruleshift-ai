import { Crown, MousePointerClick, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const guideSteps = [
  {
    icon: Crown,
    title: "Know the win condition",
    description: "Advance the primary objective before health or time runs out.",
  },
  {
    icon: MousePointerClick,
    title: "Choose one move",
    description: "Each option shows its energy cost. The engine resolves the result.",
  },
  {
    icon: Zap,
    title: "Read the RuleShift",
    description: "When reality changes, compare Before and Now, then adapt your next move.",
  },
] as const;

export function FirstTurnGuide({
  objective,
  onDismiss,
}: {
  objective: string;
  onDismiss: () => void;
}) {
  return (
    <section
      aria-labelledby="first-turn-guide-title"
      className="overflow-hidden rounded-lg border border-ai/40 bg-card shadow-[var(--shadow-elevated)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-ai/7 px-5 py-4">
        <div>
          <div className="flex items-center gap-2 text-[#c4b5fd]">
            <ShieldCheck aria-hidden="true" className="size-4" />
            <p className="font-system text-[0.6875rem] font-semibold">
              FIRST-TURN BRIEFING
            </p>
          </div>
          <h2
            className="mt-2 font-display text-xl font-semibold"
            id="first-turn-guide-title"
          >
            Your mission, in 30 seconds
          </h2>
          <p className="mt-2 text-sm text-secondary-foreground">
            Current objective: <strong className="text-foreground">{objective}</strong>
          </p>
        </div>
        <Button onClick={onDismiss} size="sm" variant="secondary">
          Show me the choices
        </Button>
      </div>
      <ol className="grid gap-px bg-border md:grid-cols-3">
        {guideSteps.map((step, index) => (
          <li className="flex gap-3 bg-card p-5" key={step.title}>
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-pressed font-system text-xs text-exploration">
              {index + 1}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <step.icon aria-hidden="true" className="size-4 text-exploration" />
                <h3 className="text-sm font-semibold">{step.title}</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-secondary-foreground">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
