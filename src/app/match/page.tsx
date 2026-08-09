import type { Metadata } from "next";
import { Suspense } from "react";
import { MatchClient } from "./MatchClient";

export const metadata: Metadata = { title: "快速匹配" };

export default function MatchPage() {
  return (
    <Suspense fallback={null}>
      <MatchClient />
    </Suspense>
  );
}
