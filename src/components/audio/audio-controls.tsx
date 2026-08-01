"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useId, useState } from "react";
import { useAudio } from "@/components/audio/audio-provider";
import { cn } from "@/lib/utils";

export function AudioControls({ className }: { className?: string }) {
  const { muted, setMuted, setVolume, volume } = useAudio();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const volumeId = useId();

  return (
    <div className={cn("relative", className)}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label="Audio settings"
        className="inline-flex size-11 items-center justify-center rounded-md text-secondary-foreground outline-none transition-colors hover:bg-white/7 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {muted || volume === 0 ? (
          <VolumeX aria-hidden="true" className="size-5" />
        ) : (
          <Volume2 aria-hidden="true" className="size-5" />
        )}
      </button>
      <div
        className={cn(
          "absolute right-0 top-12 z-50 w-72 rounded-lg border border-strong-border bg-elevated p-4 shadow-[var(--shadow-elevated)]",
          !open && "hidden",
        )}
        id={panelId}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Adventure audio</p>
            <p className="mt-1 text-xs leading-5 text-secondary-foreground">
              Optional synthesized cues. Story information is always visual.
            </p>
          </div>
          <button
            aria-pressed={muted}
            className="min-h-11 shrink-0 rounded-md border border-border px-3 text-xs font-semibold outline-none hover:border-exploration/60 focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setMuted(!muted)}
            type="button"
          >
            {muted ? "Unmute" : "Mute"}
          </button>
        </div>
        <label className="mt-4 block text-xs font-semibold" htmlFor={volumeId}>
          Volume {Math.round(volume * 100)}%
        </label>
        <input
          aria-valuetext={`${Math.round(volume * 100)} percent`}
          className="mt-2 min-h-11 w-full accent-exploration"
          id={volumeId}
          max="1"
          min="0"
          onChange={(event) => setVolume(Number(event.target.value))}
          step="0.05"
          type="range"
          value={volume}
        />
      </div>
    </div>
  );
}
