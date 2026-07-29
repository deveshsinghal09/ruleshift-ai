import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex min-h-6 items-center gap-1.5 rounded-sm border px-2 py-0.5 font-system text-[0.6875rem] font-semibold uppercase tracking-[0.08em]",
  {
    variants: {
      variant: {
        neutral: "border-strong-border bg-elevated text-secondary-foreground",
        ai: "border-ai/45 bg-ai/12 text-[#c4b5fd]",
        exploration:
          "border-exploration/45 bg-exploration/10 text-[#67e8f9]",
        ruleshift: "border-ruleshift/50 bg-ruleshift/12 text-[#fda4af]",
        success: "border-success/45 bg-success/10 text-[#6ee7b7]",
        warning: "border-warning/45 bg-warning/10 text-[#fde68a]",
        danger: "border-danger/50 bg-danger/12 text-[#fda4af]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
