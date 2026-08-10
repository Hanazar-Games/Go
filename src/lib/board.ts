export interface BoardGeometry {
  padX: number;
  padY: number;
  spacing: number;
}

const coordinateLetters = "ABCDEFGHJKLMNOPQRST";

export function formatGoCoordinate(point: { x: number; y: number }, size: number) {
  return `${coordinateLetters[point.x] ?? "?"}${size - point.y}`;
}

export function getBoardGeometry(width: number, height: number, size: number): BoardGeometry {
  const span = Math.max(1, Math.min(width - 70, height - 72));
  return {
    padX: (width - span) / 2,
    padY: (height - span) / 2,
    spacing: span / (size - 1),
  };
}

export function getBoardPoint(x: number, y: number, width: number, height: number, size: number) {
  const { padX, padY, spacing } = getBoardGeometry(width, height, size);
  return {
    x: Math.round((x - padX) / spacing),
    y: Math.round((y - padY) / spacing),
  };
}
