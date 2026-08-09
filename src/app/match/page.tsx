import type { Metadata } from "next";
import { MatchClient } from "./MatchClient";

export const metadata: Metadata = { title: "快速匹配" };

export default async function MatchPage({ searchParams }: PageProps<"/match">) {
  const { opponent } = await searchParams;
  return <MatchClient opponent={typeof opponent === "string" ? opponent : undefined} />;
}
