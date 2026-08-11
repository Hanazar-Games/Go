"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  DEFAULT_PREFERENCES,
  parsePreferences,
  PREFERENCES_STORAGE_KEY,
  type SitePreferences,
  type SoundEffect,
} from "@/lib/preferences";

class AudioEngine {
  private context: AudioContext | null = null;
  private bgmTimer: number | null = null;
  private note = 0;
  private volume = DEFAULT_PREFERENCES.audio.volume / 100;

  activate() {
    const AudioContextConstructor = window.AudioContext;
    if (typeof AudioContextConstructor !== "function") return;
    if (!this.context) this.context = new AudioContextConstructor();
    if (this.context.state === "suspended") void this.context.resume().catch(() => undefined);
  }

  setVolume(volume: number) {
    this.volume = volume / 100;
  }

  private tone(
    frequency: number,
    duration: number,
    level: number,
    wave: OscillatorType = "square",
    volume = this.volume,
  ) {
    if (!this.context || this.context.state === "closed" || volume <= 0) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(Math.max(0.0001, level * volume), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  private clack(volume = this.volume) {
    if (!this.context || this.context.state === "closed") return;
    const duration = 0.045;
    const samples = Math.floor(this.context.sampleRate * duration);
    const buffer = this.context.createBuffer(1, samples, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < samples; index += 1) {
      data[index] = (Math.random() * 2 - 1) * Math.exp((-7 * index) / samples);
    }
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.value = 1150;
    filter.Q.value = 0.8;
    gain.gain.value = 0.42 * volume;
    source.connect(filter).connect(gain).connect(this.context.destination);
    source.start();
  }

  play(effect: SoundEffect, volume = this.volume) {
    if (!this.context || this.context.state === "closed") return;
    if (effect === "stone") {
      this.clack(volume);
      return;
    }
    if (effect === "button") this.tone(720, 0.035, 0.055, "square", volume);
    if (effect === "message") {
      this.tone(540, 0.09, 0.09, "sine", volume);
      window.setTimeout(() => this.tone(680, 0.11, 0.08, "sine", volume), 70);
    }
    if (effect === "success") {
      [440, 554, 659].forEach((frequency, index) =>
        window.setTimeout(() => this.tone(frequency, 0.18, 0.1, "triangle", volume), index * 105),
      );
    }
    if (effect === "error") this.tone(145, 0.18, 0.12, "sawtooth", volume);
  }

  startBgm() {
    if (this.bgmTimer !== null) return;
    this.activate();
    const melody: Array<number | null> = [262, 330, null, 392, 330, null, 294, 349, null, 440, 349, null];
    const playNote = () => {
      const frequency = melody[this.note % melody.length];
      if (frequency) this.tone(frequency, 0.28, 0.014, "triangle");
      this.note += 1;
    };
    playNote();
    this.bgmTimer = window.setInterval(playNote, 1380);
  }

  stopBgm() {
    if (this.bgmTimer === null) return;
    window.clearInterval(this.bgmTimer);
    this.bgmTimer = null;
  }

  dispose() {
    this.stopBgm();
    if (this.context && this.context.state !== "closed") void this.context.close();
    this.context = null;
  }
}

interface PreferencesContextValue {
  preferences: SitePreferences;
  savePreferences: (next: SitePreferences) => void;
  playSound: (effect: SoundEffect) => void;
  previewSound: (effect: SoundEffect, volume: number) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const preferencesRef = useRef(preferences);
  const audioRef = useRef<AudioEngine | null>(null);
  const activatedRef = useRef(false);

  useEffect(() => {
    const audio = new AudioEngine();
    audioRef.current = audio;
    const frame = window.requestAnimationFrame(() => {
      let value: string | null = null;
      try {
        value = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
      } catch {
        value = null;
      }
      const stored = parsePreferences(value);
      preferencesRef.current = stored;
      setPreferences(stored);
      audio.setVolume(stored.audio.volume);
    });
    const activate = () => {
      activatedRef.current = true;
      audio.activate();
      if (preferencesRef.current.audio.bgm) audio.startBgm();
    };
    const click = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest("a, button, [role='button']")) return;
      if (preferencesRef.current.audio.interfaceSound) audio.play("button");
    };
    const key = () => {
      activate();
    };
    const visibility = () => {
      if (document.hidden) audio.stopBgm();
      else if (activatedRef.current && preferencesRef.current.audio.bgm) audio.startBgm();
    };
    document.addEventListener("pointerdown", activate, { once: true });
    document.addEventListener("click", click);
    document.addEventListener("keydown", key, { once: true });
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", activate);
      document.removeEventListener("click", click);
      document.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", visibility);
      audio.dispose();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.setVolume(preferences.audio.volume);
    if (!activatedRef.current) return;
    if (preferences.audio.bgm) audio.startBgm();
    else audio.stopBgm();
  }, [preferences.audio.bgm, preferences.audio.volume]);

  const savePreferences = useCallback((next: SitePreferences) => {
    preferencesRef.current = next;
    setPreferences(next);
    try {
      window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Preferences still apply for the current tab when storage is unavailable.
    }
  }, []);

  const playSound = useCallback((effect: SoundEffect) => {
    const { audio } = preferencesRef.current;
    if (effect === "stone" && !audio.moveSound) return;
    if (effect !== "stone" && !audio.interfaceSound) return;
    audioRef.current?.play(effect);
  }, []);

  const previewSound = useCallback((effect: SoundEffect, volume: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.activate();
    audio.play(effect, Math.min(100, Math.max(0, volume)) / 100);
  }, []);

  return (
    <PreferencesContext value={{ preferences, savePreferences, playSound, previewSound }}>
      {children}
    </PreferencesContext>
  );
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used inside PreferencesProvider");
  return value;
}
