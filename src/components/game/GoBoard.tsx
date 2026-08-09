"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import type { Stone } from "@/types/site";
import styles from "./GoBoard.module.css";

interface Point {
  x: number;
  y: number;
}

export function GoBoard({
  stones,
  size = 19,
  readOnly = false,
  onMove,
}: {
  stones: Stone[];
  size?: 9 | 13 | 19;
  readOnly?: boolean;
  onMove?: (point: Point) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<Point | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);

    const width = rect.width;
    const height = rect.height;
    const padX = 35;
    const padY = 36;
    const dx = (width - padX * 2) / (size - 1);
    const dy = (height - padY * 2) / (size - 1);
    const wood = context.createLinearGradient(0, 0, width, height);
    wood.addColorStop(0, "#d69b42");
    wood.addColorStop(0.5, "#eab157");
    wood.addColorStop(1, "#c98731");
    context.fillStyle = wood;
    context.fillRect(0, 0, width, height);
    context.globalAlpha = 0.15;
    for (let y = 4; y < height; y += 9) {
      context.fillStyle = y % 27 === 4 ? "#74431f" : "#fff0af";
      context.fillRect(0, y, width, 1);
    }
    context.globalAlpha = 1;
    context.strokeStyle = "#302416";
    context.lineWidth = 1.3;
    for (let index = 0; index < size; index += 1) {
      context.beginPath();
      context.moveTo(padX + index * dx, padY);
      context.lineTo(padX + index * dx, height - padY);
      context.stroke();
      context.beginPath();
      context.moveTo(padX, padY + index * dy);
      context.lineTo(width - padX, padY + index * dy);
      context.stroke();
    }

    context.fillStyle = "#211b12";
    context.font = "15px SimSun, serif";
    context.textAlign = "center";
    const letters = "ABCDEFGHJKLMNOPQRST";
    [...letters.slice(0, size)].forEach((letter, index) => context.fillText(letter, padX + index * dx, 21));
    for (let index = 0; index < size; index += 1)
      context.fillText(String(index + 1), 12, padY + index * dy + 5);

    const starIndexes = size === 19 ? [3, 9, 15] : size === 13 ? [3, 6, 9] : [2, 4, 6];
    starIndexes.forEach((x) =>
      starIndexes.forEach((y) => {
        context.beginPath();
        context.arc(padX + x * dx, padY + y * dy, 3.1, 0, Math.PI * 2);
        context.fill();
      }),
    );

    const radius = Math.min(dx, dy) * 0.47;
    stones.forEach((stone) => {
      const cx = padX + stone.x * dx;
      const cy = padY + stone.y * dy;
      const gradient = context.createRadialGradient(cx - radius * 0.35, cy - radius * 0.4, 1, cx, cy, radius);
      if (stone.color === "black") {
        gradient.addColorStop(0, "#57534c");
        gradient.addColorStop(0.42, "#211f1c");
        gradient.addColorStop(1, "#050505");
      } else {
        gradient.addColorStop(0, "#fff");
        gradient.addColorStop(0.55, "#ece9d9");
        gradient.addColorStop(1, "#b6b19b");
      }
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.fillStyle = gradient;
      context.shadowColor = "#3b2a17aa";
      context.shadowBlur = 2;
      context.shadowOffsetY = 1;
      context.fill();
      context.shadowColor = "transparent";
      if (stone.last) {
        context.beginPath();
        context.moveTo(cx, cy - 6);
        context.lineTo(cx - 6, cy + 5);
        context.lineTo(cx + 6, cy + 5);
        context.closePath();
        context.fillStyle = "#d72f2b";
        context.fill();
      }
    });

    if (!readOnly && hover && !stones.some(({ x, y }) => x === hover.x && y === hover.y)) {
      context.beginPath();
      context.arc(padX + hover.x * dx, padY + hover.y * dy, radius, 0, Math.PI * 2);
      context.fillStyle = "#13131372";
      context.fill();
    }
  }, [hover, readOnly, size, stones]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();
    return () => observer.disconnect();
  }, [draw]);

  function toPoint(event: MouseEvent<HTMLCanvasElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.round((event.clientX - rect.left - 35) / ((rect.width - 70) / (size - 1))),
      y: Math.round((event.clientY - rect.top - 36) / ((rect.height - 72) / (size - 1))),
    };
  }

  function useKeyboard(event: KeyboardEvent<HTMLCanvasElement>) {
    if (readOnly) return;
    const current = hover ?? { x: Math.floor(size / 2), y: Math.floor(size / 2) };
    const direction = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[event.key];
    if (direction) {
      event.preventDefault();
      setHover({
        x: Math.min(size - 1, Math.max(0, current.x + direction[0])),
        y: Math.min(size - 1, Math.max(0, current.y + direction[1])),
      });
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onMove?.(current);
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className={readOnly ? styles.readOnly : styles.board}
      aria-label={`${size}路围棋棋盘${readOnly ? "，观战模式" : "，可落子"}`}
      role={readOnly ? "img" : "button"}
      tabIndex={readOnly ? -1 : 0}
      onFocus={() => {
        if (!readOnly && !hover) setHover({ x: Math.floor(size / 2), y: Math.floor(size / 2) });
      }}
      onKeyDown={useKeyboard}
      onMouseMove={(event) => {
        const point = toPoint(event);
        setHover(point.x >= 0 && point.x < size && point.y >= 0 && point.y < size ? point : null);
      }}
      onMouseLeave={() => setHover(null)}
      onClick={(event) => {
        if (!readOnly) {
          const point = toPoint(event);
          if (point.x >= 0 && point.x < size && point.y >= 0 && point.y < size) onMove?.(point);
        }
      }}
    />
  );
}
