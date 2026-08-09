import { describe, expect, it } from "vitest";
import { initialRooms } from "@/data/mock";
import { createRoom, validateRoomInput } from "./room-store";

describe("room store", () => {
  it("rejects unsupported board sizes", () => {
    expect(() =>
      validateRoomInput({ boardSize: 10, rules: "中国规则", komi: 7.5, mainTime: 20, byoyomi: 30 }),
    ).toThrow("棋盘尺寸");
  });

  it("creates a readable waiting room without mutating the source list", () => {
    const rooms = structuredClone(initialRooms);
    const roomCount = rooms.length;
    const room = createRoom(
      {
        boardSize: 19,
        rules: "中国规则",
        komi: 7.5,
        mainTime: 20,
        byoyomi: 30,
        isPrivate: false,
        allowSpectators: true,
      },
      rooms,
    );
    expect(room).toMatchObject({
      id: 2400,
      boardSize: 19,
      status: "等待中",
      host: "访客棋手",
      allowSpectators: true,
    });
    expect(rooms).toHaveLength(roomCount);
  });
});
