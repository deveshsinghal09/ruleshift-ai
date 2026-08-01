import {
  Bot,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  ResolutionTone,
  TurnResolutionReceipt as TurnResolutionReceiptModel,
} from "@/features/game/turn-resolution";
import { cn } from "@/lib/utils";

const toneClasses: Readonly<Record<ResolutionTone, string>> = {
  danger: "text-danger",
  exploration: "text-exploration",
  neutral: "text-secondary-foreground",
  ruleshift: "text-ruleshift",
  success: "text-success",
  warning: "text-warning",
};

export function TurnResolutionReceipt({
  receipt,
}: {
  receipt: TurnResolutionReceiptModel;
}) {
  const usedProvider = receipt.creativeSource === "ai-provider";

  return (
    <section
      aria-labelledby="turn-resolution-title"
      className="overflow-hidden rounded-lg border border-exploration/35 bg-card"
      data-testid="turn-resolution-receipt"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-pressed px-5 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 aria-hidden="true" className="size-4 text-success" />
          <h2
            className="font-system text-xs font-semibold"
            id="turn-resolution-title"
          >
            HOW THIS TURN WAS RESOLVED
          </h2>
        </div>
        <span className="font-system text-[0.625rem] text-muted-foreground">
          TURN {receipt.turn} RECEIPT
        </span>
      </div>

      <div className="grid lg:grid-cols-[0.9fr_1.1fr_1fr]">
        <div className="border-b border-border p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2">
            {usedProvider ? (
              <Bot aria-hidden="true" className="size-4 text-ai" />
            ) : (
              <Cpu aria-hidden="true" className="size-4 text-exploration" />
            )}
            <p className="text-sm font-semibold">Creative proposal</p>
          </div>
          <Badge className="mt-3" variant={usedProvider ? "ai" : "exploration"}>
            {usedProvider ? "Validated AI provider" : "Deterministic fallback"}
          </Badge>
          <p className="mt-3 text-sm leading-6 text-secondary-foreground">
            {usedProvider
              ? "The provider proposed narration and choices through structured output."
              : "The local provider supplied a playable scene without an external AI call."}
          </p>
        </div>

        <div className="border-b border-border p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2">
            <Sparkles aria-hidden="true" className="size-4 text-exploration" />
            <p className="text-sm font-semibold">Engine decision</p>
          </div>
          <p className="mt-2 text-sm text-secondary-foreground">
            Action: <span className="font-semibold text-foreground">{receipt.actionLabel}</span>
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3">
            {receipt.changes.map((change) => (
              <div key={`${change.label}-${change.value}`}>
                <dt className="text-xs text-muted-foreground">{change.label}</dt>
                <dd
                  className={cn(
                    "mt-1 break-words font-system text-xs font-semibold",
                    toneClasses[change.tone],
                  )}
                >
                  {change.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="size-4 text-success" />
            <p className="text-sm font-semibold">Safety boundary</p>
          </div>
          <p className="mt-3 text-sm leading-6 text-secondary-foreground">
            Health, energy, score, inventory, objectives, and outcomes were
            calculated and validated by the deterministic engine.
          </p>
          {receipt.rules.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {receipt.rules.map((rule) => (
                <li className="flex items-start gap-2 text-sm" key={`${rule.name}-${rule.status}`}>
                  <Zap
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-ruleshift"
                  />
                  <span>
                    <strong>{rule.name}</strong>: {rule.status}.{" "}
                    <span className="text-secondary-foreground">
                      {rule.explanation}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">
              No RuleShift modified this turn.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
