import type { TextareaHTMLAttributes } from "react";
import { focusRing } from "@/lib/focus";
import { cn } from "@/lib/utils";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full resize-y rounded-md border border-strong-border bg-pressed px-3 py-2.5 text-sm leading-6 text-foreground placeholder:text-muted-foreground",
        "transition-[border-color,box-shadow] duration-150 hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-45",
        "aria-invalid:border-danger aria-invalid:ring-1 aria-invalid:ring-danger/35",
        focusRing,
        className,
      )}
      {...props}
    />
  );
}
