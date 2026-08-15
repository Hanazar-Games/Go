import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initialRooms, players } from "@/data/mock";
import { HallClient } from "./HallClient";

const routerMock = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => routerMock }));
vi.mock("@/components/preferences/PreferencesProvider", () => ({
  usePreferences: () => ({
    preferences: {
      quality: "怀旧",
      boardSize: 19,
      rules: "日本规则",
      allowChallenges: true,
      audio: { bgm: true, moveSound: true, interfaceSound: true, volume: 28 },
    },
    playSound: vi.fn(),
  }),
}));

describe("hall room dialog", () => {
  beforeEach(() => routerMock.push.mockReset());
  afterEach(cleanup);

  it("uses the customary komi for the selected rule set", () => {
    render(<HallClient initialPlayers={players} initialRooms={initialRooms} />);
    fireEvent.click(screen.getByRole("button", { name: "创建新房间" }));

    const rules = screen.getByLabelText("规则：");
    const komi = screen.getByLabelText("贴目：");
    expect(rules).toHaveValue("日本规则");
    expect(komi).toHaveValue("6.5");

    fireEvent.change(rules, { target: { value: "中国规则" } });
    expect(komi).toHaveValue("7.5");
    fireEvent.change(rules, { target: { value: "日本规则" } });
    expect(komi).toHaveValue("6.5");
  });

  it("restores focus to the create button after closing", () => {
    render(<HallClient initialPlayers={players} initialRooms={initialRooms} />);
    const trigger = screen.getByRole("button", { name: "创建新房间" });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "关闭创建房间" }));

    expect(trigger).toHaveFocus();
  });
});
