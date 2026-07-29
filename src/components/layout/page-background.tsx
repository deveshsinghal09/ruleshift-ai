import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageBackgroundTone = "default" | "ai" | "exploration" | "ruleshift";

interface PageBackgroundProps {
  children: ReactNode;
  className?: string;
  tone?: PageBackgroundTone;
}

const toneClassNames: Record<PageBackgroundTone, string> = {
  default: "selection:bg-primary/40",
  ai: "selection:bg-ai/40",
  exploration: "selection:bg-exploration/40",
  ruleshift: "selection:bg-ruleshift/40",
};

export function PageBackground({
  children,
  className,
  tone = "default",
}: PageBackgroundProps) {
  return (
    <div
      className={cn(
        "relative isolate min-h-screen overflow-x-clip bg-background text-foreground",
        toneClassNames[tone],
        className,
      )}
      data-tone={tone}
    >
      <div
        aria-hidden="true"
        className="page-background__field pointer-events-none absolute inset-0 -z-20"
      />
      <div
        aria-hidden="true"
        className="page-background__rift pointer-events-none absolute -right-24 top-36 -z-10"
      />
      {children}
    </div>
  );
}
