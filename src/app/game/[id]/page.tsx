import type { Metadata } from "next";
import { gameRouteIds, MATCH_DEMO_ID, matchDemoRoom } from "@/lib/game-data";
import { getRoom } from "@/lib/room-store";
import { GameRoomClient } from "./GameRoomClient";

export const metadata: Metadata = { title: "在线对局" };
export const dynamicParams = false;

export function generateStaticParams() {
  return gameRouteIds.map((id) => ({ id }));
}

export default async function GamePage({ params }: PageProps<"/game/[id]">) {
  const { id } = await params;
  const room = Number(id) === MATCH_DEMO_ID ? matchDemoRoom : getRoom(Number(id));
  return <GameRoomClient id={id} room={room} />;
}
