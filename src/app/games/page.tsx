import type { Metadata } from "next";
import { Suspense } from "react";
import { GamesClient } from "./GamesClient";

export const metadata: Metadata = { title: "棋谱大厅" };

export default function GamesPage() {
  return (
    <Suspense fallback={null}>
      <GamesClient />
    </Suspense>
  );
}
