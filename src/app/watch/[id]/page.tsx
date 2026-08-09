import type { Metadata } from "next";
import { GameRoom } from "@/components/game/GameRoom";
import { getRoom } from "@/lib/room-store";

export const metadata: Metadata = { title: "观战" };

export default async function WatchPage({ params }: PageProps<"/watch/[id]">) {
  const { id } = await params;
  return <GameRoom id={id} room={getRoom(Number(id))} spectator />;
}
