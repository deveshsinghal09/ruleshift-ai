"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

const progressIndicatorVariants = cva(
  "h-full rounded-full transition-transform duration-300 ease-out motion-reduce:transition-none",
  {
    variants: {
      variant: {
        ai: "bg-ai",
        exploration: "bg-exploration",
        ruleshift: "bg-ruleshift",
        success: "bg-success",
        warning: "bg-warning",
        danger: "bg-danger",
      },
    },
    defaultVariants: {
      variant: "ai",
    },
  },
);

export interface ProgressProps
  extends Omit<ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, "value">,
    VariantProps<typeof progressIndicatorVariants> {
  label: string;
  value?: number;
  valueLabel?: string;
}

export function Progress({
  className,
  label,
  value = 0,
  valueLabel,
  variant,
  ...props
}: ProgressProps) {
  const normalizedValue = Math.min(100, Math.max(0, value));

  return (
    <ProgressPrimitive.Root
      aria-label={label}
      aria-valuetext={valueLabel}
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full border border-border bg-pressed",
        className,
      )}
      value={normalizedValue}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={progressIndicatorVariants({ variant })}
        style={{ transform: `translateX(-${100 - normalizedValue}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
