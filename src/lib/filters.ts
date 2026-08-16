import type { BoardSize, Player, PlayerStatus, Room, RoomStatus } from "@/types/site";

export const MAX_PLAYER_QUERY_LENGTH = 20;

export function normalizePlayerQuery(value: string) {
  return value.trim().slice(0, MAX_PLAYER_QUERY_LENGTH);
}

export function filterPlayers(list: Player[], query: string, status: PlayerStatus | "全部") {
  const normalized = query.trim().toLocaleLowerCase("zh-CN");
  return list.filter((player) => {
    const matchesName = !normalized || player.username.toLocaleLowerCase("zh-CN").includes(normalized);
    return matchesName && (status === "全部" || player.status === status);
  });
}

export function filterRooms(list: Room[], status: RoomStatus | "全部", size: BoardSize | "全部") {
  return list.filter(
    (room) => (status === "全部" || room.status === status) && (size === "全部" || room.boardSize === size),
  );
}
