import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";
import { AudioEngine, PreferencesProvider, usePreferences } from "./PreferencesProvider";

let oscillators = 0;

class FakeAudioContext {
  state: AudioContextState = "running";
  currentTime = 0;
  sampleRate = 48000;
  destination = {} as AudioDestinationNode;

  resume() {
    return Promise.resolve();
  }

  close() {
    this.state = "closed";
    return Promise.resolve();
  }

  createOscillator() {
    oscillators += 1;
    const oscillator = {
      type: "square",
      frequency: { setValueAtTime: vi.fn() },
      connect: (target: unknown) => target,
      start: vi.fn(),
      stop: vi.fn(),
    };
    return oscillator as unknown as OscillatorNode;
  }

  createGain() {
    const gain = {
      gain: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: (target: unknown) => target,
    };
    return gain as unknown as GainNode;
  }
}

describe("audio preferences", () => {
  beforeEach(() => {
    oscillators = 0;
    vi.useFakeTimers();
    vi.stubGlobal("AudioContext", FakeAudioContext);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("does not leak a BGM note when playback is stopped immediately", () => {
    const audio = new AudioEngine();
    audio.startBgm();
    audio.stopBgm();
    vi.advanceTimersByTime(2000);

    expect(oscillators).toBe(0);
    audio.dispose();
  });

  it("applies a saved zero volume before playing confirmation feedback", () => {
    let controls: ReturnType<typeof usePreferences> | undefined;
    function Harness() {
      controls = usePreferences();
      return null;
    }

    render(
      <PreferencesProvider>
        <Harness />
      </PreferencesProvider>,
    );
    act(() => controls?.previewSound("message", 0));
    const before = oscillators;
    act(() => {
      controls?.savePreferences({
        ...DEFAULT_PREFERENCES,
        audio: { ...DEFAULT_PREFERENCES.audio, bgm: false, volume: 0 },
      });
      controls?.playSound("success");
      vi.advanceTimersByTime(500);
    });

    expect(oscillators).toBe(before);
  });
});
