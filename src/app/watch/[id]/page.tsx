import type { Metadata } from "next";
import { GameRoom } from "@/components/game/GameRoom";
import { hotGames, initialRooms, recentGames } from "@/data/mock";
import { getRoom } from "@/lib/room-store";

export const metadata: Metadata = { title: "观战" };
export const dynamicParams = false;

export function generateStaticParams() {
  return [...new Set([...initialRooms, ...hotGames, ...recentGames].map(({ id }) => String(id)))].map(
    (id) => ({ id }),
  );
}

export default async function WatchPage({ params }: PageProps<"/watch/[id]">) {
  const { id } = await params;
  return <GameRoom id={id} room={getRoom(Number(id))} spectator />;
}
