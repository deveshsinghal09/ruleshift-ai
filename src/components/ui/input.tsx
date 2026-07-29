import type { InputHTMLAttributes } from "react";
import { focusRing } from "@/lib/focus";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex min-h-11 w-full rounded-md border border-strong-border bg-pressed px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
        "transition-[border-color,box-shadow] duration-150 hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-45",
        "aria-invalid:border-danger aria-invalid:ring-1 aria-invalid:ring-danger/35",
        focusRing,
        className,
      )}
      type={type}
      {...props}
    />
  );
}
