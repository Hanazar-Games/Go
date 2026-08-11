import { describe, expect, it } from "vitest";
import type { Room } from "@/types/site";
import { buildLocalGameHref, parseLocalGameRoom } from "./local-game";

const room: Room = {
  id: 2400,
  host: "访客棋手",
  guest: null,
  hostRank: "9K",
  guestRank: null,
  boardSize: 9,
  rules: "日本规则",
  komi: 6.5,
  timeControl: "10分+3×20秒",
  status: "等待中",
  spectators: 0,
  isPrivate: false,
  allowSpectators: true,
};

describe("local game links", () => {
  it("round-trips the created room configuration through a static route", () => {
    const href = buildLocalGameHref(room);
    const parsed = parseLocalGameRoom(new URL(href, "https://weida.test").searchParams);

    expect(href).toMatch(/^\/game\/2401\?local=1/);
    expect(parsed).toMatchObject({
      id: 2400,
      host: "访客棋手",
      guest: "围达演示棋手",
      boardSize: 9,
      rules: "日本规则",
      komi: 6.5,
      timeControl: "10分+3×20秒",
      status: "对局中",
    });
  });

  it("rejects incomplete or altered room parameters", () => {
    expect(parseLocalGameRoom(new URLSearchParams("local=1&room=2400&board=10"))).toBeUndefined();
    expect(parseLocalGameRoom(new URLSearchParams("local=0&room=2400&board=9"))).toBeUndefined();
    expect(
      parseLocalGameRoom(
        new URLSearchParams("local=1&room=2400&board=9&rules=cn&komi=-0.5&time=10分%2B3×20秒"),
      ),
    ).toBeUndefined();
  });
});
