import { describe, expect, it } from "vitest";
import { players, initialRooms } from "@/data/mock";
import { filterPlayers, filterRooms, MAX_PLAYER_QUERY_LENGTH, normalizePlayerQuery } from "./filters";

describe("hall filters", () => {
  it("filters players by name and status", () => {
    expect(filterPlayers(players, "褚", "空闲").map(({ username }) => username)).toEqual(["褚赢"]);
    expect(filterPlayers(players, "", "观战").every(({ status }) => status === "观战")).toBe(true);
  });

  it("filters rooms by state and board size", () => {
    const rooms = filterRooms(initialRooms, "等待中", 13);
    expect(rooms).toHaveLength(1);
    expect(rooms[0]?.host).toBe("大宝最美");
  });

  it("normalizes externally supplied player queries to a safe display length", () => {
    expect(normalizePlayerQuery("  AKIRA  ")).toBe("AKIRA");
    expect(normalizePlayerQuery("棋".repeat(80))).toHaveLength(MAX_PLAYER_QUERY_LENGTH);
  });
});
