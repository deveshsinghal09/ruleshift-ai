import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { focusRing } from "@/lib/focus";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  cn(
    "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md border px-5 text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150",
    "active:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45",
    focusRing,
  ),
  {
    variants: {
      variant: {
        primary:
          "border-primary/70 bg-primary text-white shadow-[var(--shadow-action)] hover:bg-[#7c4ee5] active:bg-[#7042d2]",
        exploration:
          "border-exploration/60 bg-exploration text-inverse-foreground shadow-[var(--shadow-action)] hover:bg-[#20bfd7] active:bg-[#1ca9be]",
        ruleshift:
          "border-ruleshift/70 bg-ruleshift text-white shadow-[var(--shadow-ruleshift)] hover:bg-[#e63553] active:bg-[#ca2d48]",
        danger:
          "border-danger/70 bg-danger text-inverse-foreground shadow-[var(--shadow-action)] hover:bg-[#e76478] active:bg-[#cd566a]",
        secondary:
          "border-strong-border bg-elevated text-foreground shadow-[var(--shadow-action)] hover:border-white/25 hover:bg-[#293144] active:bg-pressed",
        ghost:
          "border-transparent bg-transparent text-secondary-foreground shadow-none hover:bg-white/7 hover:text-foreground active:bg-white/10",
      },
      size: {
        sm: "min-h-11 px-4 text-xs",
        default: "min-h-11 px-5",
        lg: "min-h-12 px-6 text-base",
        icon: "size-11 min-h-11 px-0",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "primary",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({
  asChild = false,
  children,
  className,
  disabled,
  loading = false,
  size,
  type,
  variant,
  ...props
}: ButtonProps) {
  if (asChild) {
    return (
      <Slot
        aria-busy={loading || undefined}
        className={cn(buttonVariants({ size, variant }), className)}
        {...props}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ size, variant }), className)}
      disabled={disabled || loading}
      type={type ?? "button"}
      {...props}
    >
      {loading ? (
        <LoaderCircle
          aria-hidden="true"
          className="size-4 animate-spin motion-reduce:animate-none"
        />
      ) : null}
      {children}
    </button>
  );
}

export { buttonVariants };
