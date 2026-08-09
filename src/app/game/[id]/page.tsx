import type { Metadata } from "next";
import { GameRoom } from "@/components/game/GameRoom";
import { getRoom } from "@/lib/room-store";

export const metadata: Metadata = { title: "在线对局" };

export default async function GamePage({ params }: PageProps<"/game/[id]">) {
  const { id } = await params;
  return <GameRoom id={id} room={getRoom(Number(id))} />;
}
