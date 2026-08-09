import type { Metadata } from "next";
import { players } from "@/data/mock";
import { PlayerProfile } from "./PlayerProfile";

export const metadata: Metadata = { title: "棋手主页" };
export const dynamicParams = false;

export function generateStaticParams() {
  return players.map(({ username }) => ({ username }));
}

export default async function PlayerPage({ params }: PageProps<"/players/[username]">) {
  const { username: encoded } = await params;
  const username = decodeURIComponent(encoded);
  const player = players.find((item) => item.username === username) ?? players[0];
  return <PlayerProfile player={player} />;
}
