import { initialRooms } from "@/data/mock";
import type { CreateRoomInput, Room } from "@/types/site";

export function getRoom(id: number): Room | undefined {
  const room = initialRooms.find((item) => item.id === id);
  return room ? structuredClone(room) : undefined;
}

export function validateRoomInput(value: unknown): CreateRoomInput {
  if (!value || typeof value !== "object") throw new Error("房间参数无效");
  const input = value as Partial<CreateRoomInput>;
  if (![9, 13, 19].includes(Number(input.boardSize))) throw new Error("不支持的棋盘尺寸");
  if (input.rules !== "中国规则" && input.rules !== "日本规则") throw new Error("不支持的规则");
  const komi = Number(input.komi);
  const mainTime = Number(input.mainTime);
  const byoyomi = Number(input.byoyomi);
  if (![komi, mainTime, byoyomi].every(Number.isFinite) || mainTime < 0 || byoyomi < 0) {
    throw new Error("时间或贴目参数无效");
  }
  return {
    boardSize: Number(input.boardSize) as CreateRoomInput["boardSize"],
    rules: input.rules,
    komi,
    mainTime,
    byoyomi,
    isPrivate: Boolean(input.isPrivate),
    allowSpectators: input.allowSpectators !== false,
  };
}

export function createRoom(value: unknown, rooms: Room[]): Room {
  const input = validateRoomInput(value);
  const room: Room = {
    id: Math.max(...rooms.map(({ id }) => id), 2399) + 1,
    host: "访客棋手",
    guest: null,
    hostRank: "9K",
    guestRank: null,
    boardSize: input.boardSize,
    rules: input.rules,
    komi: input.komi,
    timeControl: input.mainTime === 0 ? "不限时" : `${input.mainTime}分+3×${input.byoyomi}秒`,
    status: "等待中",
    spectators: 0,
    isPrivate: input.isPrivate,
    allowSpectators: input.allowSpectators,
  };
  return structuredClone(room);
}
