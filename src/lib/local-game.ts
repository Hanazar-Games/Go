import { parseTimeControl } from "./game-clock";
import { MATCH_DEMO_ID } from "./game-data";
import type { BoardSize, Room, RuleSet } from "@/types/site";

const boardSizes = new Set([9, 13, 19]);
const ruleCodes: Record<RuleSet, string> = { 中国规则: "cn", 日本规则: "jp" };
const rulesByCode: Record<string, RuleSet> = { cn: "中国规则", jp: "日本规则" };

export function buildLocalGameHref(room: Room): string {
  const params = new URLSearchParams({
    local: "1",
    room: String(room.id),
    board: String(room.boardSize),
    rules: ruleCodes[room.rules],
    komi: String(room.komi),
    time: room.timeControl,
  });
  return `/game/${MATCH_DEMO_ID}?${params}`;
}

export function parseLocalGameRoom(params: URLSearchParams): Room | undefined {
  if (params.get("local") !== "1") return undefined;
  const id = Number(params.get("room"));
  const boardSize = Number(params.get("board"));
  const rules = rulesByCode[params.get("rules") ?? ""];
  const komi = Number(params.get("komi"));
  const timeControl = params.get("time") ?? "";
  if (!Number.isSafeInteger(id) || id < 1 || !boardSizes.has(boardSize) || !rules) return undefined;
  if (!Number.isFinite(komi) || komi < 0 || komi > 99 || !Number.isInteger(komi * 2)) return undefined;
  try {
    parseTimeControl(timeControl);
  } catch {
    return undefined;
  }

  return {
    id,
    host: "访客棋手",
    guest: "围达演示棋手",
    hostRank: "9K",
    guestRank: "1D",
    boardSize: boardSize as BoardSize,
    rules,
    komi,
    timeControl,
    status: "对局中",
    spectators: 0,
    isPrivate: false,
    allowSpectators: true,
  };
}
