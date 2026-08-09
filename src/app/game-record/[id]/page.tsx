import type { Metadata } from "next";
import { RecordReplay } from "./RecordReplay";

export const metadata: Metadata = { title: "棋谱回放" };

export default async function GameRecordPage({ params }: PageProps<"/game-record/[id]">) {
  const { id } = await params;
  return <RecordReplay id={id} />;
}
