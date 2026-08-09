import type { Metadata } from "next";
import { Suspense } from "react";
import { RankingClient } from "./RankingClient";

export const metadata: Metadata = { title: "棋手排行榜" };

export default function RankingPage() {
  return (
    <Suspense fallback={null}>
      <RankingClient />
    </Suspense>
  );
}
