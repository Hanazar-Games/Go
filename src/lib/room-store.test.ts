import { describe, expect, it } from "vitest";
import { createRoom, validateRoomInput } from "./room-store";

describe("room store", () => {
  it("rejects unsupported board sizes", () => {
    expect(() =>
      validateRoomInput({ boardSize: 10, rules: "中国规则", komi: 7.5, mainTime: 20, byoyomi: 30 }),
    ).toThrow("棋盘尺寸");
  });

  it("creates a readable waiting room", () => {
    const room = createRoom({
      boardSize: 19,
      rules: "中国规则",
      komi: 7.5,
      mainTime: 20,
      byoyomi: 30,
      isPrivate: false,
      allowSpectators: true,
    });
    expect(room).toMatchObject({
      boardSize: 19,
      status: "等待中",
      host: "访客棋手",
      allowSpectators: true,
    });
  });
});
