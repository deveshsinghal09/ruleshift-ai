import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface RuleShiftMarkProps {
  className?: string;
  compact?: boolean;
}

export function RuleShiftMark({
  className,
  compact = false,
}: RuleShiftMarkProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-2.5 text-foreground", className)}
    >
      <span
        aria-hidden="true"
        className="relative grid size-9 place-items-center rounded-md border border-ruleshift/55 bg-card shadow-[3px_3px_0_rgb(34_211_238_/_35%)]"
      >
        <Sparkles className="size-4 text-ruleshift" />
      </span>
      <span
        className={cn(
          "font-display font-semibold tracking-[-0.025em]",
          compact ? "text-sm" : "text-base",
        )}
      >
        RuleShift <span className="text-ai">AI</span>
      </span>
    </span>
  );
}
