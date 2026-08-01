import Image from "next/image";
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
      <Image
        alt=""
        aria-hidden="true"
        className={cn(
          "h-9 w-auto shrink-0 select-none object-contain drop-shadow-[0_3px_4px_rgb(34_211_238_/_24%)]",
          compact && "h-7",
        )}
        height={210}
        src="/ruleshift-logo.png"
        width={331}
      />
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
