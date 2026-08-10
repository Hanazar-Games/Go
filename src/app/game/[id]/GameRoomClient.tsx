"use client";

import { useEffect, useState } from "react";
import { GameRoom } from "@/components/game/GameRoom";
import { parseLocalGameRoom } from "@/lib/local-game";
import type { Room } from "@/types/site";

export function GameRoomClient({ id, room }: { id: string; room?: Room }) {
  const [localRoom, setLocalRoom] = useState<Room>();

  useEffect(() => {
    const parsed = parseLocalGameRoom(new URLSearchParams(window.location.search));
    if (!parsed) return;
    const frame = window.requestAnimationFrame(() => setLocalRoom(parsed));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const activeRoom = localRoom ?? room;
  const roomKey = `${activeRoom?.id ?? id}-${activeRoom?.boardSize ?? 19}-${localRoom ? "local" : "public"}`;
  return (
    <GameRoom
      key={roomKey}
      id={String(activeRoom?.id ?? id)}
      room={activeRoom}
      fresh
      userColor={localRoom ? "black" : "white"}
    />
  );
}
