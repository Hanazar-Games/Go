import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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

  it("traps focus in private chat and restores it to the trigger", () => {
    render(<GameRoom id="2400" fresh userColor="black" />);
    const trigger = screen.getByRole("button", { name: "和对手聊聊" });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: /对话/ });
    const send = within(dialog).getByRole("button", { name: "发送" });
    send.focus();

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(screen.getByRole("button", { name: "关闭私聊" })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "关闭私聊" }));
    expect(trigger).toHaveFocus();
  });

  it("keeps focus in the result dialog and returns it to the result trigger", () => {
    render(<GameRoom id="2371" />);
    const dialog = screen.getByRole("dialog", { name: "比赛结果" });
    const close = screen.getByRole("button", { name: "关闭比赛结果" });
    close.focus();

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(close).toHaveFocus();

    fireEvent.click(close);
    expect(screen.getByRole("button", { name: "查看比赛结果" })).toHaveFocus();
  });
});
