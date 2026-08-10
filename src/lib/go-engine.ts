import type { RuleSet, Stone } from "@/types/site";

export type GoColor = Stone["color"];

export interface GoPoint {
  x: number;
  y: number;
}

export interface CaptureTally {
  black: number;
  white: number;
}

type IllegalReason = "occupied" | "out-of-board" | "suicide" | "ko";

export type PlayResult =
  { ok: true; stones: Stone[]; captured: number; hash: string } | { ok: false; reason: IllegalReason };

const pointKey = ({ x, y }: GoPoint) => `${x},${y}`;
const opposite = (color: GoColor): GoColor => (color === "black" ? "white" : "black");

function neighbors({ x, y }: GoPoint, size: number) {
  return [
    { x: x - 1, y },
    { x: x + 1, y },
    { x, y: y - 1 },
    { x, y: y + 1 },
  ].filter((point) => point.x >= 0 && point.x < size && point.y >= 0 && point.y < size);
}

function collectGroup(board: Map<string, Stone>, origin: GoPoint, size: number) {
  const first = board.get(pointKey(origin));
  if (!first) return { stones: new Set<string>(), liberties: new Set<string>() };
  const group = new Set<string>();
  const liberties = new Set<string>();
  const pending = [origin];

  while (pending.length) {
    const point = pending.pop()!;
    const key = pointKey(point);
    if (group.has(key)) continue;
    group.add(key);
    neighbors(point, size).forEach((neighbor) => {
      const neighborKey = pointKey(neighbor);
      const stone = board.get(neighborKey);
      if (!stone) liberties.add(neighborKey);
      else if (stone.color === first.color && !group.has(neighborKey)) pending.push(neighbor);
    });
  }

  return { stones: group, liberties };
}

export function getGroupPoints(stones: Stone[], size: number, origin: GoPoint): GoPoint[] {
  const board = new Map(stones.map((stone) => [pointKey(stone), stone]));
  return [...collectGroup(board, origin, size).stones]
    .map((key) => {
      const [x, y] = key.split(",").map(Number);
      return { x, y };
    })
    .sort((a, b) => a.y - b.y || a.x - b.x);
}

export function adjudicateDeadStones(stones: Stone[], deadKeys: Iterable<string>, captures: CaptureTally) {
  const dead = new Set(deadKeys);
  const removed: CaptureTally = { black: 0, white: 0 };
  const remaining = stones.filter((stone) => {
    if (!dead.has(pointKey(stone))) return true;
    removed[stone.color] += 1;
    return false;
  });
  return {
    stones: remaining,
    captures: {
      black: captures.black + removed.white,
      white: captures.white + removed.black,
    },
    removed,
  };
}

export function boardHash(stones: Stone[], size: number) {
  const board = Array<string>(size * size).fill(".");
  stones.forEach(({ x, y, color }) => {
    if (x >= 0 && x < size && y >= 0 && y < size) board[y * size + x] = color === "black" ? "B" : "W";
  });
  return board.join("");
}

export function playMove({
  stones,
  size,
  color,
  point,
  forbiddenHash,
}: {
  stones: Stone[];
  size: number;
  color: GoColor;
  point: GoPoint;
  forbiddenHash?: string;
}): PlayResult {
  if (point.x < 0 || point.x >= size || point.y < 0 || point.y >= size) {
    return { ok: false, reason: "out-of-board" };
  }

  const board = new Map(stones.map((stone) => [pointKey(stone), { ...stone, last: false }]));
  const key = pointKey(point);
  if (board.has(key)) return { ok: false, reason: "occupied" };
  board.set(key, { ...point, color, last: true });

  let captured = 0;
  const checked = new Set<string>();
  neighbors(point, size).forEach((neighbor) => {
    const neighborKey = pointKey(neighbor);
    const stone = board.get(neighborKey);
    if (!stone || stone.color !== opposite(color) || checked.has(neighborKey)) return;
    const group = collectGroup(board, neighbor, size);
    group.stones.forEach((groupKey) => checked.add(groupKey));
    if (group.liberties.size > 0) return;
    group.stones.forEach((groupKey) => board.delete(groupKey));
    captured += group.stones.size;
  });

  if (collectGroup(board, point, size).liberties.size === 0) return { ok: false, reason: "suicide" };

  const nextStones = [...board.values()];
  const hash = boardHash(nextStones, size);
  if (forbiddenHash && hash === forbiddenHash) return { ok: false, reason: "ko" };
  return { ok: true, stones: nextStones, captured, hash };
}

export function scorePosition(
  stones: Stone[],
  size: number,
  rules: RuleSet,
  komi: number,
  captures: CaptureTally,
) {
  const board = new Map(stones.map((stone) => [pointKey(stone), stone]));
  const visited = new Set<string>();
  const territory: CaptureTally = { black: 0, white: 0 };
  let neutral = 0;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const origin = { x, y };
      const originKey = pointKey(origin);
      if (board.has(originKey) || visited.has(originKey)) continue;
      const region = new Set<string>();
      const borders = new Set<GoColor>();
      const pending = [origin];
      while (pending.length) {
        const point = pending.pop()!;
        const key = pointKey(point);
        if (visited.has(key) || board.has(key)) continue;
        visited.add(key);
        region.add(key);
        neighbors(point, size).forEach((neighbor) => {
          const stone = board.get(pointKey(neighbor));
          if (stone) borders.add(stone.color);
          else if (!visited.has(pointKey(neighbor))) pending.push(neighbor);
        });
      }
      if (borders.size === 1) territory[[...borders][0]] += region.size;
      else neutral += region.size;
    }
  }

  const stoneCount = stones.reduce<CaptureTally>(
    (count, stone) => ({ ...count, [stone.color]: count[stone.color] + 1 }),
    { black: 0, white: 0 },
  );
  const black = rules === "中国规则" ? stoneCount.black + territory.black : territory.black + captures.black;
  const white =
    (rules === "中国规则" ? stoneCount.white + territory.white : territory.white + captures.white) + komi;
  return {
    black,
    white,
    territory,
    neutral,
    winner: black === white ? null : black > white ? ("black" as const) : ("white" as const),
    margin: Math.abs(black - white),
  };
}
