import type { Metadata } from "next";
import { players } from "@/data/mock";
import { getRooms } from "@/lib/room-store";
import { HallClient } from "./HallClient";

export const metadata: Metadata = { title: "对弈大厅" };
export const dynamic = "force-dynamic";

export default function HallPage() {
  return <HallClient initialPlayers={players} initialRooms={getRooms()} />;
}
