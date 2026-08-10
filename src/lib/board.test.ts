import { describe, expect, it } from "vitest";
import { formatGoCoordinate, getBoardGeometry, getBoardPoint } from "./board";

describe("board geometry", () => {
  it("keeps intersections square inside a wide canvas", () => {
    const geometry = getBoardGeometry(800, 600, 19);
    expect(geometry.spacing).toBeCloseTo(528 / 18);
    expect(geometry.padX).toBeCloseTo(136);
    expect(geometry.padY).toBeCloseTo(36);
  });

  it("maps the visual center to the center intersection", () => {
    expect(getBoardPoint(400, 300, 800, 600, 19)).toEqual({ x: 9, y: 9 });
  });

  it("formats human coordinates from the lower-left and skips I", () => {
    expect(formatGoCoordinate({ x: 0, y: 0 }, 19)).toBe("A19");
    expect(formatGoCoordinate({ x: 8, y: 18 }, 19)).toBe("J1");
    expect(formatGoCoordinate({ x: 4, y: 4 }, 9)).toBe("E5");
  });
});
