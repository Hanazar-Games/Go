export type PlayerStatus = "空闲" | "对局中" | "观战" | "匹配中" | "离开";
export type BoardSize = 9 | 13 | 19;
export type RuleSet = "中国规则" | "日本规则";
export type RoomStatus = "等待中" | "对局中" | "已结束";

export interface Player {
  username: string;
  rank: string;
  rating: number;
  wins: number;
  losses: number;
  winRate: number;
  status: PlayerStatus;
  streak: number;
}

export interface Room {
  id: number;
  host: string;
  guest: string | null;
  hostRank: string;
  guestRank: string | null;
  boardSize: BoardSize;
  rules: RuleSet;
  komi: number;
  timeControl: string;
  status: RoomStatus;
  spectators: number;
  isPrivate: boolean;
  allowSpectators: boolean;
}

export interface CreateRoomInput {
  boardSize: BoardSize;
  rules: RuleSet;
  komi: number;
  mainTime: number;
  byoyomi: number;
  isPrivate: boolean;
  allowSpectators: boolean;
}

export interface GameSummary {
  id: number;
  boardSize: BoardSize;
  black: string;
  blackRank: string;
  white: string;
  whiteRank: string;
  result: string;
  moves: number;
  spectators: number;
  finishedAt?: string;
}

export interface Announcement {
  type: "公告" | "系统" | "赛事";
  text: string;
  date: string;
  version?: string;
  details?: string[];
}

export interface Stone {
  x: number;
  y: number;
  color: "black" | "white";
  last?: boolean;
}

export interface ChatMessage {
  time: string;
  name: string;
  text: string;
  system?: boolean;
}
