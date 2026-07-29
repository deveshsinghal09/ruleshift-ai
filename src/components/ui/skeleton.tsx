import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export function Skeleton({ className, label, ...props }: SkeletonProps) {
  return (
    <div
      aria-label={label}
      className={cn(
        "animate-pulse rounded-sm bg-elevated motion-reduce:animate-none",
        className,
      )}
      role={label ? "status" : undefined}
      {...props}
    />
  );
}
