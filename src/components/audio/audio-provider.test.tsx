import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioControls } from "@/components/audio/audio-controls";
import {
  AudioProvider,
  useAudio,
} from "@/components/audio/audio-provider";

let audioContextCreations = 0;

class FakeAudioContext {
  readonly currentTime = 0;
  readonly destination = {};
  readonly state = "running";

  constructor() {
    audioContextCreations += 1;
  }

  close(): Promise<void> {
    return Promise.resolve();
  }

  createGain() {
    return {
      connect: () => undefined,
      gain: {
        exponentialRampToValueAtTime: () => undefined,
        setValueAtTime: () => undefined,
      },
    };
  }

  createOscillator() {
    return {
      connect: () => undefined,
      frequency: { setValueAtTime: () => undefined },
      start: () => undefined,
      stop: () => undefined,
      type: "sine",
    };
  }

  resume(): Promise<void> {
    return Promise.resolve();
  }
}

function CueButton() {
  const { playCue } = useAudio();
  return <button onClick={() => playCue("action")}>Play action cue</button>;
}

describe("AudioProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    audioContextCreations = 0;
    vi.stubGlobal("AudioContext", FakeAudioContext);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates audio only after a user-triggered cue", async () => {
    const user = userEvent.setup();
    render(
      <AudioProvider>
        <AudioControls />
        <CueButton />
      </AudioProvider>,
    );

    expect(audioContextCreations).toBe(0);
    await user.click(screen.getByRole("button", { name: "Audio settings" }));
    expect(screen.getByText("Volume 45%")).toBeInTheDocument();
    expect(audioContextCreations).toBe(0);

    await user.click(screen.getByRole("button", { name: "Play action cue" }));
    expect(audioContextCreations).toBe(1);
  });

  it("persists mute and volume preferences", async () => {
    const user = userEvent.setup();
    const view = render(
      <AudioProvider>
        <AudioControls />
      </AudioProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Audio settings" }));
    await user.click(screen.getByRole("button", { name: "Mute" }));
    fireEvent.change(screen.getByRole("slider", { name: /Volume/u }), {
      target: { value: "0.7" },
    });

    expect(window.localStorage.getItem("ruleshift.audio.muted")).toBe("true");
    expect(window.localStorage.getItem("ruleshift.audio.volume")).toBe("0.7");

    view.unmount();
    render(
      <AudioProvider>
        <AudioControls />
      </AudioProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Audio settings" }));
    expect(screen.getByRole("button", { name: "Unmute" })).toBeInTheDocument();
    expect(screen.getByText("Volume 70%")).toBeInTheDocument();
  });
});
