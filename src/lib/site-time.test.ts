import { describe, expect, it } from "vitest";
import { formatSiteTime } from "./site-time";

describe("site time", () => {
  it("always displays China Standard Time", () => {
    expect(formatSiteTime(new Date("2026-08-12T00:01:02Z"))).toBe("08:01:02");
  });
});
