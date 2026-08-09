import { hotGames, initialRooms, recentGames } from "@/data/mock";
import type { Room } from "@/types/site";

const uniqueIds = (ids: number[]) => [...new Set(ids)].map(String);

export const MATCH_DEMO_ID = 2401;

export const matchDemoRoom: Room = {
  id: MATCH_DEMO_ID,
  host: "若无一切心",
  guest: "访客棋手",
  hostRank: "2D",
  guestRank: "9K",
  boardSize: 19,
  rules: "中国规则",
  komi: 7.5,
  timeControl: "20分+3×30秒",
  status: "对局中",
  spectators: 0,
  isPrivate: false,
  allowSpectators: true,
};

export const gameRouteIds = uniqueIds([
  ...initialRooms.filter(({ status, isPrivate }) => status === "等待中" && !isPrivate).map(({ id }) => id),
  MATCH_DEMO_ID,
]);

export const watchRouteIds = uniqueIds([
  ...hotGames.map(({ id }) => id),
  ...initialRooms
    .filter(({ status, allowSpectators }) => status === "对局中" && allowSpectators)
    .map(({ id }) => id),
]);

export const recordRouteIds = uniqueIds([
  ...recentGames.map(({ id }) => id),
  ...hotGames.filter(({ result }) => result !== "进行中").map(({ id }) => id),
  ...initialRooms.filter(({ status }) => status === "已结束").map(({ id }) => id),
]);

export function getGameSummary(id: number) {
  return [...hotGames, ...recentGames].find((game) => game.id === id);
}
