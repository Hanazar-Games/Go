import { describe, expect, it } from "vitest";
import { buildSgf } from "./sgf";

describe("SGF export", () => {
  it("writes board, players, result, clock and pass metadata", () => {
    const sgf = buildSgf({
      appVersion: "0.8.0",
      size: 9,
      komi: 6.5,
      rules: "日本规则",
      timeControl: "10分+3×20秒",
      blackName: "黑]手",
      whiteName: "白\\手",
      result: "W+T",
      moves: [{ color: "black", x: 0, y: 0 }, { color: "white" }],
    });

    expect(sgf).toContain("AP[Weida:0.8.0]SZ[9]KM[6.5]RU[日本规则]");
    expect(sgf).toContain("TM[600]OT[3x20 byo-yomi]");
    expect(sgf).toContain("PB[黑\\]手]PW[白\\\\手]RE[W+T]");
    expect(sgf).toContain(";B[aa];W[]");
  });

  it("omits clock properties for unlimited games", () => {
    expect(
      buildSgf({
        appVersion: "0.8.0",
        size: 19,
        komi: 7.5,
        rules: "中国规则",
        timeControl: "不限时",
        blackName: "黑方",
        whiteName: "白方",
        result: "?",
        moves: [],
      }),
    ).not.toMatch(/TM\[|OT\[/);
  });
});
