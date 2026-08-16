import { describe, expect, it } from "vitest";
import type { Stone } from "@/types/site";
import { adjudicateDeadStones, boardHash, getGroupPoints, playMove, scorePosition } from "./go-engine";

const stone = (x: number, y: number, color: Stone["color"]): Stone => ({ x, y, color });

describe("go rules", () => {
  it("captures an opposing group with no liberties", () => {
    const stones = [stone(1, 1, "white"), stone(0, 1, "black"), stone(1, 0, "black"), stone(2, 1, "black")];
    const result = playMove({ stones, size: 9, color: "black", point: { x: 1, y: 2 } });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.captured).toBe(1);
    expect(result.stones.some(({ x, y }) => x === 1 && y === 1)).toBe(false);
  });

  it("captures every stone in a connected group", () => {
    const stones = [
      stone(1, 1, "white"),
      stone(1, 2, "white"),
      stone(0, 1, "black"),
      stone(1, 0, "black"),
      stone(2, 1, "black"),
      stone(0, 2, "black"),
      stone(2, 2, "black"),
    ];
    const result = playMove({ stones, size: 9, color: "black", point: { x: 1, y: 3 } });

    expect(result).toMatchObject({ ok: true, captured: 2 });
  });

  it("rejects occupied, out-of-board and suicidal moves", () => {
    const stones = [stone(0, 1, "black"), stone(1, 0, "black"), stone(2, 1, "black"), stone(1, 2, "black")];

    expect(playMove({ stones, size: 9, color: "white", point: { x: 0, y: 1 } })).toMatchObject({
      ok: false,
      reason: "occupied",
    });
    expect(playMove({ stones, size: 9, color: "white", point: { x: -1, y: 0 } })).toMatchObject({
      ok: false,
      reason: "out-of-board",
    });
    expect(playMove({ stones, size: 9, color: "white", point: { x: 1, y: 1 } })).toMatchObject({
      ok: false,
      reason: "suicide",
    });
  });

  it.each([
    { x: Number.NaN, y: 1 },
    { x: 1, y: Number.POSITIVE_INFINITY },
    { x: 1.5, y: 2 },
  ])("rejects a non-intersection coordinate $x,$y", (point) => {
    expect(playMove({ stones: [], size: 19, color: "black", point })).toMatchObject({
      ok: false,
      reason: "out-of-board",
    });
  });

  it("allows a zero-liberty placement when it captures first", () => {
    const stones = [
      stone(1, 1, "black"),
      stone(0, 1, "white"),
      stone(1, 0, "white"),
      stone(2, 1, "white"),
      stone(0, 2, "black"),
      stone(2, 2, "black"),
      stone(1, 3, "black"),
    ];
    const result = playMove({ stones, size: 9, color: "white", point: { x: 1, y: 2 } });

    expect(result).toMatchObject({ ok: true, captured: 1 });
  });

  it("rejects an immediate ko recapture", () => {
    const before = [
      stone(1, 1, "white"),
      stone(0, 1, "black"),
      stone(1, 0, "black"),
      stone(2, 1, "black"),
      stone(0, 2, "white"),
      stone(2, 2, "white"),
      stone(1, 3, "white"),
    ];
    const capture = playMove({ stones: before, size: 9, color: "black", point: { x: 1, y: 2 } });
    expect(capture.ok).toBe(true);
    if (!capture.ok) return;

    expect(
      playMove({
        stones: capture.stones,
        size: 9,
        color: "white",
        point: { x: 1, y: 1 },
        forbiddenHash: boardHash(before, 9),
      }),
    ).toMatchObject({ ok: false, reason: "ko" });
  });

  it.each([9, 13, 19])("plays legal corner and edge moves on a %i line board", (size) => {
    const corner = playMove({ stones: [], size, color: "black", point: { x: 0, y: 0 } });
    expect(corner).toMatchObject({ ok: true, captured: 0 });
    if (!corner.ok) return;
    expect(
      playMove({ stones: corner.stones, size, color: "white", point: { x: size - 1, y: 0 } }),
    ).toMatchObject({
      ok: true,
      captured: 0,
    });
  });

  it("marks a connected dead group and credits all prisoners", () => {
    const stones = [stone(0, 0, "white"), stone(1, 0, "white"), stone(4, 4, "black")];
    expect(getGroupPoints(stones, 9, { x: 0, y: 0 })).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ]);

    const result = adjudicateDeadStones(stones, ["0,0", "1,0"], { black: 1, white: 0 });
    expect(result).toEqual({
      stones: [stone(4, 4, "black")],
      captures: { black: 3, white: 0 },
      removed: { black: 0, white: 2 },
    });
    expect(stones).toHaveLength(3);
  });
});

describe("go scoring", () => {
  const enclosure = [
    stone(0, 0, "black"),
    stone(1, 0, "black"),
    stone(2, 0, "black"),
    stone(0, 1, "black"),
    stone(2, 1, "black"),
    stone(0, 2, "black"),
    stone(1, 2, "black"),
    stone(2, 2, "black"),
  ];

  it("counts stones and surrounded territory under Chinese rules", () => {
    expect(scorePosition(enclosure, 3, "中国规则", 0, { black: 0, white: 0 })).toMatchObject({
      black: 9,
      white: 0,
      winner: "black",
      margin: 9,
    });
  });

  it("counts territory and captures under Japanese rules", () => {
    expect(scorePosition(enclosure, 3, "日本规则", 0, { black: 2, white: 0 })).toMatchObject({
      black: 3,
      white: 0,
      winner: "black",
      margin: 3,
    });
  });

  it("leaves shared empty regions neutral and applies komi to white", () => {
    const score = scorePosition([stone(0, 1, "black"), stone(2, 1, "white")], 3, "中国规则", 7.5, {
      black: 0,
      white: 0,
    });

    expect(score.territory).toEqual({ black: 0, white: 0 });
    expect(score.neutral).toBe(7);
    expect(score).toMatchObject({ black: 1, white: 8.5, winner: "white", margin: 7.5 });
  });
});
