import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SitePreferences } from "@/lib/preferences";
import { SettingsForm } from "./SettingsForm";

const preferencesMock = vi.hoisted(() => ({
  value: null as unknown as SitePreferences,
  savePreferences: vi.fn(),
  playSound: vi.fn(),
  previewSound: vi.fn(),
}));

vi.mock("@/components/preferences/PreferencesProvider", () => ({
  usePreferences: () => ({
    preferences: preferencesMock.value,
    savePreferences: preferencesMock.savePreferences,
    playSound: preferencesMock.playSound,
    previewSound: preferencesMock.previewSound,
  }),
}));

const initialPreferences: SitePreferences = {
  quality: "怀旧",
  boardSize: 19,
  rules: "中国规则",
  allowChallenges: true,
  audio: { bgm: true, moveSound: true, interfaceSound: true, volume: 28 },
};

describe("settings form", () => {
  beforeEach(() => {
    preferencesMock.value = structuredClone(initialPreferences);
    preferencesMock.savePreferences.mockReset();
    preferencesMock.playSound.mockReset();
    preferencesMock.previewSound.mockReset();
    window.requestAnimationFrame = (callback) => {
      callback(0);
      return 1;
    };
    window.cancelAnimationFrame = vi.fn();
  });
  afterEach(cleanup);

  it("preserves an unsaved draft when another global preference changes", () => {
    const view = render(<SettingsForm />);
    fireEvent.change(screen.getByLabelText("建房默认棋盘："), { target: { value: "9" } });

    preferencesMock.value = {
      ...preferencesMock.value,
      audio: { ...preferencesMock.value.audio, bgm: false },
    };
    view.rerender(<SettingsForm />);

    expect(screen.getByLabelText("建房默认棋盘：")).toHaveValue("9");
    expect(screen.getByLabelText(/MIDI 背景乐/)).not.toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "保存设置" }));
    expect(preferencesMock.savePreferences).toHaveBeenCalledWith(
      expect.objectContaining({
        boardSize: 9,
        audio: expect.objectContaining({ bgm: false }),
      }),
    );
  });
});
