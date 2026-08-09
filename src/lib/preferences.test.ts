import { describe, expect, it } from "vitest";
import { DEFAULT_PREFERENCES, parsePreferences } from "./preferences";

describe("site preferences", () => {
  it("uses safe defaults for missing or invalid data", () => {
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences("not-json")).toEqual(DEFAULT_PREFERENCES);
  });

  it("normalizes saved audio and board preferences", () => {
    expect(
      parsePreferences(
        JSON.stringify({
          quality: "清晰",
          boardSize: 13,
          rules: "日本规则",
          allowChallenges: false,
          audio: { bgm: false, moveSound: true, interfaceSound: false, volume: 180 },
        }),
      ),
    ).toMatchObject({
      quality: "清晰",
      boardSize: 13,
      rules: "日本规则",
      allowChallenges: false,
      audio: { bgm: false, moveSound: true, interfaceSound: false, volume: 100 },
    });
  });
});
