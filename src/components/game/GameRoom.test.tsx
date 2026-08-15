import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameRoom } from "./GameRoom";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock("@/components/preferences/PreferencesProvider", () => ({
  usePreferences: () => ({ playSound: vi.fn() }),
}));
vi.mock("./GoBoard", () => ({
  GoBoard: () => <button type="button">测试棋盘</button>,
}));

describe("game room dialogs", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(cleanup);

  it("closes the result before opening private chat", () => {
    render(<GameRoom id="2371" />);
    expect(screen.getByRole("dialog", { name: "比赛结果" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "和对手聊聊" }));

    expect(screen.queryByRole("dialog", { name: "比赛结果" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "与褚赢对话" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "关闭私聊" }));
    fireEvent.click(screen.getByRole("button", { name: "查看比赛结果" }));
    expect(screen.getByRole("dialog", { name: "比赛结果" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /对话/ })).not.toBeInTheDocument();
  });

  it("closes private chat when resignation ends a game", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<GameRoom id="2400" fresh userColor="black" />);
    fireEvent.click(screen.getByRole("button", { name: "和对手聊聊" }));
    fireEvent.click(screen.getByRole("button", { name: "认输" }));

    expect(screen.queryByRole("dialog", { name: /对话/ })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "比赛结果" })).toBeInTheDocument();
  });
});
