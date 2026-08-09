import type { Metadata } from "next";
import { initialRooms, players } from "@/data/mock";
import { HallClient } from "../hall/HallClient";

export const metadata: Metadata = { title: "对弈大厅" };

export default function RoomsPage() {
  return <HallClient initialPlayers={players} initialRooms={initialRooms} />;
}
