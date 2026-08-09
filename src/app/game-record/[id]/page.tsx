import type { Metadata } from "next";
import { initialRooms } from "@/data/mock";
import { getGameSummary, recordRouteIds } from "@/lib/game-data";
import { RecordReplay } from "./RecordReplay";

export const metadata: Metadata = { title: "棋谱回放" };
export const dynamicParams = false;

export function generateStaticParams() {
  return recordRouteIds.map((id) => ({ id }));
}

export default async function GameRecordPage({ params }: PageProps<"/game-record/[id]">) {
  const { id } = await params;
  const numericId = Number(id);
  return (
    <RecordReplay
      key={id}
      id={id}
      game={getGameSummary(numericId)}
      room={initialRooms.find((item) => item.id === numericId)}
    />
  );
}
