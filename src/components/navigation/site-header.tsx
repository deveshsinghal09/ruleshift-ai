import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RuleShiftMark } from "@/components/brand/ruleshift-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  className?: string;
  showStart?: boolean;
}

export function SiteHeader({
  className,
  showStart = true,
}: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "relative z-30 mx-auto flex w-full max-w-[90rem] items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-10",
        className,
      )}
    >
      <Link
        aria-label="RuleShift AI home"
        className="inline-flex min-h-11 items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        href="/"
      >
        <RuleShiftMark />
      </Link>

      <nav aria-label="Primary navigation" className="flex items-center gap-2">
        <Link
          className="hidden min-h-11 items-center px-3 text-sm font-semibold text-secondary-foreground transition-colors hover:text-foreground sm:inline-flex"
          href="/#how-it-works"
        >
          How it works
        </Link>
        {showStart ? (
          <Button asChild size="sm">
            <Link href="/create">
              Start adventure
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        ) : null}
      </nav>
    </header>
  );
}
