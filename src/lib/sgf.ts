import { parseTimeControl } from "./game-clock";
import type { GoColor } from "./go-engine";
import type { RuleSet } from "@/types/site";

interface SgfMove {
  color: GoColor;
  x?: number;
  y?: number;
}

interface SgfGame {
  appVersion: string;
  size: number;
  komi: number;
  rules: RuleSet;
  timeControl: string;
  blackName: string;
  whiteName: string;
  result: string;
  moves: SgfMove[];
}

const escapeValue = (value: string) => value.replaceAll("\\", "\\\\").replaceAll("]", "\\]");

export function buildSgf(game: SgfGame) {
  const clock = parseTimeControl(game.timeControl);
  const time =
    clock.mainSeconds === null
      ? ""
      : `TM[${clock.mainSeconds}]OT[${clock.periods}x${clock.byoyomiSeconds} byo-yomi]`;
  const moves = game.moves
    .map(({ color, x, y }) => {
      const point =
        x === undefined || y === undefined
          ? ""
          : `${String.fromCharCode(97 + x)}${String.fromCharCode(97 + y)}`;
      return `;${color === "black" ? "B" : "W"}[${point}]`;
    })
    .join("");
  return `(;GM[1]FF[4]CA[UTF-8]AP[Weida:${escapeValue(game.appVersion)}]SZ[${game.size}]KM[${game.komi}]RU[${escapeValue(game.rules)}]${time}PB[${escapeValue(game.blackName)}]PW[${escapeValue(game.whiteName)}]RE[${escapeValue(game.result)}]${moves})`;
}
