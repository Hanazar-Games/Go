"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { getBoardGeometry, getBoardPoint } from "@/lib/board";
import type { Stone } from "@/types/site";
import styles from "./GoBoard.module.css";

interface Point {
  x: number;
  y: number;
}

const emptyDeadKeys: ReadonlySet<string> = new Set();

export function GoBoard({
  stones,
  size = 19,
  readOnly = false,
  disabled = false,
  markDead = false,
  deadStoneKeys = emptyDeadKeys,
  onMove,
  onToggleDead,
}: {
  stones: Stone[];
  size?: 9 | 13 | 19;
  readOnly?: boolean;
  disabled?: boolean;
  markDead?: boolean;
  deadStoneKeys?: ReadonlySet<string>;
  onMove?: (point: Point) => void;
  onToggleDead?: (point: Point) => void;
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
    const { padX, padY, spacing } = getBoardGeometry(width, height, size);
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
      context.moveTo(padX + index * spacing, padY);
      context.lineTo(padX + index * spacing, padY + (size - 1) * spacing);
      context.stroke();
      context.beginPath();
      context.moveTo(padX, padY + index * spacing);
      context.lineTo(padX + (size - 1) * spacing, padY + index * spacing);
      context.stroke();
    }

    context.fillStyle = "#211b12";
    context.font = "15px SimSun, serif";
    context.textAlign = "center";
    const letters = "ABCDEFGHJKLMNOPQRST";
    [...letters.slice(0, size)].forEach((letter, index) =>
      context.fillText(letter, padX + index * spacing, Math.max(16, padY - 15)),
    );
    for (let index = 0; index < size; index += 1)
      context.fillText(String(size - index), Math.max(12, padX - 21), padY + index * spacing + 5);

    const starIndexes = size === 19 ? [3, 9, 15] : size === 13 ? [3, 6, 9] : [2, 4, 6];
    starIndexes.forEach((x) =>
      starIndexes.forEach((y) => {
        context.beginPath();
        context.arc(padX + x * spacing, padY + y * spacing, 3.1, 0, Math.PI * 2);
        context.fill();
      }),
    );

    const radius = spacing * 0.47;
    stones.forEach((stone) => {
      const markedDead = deadStoneKeys.has(`${stone.x},${stone.y}`);
      const cx = padX + stone.x * spacing;
      const cy = padY + stone.y * spacing;
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
      context.globalAlpha = markedDead ? 0.42 : 1;
      context.fill();
      context.globalAlpha = 1;
      context.shadowColor = "transparent";
      if (markedDead) {
        context.beginPath();
        context.moveTo(cx - radius * 0.48, cy - radius * 0.48);
        context.lineTo(cx + radius * 0.48, cy + radius * 0.48);
        context.moveTo(cx + radius * 0.48, cy - radius * 0.48);
        context.lineTo(cx - radius * 0.48, cy + radius * 0.48);
        context.strokeStyle = "#a11d18";
        context.lineWidth = 2;
        context.stroke();
      } else if (stone.last) {
        context.beginPath();
        context.moveTo(cx, cy - 6);
        context.lineTo(cx - 6, cy + 5);
        context.lineTo(cx + 6, cy + 5);
        context.closePath();
        context.fillStyle = "#d72f2b";
        context.fill();
      }
    });

    if (!readOnly && !disabled && hover) {
      const occupied = stones.some(({ x, y }) => x === hover.x && y === hover.y);
      context.beginPath();
      context.arc(padX + hover.x * spacing, padY + hover.y * spacing, radius, 0, Math.PI * 2);
      if (markDead && occupied) {
        context.strokeStyle = "#a11d18";
        context.lineWidth = 2;
        context.stroke();
      } else if (!markDead && !occupied) {
        context.fillStyle = "#13131372";
        context.fill();
      }
    }
  }, [deadStoneKeys, disabled, hover, markDead, readOnly, size, stones]);

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
    return getBoardPoint(event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height, size);
  }

  function useKeyboard(event: KeyboardEvent<HTMLCanvasElement>) {
    if (readOnly || disabled) return;
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
      if (markDead) onToggleDead?.(current);
      else onMove?.(current);
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className={
        readOnly ? styles.readOnly : disabled ? styles.disabled : markDead ? styles.marking : styles.board
      }
      aria-label={`${size}路围棋棋盘${readOnly ? "，观战模式" : disabled ? "，等待对手" : markDead ? "，数目阶段，可标记死子" : "，可落子"}`}
      role={readOnly ? "img" : "button"}
      tabIndex={readOnly ? -1 : 0}
      aria-disabled={readOnly ? undefined : disabled}
      onFocus={() => {
        if (!readOnly && !disabled && !hover) setHover({ x: Math.floor(size / 2), y: Math.floor(size / 2) });
      }}
      onKeyDown={useKeyboard}
      onMouseMove={(event) => {
        if (disabled) setHover(null);
        else {
          const point = toPoint(event);
          setHover(point.x >= 0 && point.x < size && point.y >= 0 && point.y < size ? point : null);
        }
      }}
      onMouseLeave={() => setHover(null)}
      onClick={(event) => {
        if (!readOnly && !disabled) {
          const point = toPoint(event);
          if (point.x >= 0 && point.x < size && point.y >= 0 && point.y < size) {
            if (markDead) onToggleDead?.(point);
            else onMove?.(point);
          }
        }
      }}
    />
  );
}
