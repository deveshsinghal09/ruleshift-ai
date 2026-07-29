"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { previewRules } from "@/features/adventure/mock-data";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { getMotionTransition } from "@/lib/motion";

export function RulePreview() {
  const reduceMotion = useReducedMotionPreference();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    const firstShift = window.setTimeout(() => setIndex(1), 1800);
    const secondShift = window.setTimeout(() => setIndex(2), 3900);

    return () => {
      window.clearTimeout(firstShift);
      window.clearTimeout(secondShift);
    };
  }, [reduceMotion]);

  const rule = previewRules[index];

  function shiftRule(): void {
    setIndex((current) => (current + 1) % previewRules.length);
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-ruleshift/45 bg-card shadow-[var(--shadow-elevated)]">
      <div className="flex items-center justify-between gap-4 border-b border-border bg-pressed px-4 py-3">
        <Badge variant="ruleshift">
          <Zap aria-hidden="true" className="size-3" />
          Live rule cartridge
        </Badge>
        <span className="font-system text-[0.6875rem] text-muted-foreground">
          SHIFT / 03
        </span>
      </div>

      <div className="relative min-h-[22rem] p-5 sm:p-7">
        <div
          aria-hidden="true"
          className="absolute -right-16 top-16 h-px w-72 -rotate-12 bg-ruleshift opacity-70 shadow-[12px_8px_0_rgb(34_211_238_/_55%)]"
        />
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="relative space-y-7"
            exit={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : -8 }}
            initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 8 }}
            key={rule.name}
            transition={getMotionTransition("deliberate", reduceMotion)}
          >
            <div className="space-y-2">
              <p className="font-system text-xs text-ruleshift">
                REALITY PATCH ACCEPTED
              </p>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                {rule.name}
              </h2>
            </div>

            <div className="space-y-3">
              <div className="rounded-md border border-border bg-pressed p-4">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">
                  Before
                </p>
                <p className="text-sm text-secondary-foreground line-through decoration-danger/80">
                  {rule.before}
                </p>
              </div>
              <div className="rounded-md border border-ruleshift/50 bg-ruleshift/8 p-4">
                <p className="mb-1 text-xs font-semibold text-ruleshift">
                  After
                </p>
                <p className="font-semibold text-foreground">{rule.after}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border px-5 py-4">
        <p className="text-xs leading-5 text-muted-foreground">
          Deterministic effect. Temporary chaos.
        </p>
        <Button onClick={shiftRule} size="sm" variant="ghost">
          <RefreshCw aria-hidden="true" className="size-4" />
          Shift again
        </Button>
      </div>
    </div>
  );
}
