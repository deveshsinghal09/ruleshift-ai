import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "relative overflow-hidden rounded-lg border bg-card text-foreground",
  {
    variants: {
      variant: {
        default: "border-border",
        elevated: "border-strong-border shadow-[var(--shadow-elevated)]",
        ai: "border-ai/35 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-ai",
        exploration:
          "border-exploration/35 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-exploration",
        ruleshift:
          "border-ruleshift/55 shadow-[var(--shadow-ruleshift)] before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-ruleshift",
        success: "border-success/40",
        warning: "border-warning/45",
        danger: "border-danger/50",
        selected:
          "border-exploration ring-1 ring-exploration/55 ring-offset-2 ring-offset-background",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant }), className)} {...props} />;
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2 p-6", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-display text-base font-semibold tracking-[-0.02em]",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm leading-6 text-secondary-foreground", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-t border-border px-6 py-4",
        className,
      )}
      {...props}
    />
  );
}

export { cardVariants };
