import { describe, expect, it } from "vitest";
import type { BoardSize } from "@/types/site";
import { boardHash, playMove } from "./go-engine";
import { createDemoGame } from "./demo-game";

describe("legal demo game", () => {
  it.each([9, 13, 19] satisfies BoardSize[])(
    "builds an alternating legal replay on a %i line board",
    (size) => {
      const game = createDemoGame(size);
      let stones = game.positions[0];
      const hashes = [boardHash(stones, size)];

      expect(stones).toEqual([]);
      expect(game.moves.length).toBeGreaterThan(size * 4);
      expect(game.positions).toHaveLength(game.moves.length + 1);

      game.moves.forEach((move, index) => {
        expect(move.color).toBe(index % 2 === 0 ? "black" : "white");
        const result = playMove({
          stones,
          size,
          color: move.color,
          point: move,
          forbiddenHash: hashes.at(-2),
        });
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        stones = result.stones;
        hashes.push(result.hash);
        expect(game.positions[index + 1]).toEqual(stones);
      });

      expect(game.stones).toEqual(stones);
      expect(game.hashes).toEqual(hashes);
    },
  );
});
