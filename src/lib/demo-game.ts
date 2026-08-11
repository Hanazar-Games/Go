import type { BoardSize, Stone } from "@/types/site";
import { boardHash, playMove, type CaptureTally, type GoColor, type GoPoint } from "./go-engine";

export interface DemoMove extends GoPoint {
  color: GoColor;
  captured: number;
}

export interface DemoGame {
  stones: Stone[];
  moves: DemoMove[];
  positions: Stone[][];
  nextColor: GoColor;
  captures: CaptureTally;
  hashes: string[];
}

const targetMoves: Record<BoardSize, number> = { 9: 48, 13: 96, 19: 184 };
const opposite = (color: GoColor): GoColor => (color === "black" ? "white" : "black");

function candidatePoints(size: BoardSize, color: GoColor) {
  const star = size === 9 ? 2 : 3;
  const far = size - 1 - star;
  const middle = Math.floor(size / 2);
  const opening =
    color === "black"
      ? [
          { x: star, y: far },
          { x: far, y: far },
          { x: middle, y: middle },
        ]
      : [
          { x: far, y: star },
          { x: star, y: star },
        ];
  const rest = Array.from({ length: size * size }, (_, index) => ({
    x: index % size,
    y: Math.floor(index / size),
  })).sort((a, b) => {
    const rank = (point: GoPoint) => (point.x * 43 + point.y * 71 + point.x * point.y * 17) % 997;
    const influence = (point: GoPoint) =>
      Math.sin(point.x * 0.82) +
      Math.cos(point.y * 0.71) +
      Math.sin((point.x + point.y) * 0.39) +
      (((rank(point) % 37) - 18) / 20) * 0.7;
    const difference = influence(a) - influence(b);
    if (Math.abs(difference) > 0.001) return color === "black" ? difference : -difference;
    return rank(a) - rank(b) || a.y - b.y || a.x - b.x;
  });
  const seen = new Set<string>();
  return [...opening, ...rest].filter(({ x, y }) => {
    const key = `${x},${y}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function createDemoGame(size: BoardSize): DemoGame {
  let stones: DemoGame["stones"] = [];
  let nextColor: GoColor = "black";
  const moves: DemoMove[] = [];
  const positions: DemoGame["positions"] = [[]];
  const captures: CaptureTally = { black: 0, white: 0 };
  const hashes = [boardHash(stones, size)];
  const candidates = {
    black: candidatePoints(size, "black"),
    white: candidatePoints(size, "white"),
  };
  const indexes: Record<GoColor, number> = { black: 0, white: 0 };
  const used = new Set<string>();

  while (moves.length < targetMoves[size]) {
    let played = false;
    while (indexes[nextColor] < candidates[nextColor].length) {
      const point = candidates[nextColor][indexes[nextColor]++];
      const key = `${point.x},${point.y}`;
      if (used.has(key)) continue;
      const result = playMove({
        stones,
        size,
        color: nextColor,
        point,
        forbiddenHash: hashes.at(-2),
      });
      if (!result.ok) continue;
      used.add(key);
      moves.push({ ...point, color: nextColor, captured: result.captured });
      captures[nextColor] += result.captured;
      stones = result.stones;
      positions.push(stones);
      hashes.push(result.hash);
      nextColor = opposite(nextColor);
      played = true;
      break;
    }
    if (!played) break;
  }

  return { stones, moves, positions, nextColor, captures, hashes };
}
