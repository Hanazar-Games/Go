import { NextResponse } from "next/server";
import { createRoom, getRooms } from "@/lib/room-store";

export function GET() {
  return NextResponse.json({ rooms: getRooms() });
}

export async function POST(request: Request) {
  try {
    const room = createRoom(await request.json());
    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "创建失败" }, { status: 400 });
  }
}
