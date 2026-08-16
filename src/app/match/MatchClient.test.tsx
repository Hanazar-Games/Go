import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MAX_PLAYER_QUERY_LENGTH } from "@/lib/filters";
import { MatchClient } from "./MatchClient";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams({ opponent: `  ${"棋".repeat(80)}  ` }),
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock("@/components/preferences/PreferencesProvider", () => ({
  usePreferences: () => ({ playSound: vi.fn() }),
}));

describe("match query", () => {
  afterEach(cleanup);

  it("bounds an externally supplied opponent name", () => {
    render(<MatchClient />);

    expect(screen.getByText(`挑战演示：${"棋".repeat(MAX_PLAYER_QUERY_LENGTH)}`)).toBeInTheDocument();
    expect(screen.queryByText(`挑战演示：${"棋".repeat(80)}`)).not.toBeInTheDocument();
  });
});
