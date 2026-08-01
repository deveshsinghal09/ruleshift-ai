"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AudioCue =
  | "action"
  | "damage"
  | "item"
  | "ruleshift"
  | "victory"
  | "defeat";

interface AudioContextValue {
  readonly muted: boolean;
  readonly playCue: (cue: AudioCue) => void;
  readonly setMuted: (muted: boolean) => void;
  readonly setVolume: (volume: number) => void;
  readonly volume: number;
}

const defaultAudioContext: AudioContextValue = {
  muted: false,
  playCue: () => undefined,
  setMuted: () => undefined,
  setVolume: () => undefined,
  volume: 0.45,
};

const AudioPreferenceContext = createContext<AudioContextValue>(
  defaultAudioContext,
);

const MUTED_KEY = "ruleshift.audio.muted";
const VOLUME_KEY = "ruleshift.audio.volume";

const cueNotes: Record<
  AudioCue,
  readonly { readonly duration: number; readonly frequency: number }[]
> = {
  action: [{ duration: 0.07, frequency: 330 }],
  damage: [
    { duration: 0.09, frequency: 180 },
    { duration: 0.12, frequency: 120 },
  ],
  item: [
    { duration: 0.08, frequency: 523 },
    { duration: 0.12, frequency: 659 },
  ],
  ruleshift: [
    { duration: 0.08, frequency: 240 },
    { duration: 0.08, frequency: 480 },
    { duration: 0.14, frequency: 320 },
  ],
  victory: [
    { duration: 0.1, frequency: 523 },
    { duration: 0.1, frequency: 659 },
    { duration: 0.2, frequency: 784 },
  ],
  defeat: [
    { duration: 0.12, frequency: 294 },
    { duration: 0.14, frequency: 220 },
    { duration: 0.22, frequency: 147 },
  ],
};

function clampVolume(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [muted, setMutedState] = useState(false);
  const [volume, setVolumeState] = useState(0.45);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let isActive = true;
    queueMicrotask(() => {
      if (!isActive) {
        return;
      }
      const storedMuted = window.localStorage.getItem(MUTED_KEY);
      const storedVolumeValue = window.localStorage.getItem(VOLUME_KEY);
      setMutedState(storedMuted === "true");
      if (storedVolumeValue !== null) {
        const storedVolume = Number(storedVolumeValue);
        if (Number.isFinite(storedVolume)) {
          setVolumeState(clampVolume(storedVolume));
        }
      }
    });
    return () => {
      isActive = false;
      void audioContextRef.current?.close();
    };
  }, []);

  const setMuted = useCallback((nextMuted: boolean) => {
    setMutedState(nextMuted);
    window.localStorage.setItem(MUTED_KEY, String(nextMuted));
  }, []);

  const setVolume = useCallback((nextVolume: number) => {
    const normalized = clampVolume(nextVolume);
    setVolumeState(normalized);
    window.localStorage.setItem(VOLUME_KEY, String(normalized));
  }, []);

  const playCue = useCallback(
    (cue: AudioCue) => {
      if (muted || volume === 0 || typeof window === "undefined") {
        return;
      }
      const AudioContextConstructor =
        window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextConstructor) {
        return;
      }
      const context =
        audioContextRef.current ?? new AudioContextConstructor();
      audioContextRef.current = context;
      if (context.state === "suspended") {
        void context.resume();
      }

      let start = context.currentTime;
      for (const note of cueNotes[cue]) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type =
          cue === "damage" || cue === "defeat" ? "sawtooth" : "sine";
        oscillator.frequency.setValueAtTime(note.frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(
          Math.max(0.0001, volume * 0.12),
          start + 0.012,
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          start + note.duration,
        );
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + note.duration + 0.02);
        start += note.duration * 0.82;
      }
    },
    [muted, volume],
  );

  const value = useMemo<AudioContextValue>(
    () => ({ muted, playCue, setMuted, setVolume, volume }),
    [muted, playCue, setMuted, setVolume, volume],
  );

  return (
    <AudioPreferenceContext.Provider value={value}>
      {children}
    </AudioPreferenceContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioPreferenceContext);
}
