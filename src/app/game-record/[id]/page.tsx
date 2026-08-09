import type { Metadata } from "next";
import { hotGames, initialRooms, recentGames } from "@/data/mock";
import { RecordReplay } from "./RecordReplay";

export const metadata: Metadata = { title: "棋谱回放" };
export const dynamicParams = false;

export function generateStaticParams() {
  return [...new Set([...initialRooms, ...hotGames, ...recentGames].map(({ id }) => String(id)))].map(
    (id) => ({ id }),
  );
}

export default async function GameRecordPage({ params }: PageProps<"/game-record/[id]">) {
  const { id } = await params;
  return <RecordReplay id={id} />;
}
