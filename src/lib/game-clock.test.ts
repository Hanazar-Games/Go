import { describe, expect, it } from "vitest";
import { formatGameClock, parseTimeControl, resetByoyomi, tickGameClock } from "./game-clock";

describe("game clock", () => {
  it("parses main time and byo-yomi periods", () => {
    expect(parseTimeControl("20分+3×30秒")).toEqual({
      mainSeconds: 1200,
      byoyomiSeconds: 30,
      periodSeconds: 30,
      periods: 3,
      expired: false,
    });
    expect(parseTimeControl("不限时")).toMatchObject({ mainSeconds: null, expired: false });
  });

  it("rejects malformed or unbounded time settings", () => {
    expect(() => parseTimeControl("20分+0×30秒")).toThrow("用时");
    expect(() => parseTimeControl("999999999999999999999分+3×30秒")).toThrow("用时");
  });

  it("counts main time before entering byo-yomi", () => {
    const clock = { ...parseTimeControl("20分+3×30秒"), mainSeconds: 1 };
    const endOfMain = tickGameClock(clock);

    expect(endOfMain).toMatchObject({ mainSeconds: 0, periods: 3, periodSeconds: 30 });
    expect(tickGameClock(endOfMain)).toMatchObject({ mainSeconds: 0, periods: 3, periodSeconds: 29 });
  });

  it("loses a period at zero and expires after the last period", () => {
    const clock = { ...parseTimeControl("20分+3×30秒"), mainSeconds: 0, periodSeconds: 1 };
    expect(tickGameClock(clock)).toMatchObject({ periods: 2, periodSeconds: 30, expired: false });
    expect(tickGameClock({ ...clock, periods: 1 })).toMatchObject({ periods: 0, expired: true });
  });

  it("resets the current byo-yomi period after a legal action", () => {
    const clock = { ...parseTimeControl("20分+3×30秒"), mainSeconds: 0, periodSeconds: 12 };
    expect(resetByoyomi(clock)).toMatchObject({ periods: 3, periodSeconds: 30 });
  });

  it("formats main time, byo-yomi and unlimited games", () => {
    expect(formatGameClock(parseTimeControl("20分+3×30秒"))).toBe("主时 20:00");
    expect(formatGameClock({ ...parseTimeControl("20分+3×30秒"), mainSeconds: 0 })).toBe("读秒 3×30");
    expect(formatGameClock(parseTimeControl("不限时"))).toBe("不限时");
  });
});
