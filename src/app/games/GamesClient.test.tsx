import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_PLAYER_QUERY_LENGTH } from "@/lib/filters";
import { GamesClient } from "./GamesClient";

const routerMock = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

describe("game archive filters", () => {
  beforeEach(() => routerMock.replace.mockReset());
  afterEach(cleanup);

  it("matches player names without surrounding spaces or latin case sensitivity", () => {
    render(<GamesClient />);
    const input = screen.getByRole("textbox", { name: "棋手：" });
    fireEvent.change(input, { target: { value: "  AKIRA  " } });

    expect(screen.queryByText("没有找到符合条件的公开棋谱。")).not.toBeInTheDocument();
    expect(screen.getAllByText(/Akira/)).not.toHaveLength(0);

    fireEvent.submit(input.closest("form")!);
    expect(routerMock.replace).toHaveBeenCalledWith("/games?player=AKIRA");
    expect(input).toHaveValue("AKIRA");
  });

  it("bounds player queries before putting them into the page and URL", () => {
    render(<GamesClient />);
    const input = screen.getByRole("textbox", { name: "棋手：" });
    fireEvent.change(input, { target: { value: `  ${"棋".repeat(80)}  ` } });
    fireEvent.submit(input.closest("form")!);

    expect(input).toHaveAttribute("maxLength", String(MAX_PLAYER_QUERY_LENGTH));
    expect(input).toHaveValue("棋".repeat(MAX_PLAYER_QUERY_LENGTH));
    expect(routerMock.replace).toHaveBeenCalledWith(
      `/games?player=${encodeURIComponent("棋".repeat(MAX_PLAYER_QUERY_LENGTH))}`,
    );
  });
});
