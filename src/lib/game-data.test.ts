import { describe, expect, it } from "vitest";
import {
  gameRouteIds,
  getGameSummaryHref,
  getGameSummary,
  MATCH_DEMO_ID,
  matchDemoRoom,
  recordRouteIds,
  watchRouteIds,
} from "./game-data";

describe("static game routes", () => {
  it("only generates playable rooms and the fixed match demo as games", () => {
    expect(gameRouteIds).toContain("2386");
    expect(gameRouteIds).toContain(String(MATCH_DEMO_ID));
    expect(gameRouteIds).not.toContain("2388");
    expect(gameRouteIds).not.toContain("2368");
    expect(gameRouteIds).not.toContain("2394");
    expect(matchDemoRoom).toMatchObject({ id: 2401, host: "若无一切心", guest: "访客棋手" });
  });

  it("separates watchable and completed games", () => {
    expect(watchRouteIds).toEqual(expect.arrayContaining(["2371", "2382", "2388", "2393"]));
    expect(watchRouteIds).not.toContain("2386");
    expect(recordRouteIds).toEqual(expect.arrayContaining(["2371", "2368", "2367", "2365", "2361"]));
    expect(recordRouteIds).not.toContain("2388");
  });

  it("returns the matching record metadata", () => {
    expect(getGameSummary(2368)).toMatchObject({
      boardSize: 19,
      black: "万里孤山走",
      white: "Akira",
      result: "白胜3.5目",
    });
    expect(getGameSummary(2365)?.boardSize).toBe(9);
  });

  it("routes live games to spectating and finished games to replay", () => {
    expect(getGameSummaryHref({ id: 2382, result: "进行中" })).toBe("/watch/2382");
    expect(getGameSummaryHref({ id: 2371, result: "白中盘胜" })).toBe("/game-record/2371");
  });
});
