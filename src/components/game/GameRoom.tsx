"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { usePreferences } from "@/components/preferences/PreferencesProvider";
import { Avatar } from "@/components/ui/Avatar";
import { lobbyMessages, players } from "@/data/mock";
import { formatGoCoordinate } from "@/lib/board";
import { createDemoGame } from "@/lib/demo-game";
import {
  adjudicateDeadStones,
  boardHash,
  getGroupPoints,
  playMove,
  scorePosition,
  type CaptureTally,
  type GoColor,
  type GoPoint,
  type PlayResult,
} from "@/lib/go-engine";
import {
  advanceGameClock,
  formatGameClock,
  parseTimeControl,
  resetByoyomi,
  type GameClock,
} from "@/lib/game-clock";
import { SITE_VERSION } from "@/lib/release";
import { buildSgf } from "@/lib/sgf";
import { formatSiteTime } from "@/lib/site-time";
import type { BoardSize, ChatMessage, Room, Stone } from "@/types/site";
import { GoBoard } from "./GoBoard";
import styles from "./GameRoom.module.css";

interface GameMove {
  color: GoColor;
  x?: number;
  y?: number;
  captured?: number;
}

interface PositionState {
  stones: Stone[];
  moves: GameMove[];
  nextColor: GoColor;
  captures: CaptureTally;
  consecutivePasses: number;
  hashes: string[];
}

interface PrivateMessage {
  name: string;
  time: string;
  text: string;
}

const initialPrivateMessages: PrivateMessage[] = [
  { name: "褚赢", time: "15:48:54", text: "服吗？上手吧，别用脚下棋了，臭脚虾！" },
  { name: "俞晓旸", time: "15:48:59", text: "啊？你是谁？我可是冲段少年！" },
  { name: "褚赢", time: "15:49:13", text: "冲段少年了不起呀，我还是追风少年呢！" },
  { name: "褚赢", time: "15:49:18", text: "时光会把你雕刻成，你应有的样子：）" },
];

function coordinate(move: GameMove, size: number) {
  if (move.x === undefined || move.y === undefined) return "停一手";
  return formatGoCoordinate({ x: move.x, y: move.y }, size);
}

const opposite = (color: GoColor): GoColor => (color === "black" ? "white" : "black");
const colorName = (color: GoColor) => (color === "black" ? "黑方" : "白方");

function startingPosition(size: BoardSize, userColor: GoColor) {
  if (userColor === "black") return [];
  const starLine = size === 9 ? 2 : 3;
  return [{ x: size - 1 - starLine, y: starLine, color: "black", last: true } satisfies Stone];
}

function createInitialPosition(size: BoardSize, fresh: boolean, userColor: GoColor): PositionState {
  if (!fresh) {
    const demo = createDemoGame(size);
    return {
      stones: demo.stones,
      moves: demo.moves,
      nextColor: demo.nextColor,
      captures: demo.captures,
      consecutivePasses: 0,
      hashes: demo.hashes,
    };
  }
  const stones = startingPosition(size, userColor);
  const hash = boardHash(stones, size);
  return {
    stones,
    moves: stones.map(({ x, y, color }) => ({ x, y, color })),
    nextColor: fresh ? userColor : "black",
    captures: { black: 0, white: 0 },
    consecutivePasses: 0,
    hashes: fresh && stones.length ? [boardHash([], size), hash] : [hash],
  };
}

function applyLegalMove(
  position: PositionState,
  point: GoPoint,
  result: Extract<PlayResult, { ok: true }>,
): PositionState {
  const color = position.nextColor;
  return {
    stones: result.stones,
    moves: [...position.moves, { ...point, color, captured: result.captured }],
    nextColor: opposite(color),
    captures: { ...position.captures, [color]: position.captures[color] + result.captured },
    consecutivePasses: 0,
    hashes: [...position.hashes, result.hash],
  };
}

function applyPass(position: PositionState): PositionState {
  return {
    ...position,
    moves: [...position.moves, { color: position.nextColor }],
    nextColor: opposite(position.nextColor),
    consecutivePasses: position.consecutivePasses + 1,
    hashes: [...position.hashes, position.hashes.at(-1)!],
  };
}

function demoReply(position: PositionState, size: BoardSize) {
  const lastMove = position.moves.findLast(({ x, y }) => x !== undefined && y !== undefined);
  const edge = size === 19 ? 3 : size === 13 ? 3 : 2;
  const far = size - 1 - edge;
  const anchors: GoPoint[] = [
    { x: edge, y: edge },
    { x: far, y: far },
    { x: edge, y: far },
    { x: far, y: edge },
  ];
  const nearby = lastMove
    ? [
        { x: lastMove.x! + 1, y: lastMove.y! },
        { x: lastMove.x!, y: lastMove.y! + 1 },
        { x: lastMove.x! - 1, y: lastMove.y! },
        { x: lastMove.x!, y: lastMove.y! - 1 },
      ]
    : [];
  const all = Array.from({ length: size * size }, (_, index) => ({
    x: (index * 7 + position.moves.length * 3) % size,
    y: (Math.floor(index / size) * 5 + position.moves.length) % size,
  }));
  const candidates = [...anchors, ...nearby, ...all];
  const seen = new Set<string>();
  for (const point of candidates) {
    const key = `${point.x},${point.y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const result = playMove({
      stones: position.stones,
      size,
      color: position.nextColor,
      point,
      forbiddenHash: position.hashes.at(-2),
    });
    if (result.ok) return { point, result };
  }
  return null;
}

export function GameRoom({
  id,
  room,
  spectator = false,
  fresh = false,
  userColor = fresh ? "white" : "black",
}: {
  id: string;
  room?: Room;
  spectator?: boolean;
  fresh?: boolean;
  userColor?: GoColor;
}) {
  const boardSize = room?.boardSize ?? 19;
  const finished = room?.status === "已结束" || id === "2371";
  const waiting = room?.status === "等待中";
  const { playSound } = usePreferences();
  const [positions, setPositions] = useState<PositionState[]>(() => [
    createInitialPosition(boardSize, fresh, userColor),
  ]);
  const position = positions.at(-1)!;
  const { stones, moves, nextColor, captures } = position;
  const [gameOver, setGameOver] = useState(finished);
  const [scoring, setScoring] = useState(false);
  const [deadKeys, setDeadKeys] = useState<Set<string>>(() => new Set());
  const [resultOpen, setResultOpen] = useState(finished);
  const [tab, setTab] = useState<"moves" | "chat">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>(lobbyMessages);
  const [privateOpen, setPrivateOpen] = useState(false);
  const [privateMessages, setPrivateMessages] = useState(() => (id === "2371" ? initialPrivateMessages : []));
  const [result, setResult] = useState(finished ? "白中盘胜" : "对局进行中");
  const [winnerColor, setWinnerColor] = useState<GoColor | null>(finished ? "white" : null);
  const [sgfResult, setSgfResult] = useState(finished ? "W+R" : "?");
  const [ruleNotice, setRuleNotice] = useState(
    fresh ? `${colorName(userColor)}（访客棋手）请落子` : "合法静态演示盘面已载入",
  );
  const [clocks, setClocks] = useState<Record<GoColor, GameClock>>(() => ({
    black: parseTimeControl(room?.timeControl ?? "20分+3×30秒"),
    white: parseTimeControl(room?.timeControl ?? "20分+3×30秒"),
  }));
  const clocksRef = useRef(clocks);
  const lastClockTickRef = useRef(0);

  const blackName = room?.host ?? "俞晓旸";
  const whiteName = room?.guest ?? (waiting && fresh ? "访客棋手" : waiting ? "等待对手" : "褚赢");
  const blackRecord = players.find(({ username }) => username === blackName);
  const whiteRecord = players.find(({ username }) => username === whiteName);
  const blackPlayer = {
    name: blackName,
    rank: room?.hostRank ?? "9P",
    wins: blackRecord?.wins ?? 0,
    losses: blackRecord?.losses ?? 0,
    variant: blackName === "褚赢" ? ("warrior" as const) : ("person" as const),
  };
  const whitePlayer = {
    name: whiteName,
    rank: room ? (room.guestRank ?? "—") : "9D",
    wins: whiteRecord?.wins ?? 0,
    losses: whiteRecord?.losses ?? 0,
    variant: whiteName === "褚赢" ? ("warrior" as const) : ("person" as const),
  };
  const winner = winnerColor === "black" ? blackPlayer : whitePlayer;
  const loser = winnerColor === "black" ? whitePlayer : blackPlayer;
  const opponentName = userColor === "black" ? whiteName : blackName;
  const thinking = fresh && !spectator && !gameOver && !scoring && nextColor !== userColor;
  const provisionalScore = scoring;
  const scoreUnit = room?.rules === "日本规则" ? "目" : "点";
  const scoredPosition = adjudicateDeadStones(stones, deadKeys, captures);
  const scorePreview = scorePosition(
    scoredPosition.stones,
    boardSize,
    room?.rules ?? "中国规则",
    room?.komi ?? 7.5,
    scoredPosition.captures,
  );
  const resetMovedClock = useCallback((color: GoColor) => {
    const current = clocksRef.current;
    const clock = resetByoyomi(current[color]);
    if (clock === current[color]) return;
    const updated = { ...current, [color]: clock };
    clocksRef.current = updated;
    setClocks(updated);
  }, []);

  useEffect(() => {
    if (!resultOpen && !privateOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (privateOpen) setPrivateOpen(false);
      else setResultOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [privateOpen, resultOpen]);

  useEffect(() => {
    if (spectator || gameOver || scoring || !fresh) return;
    lastClockTickRef.current = Date.now();
    const timer = window.setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastClockTickRef.current) / 1000);
      if (elapsed < 1) return;
      lastClockTickRef.current += elapsed * 1000;
      const current = clocksRef.current;
      const clock = advanceGameClock(current[nextColor], elapsed);
      if (clock === current[nextColor]) return;
      const updated = { ...current, [nextColor]: clock };
      clocksRef.current = updated;
      setClocks(updated);
      if (!clock.expired) return;

      const winning = opposite(nextColor);
      setWinnerColor(winning);
      setSgfResult(`${winning === "black" ? "B" : "W"}+T`);
      setResult(`${colorName(nextColor)}超时，${colorName(winning)}胜`);
      setMessages((messages) => [
        ...messages,
        { time: "系统", name: "系统", text: `${colorName(nextColor)}用时耗尽，对局结束。`, system: true },
      ]);
      setGameOver(true);
      setPrivateOpen(false);
      setResultOpen(true);
      setRuleNotice(`${colorName(nextColor)}超时，棋钟停止`);
      playSound("success");
    }, 500);
    return () => window.clearInterval(timer);
  }, [fresh, gameOver, nextColor, playSound, scoring, spectator]);

  useEffect(() => {
    if (!thinking) return;
    const timer = window.setTimeout(() => {
      const demoColor = position.nextColor;
      if (position.consecutivePasses === 1) {
        const next = applyPass(position);
        setPositions((current) => (current.at(-1) === position ? [...current, next] : current));
        resetMovedClock(demoColor);
        setDeadKeys(new Set());
        setScoring(true);
        setMessages((current) => [
          ...current,
          {
            time: "系统",
            name: "系统",
            text: `${colorName(demoColor)}同意停一手，进入本地数目试算。`,
            system: true,
          },
        ]);
        setRuleNotice("双方连续停着：请点击盘上死子整组标记，再确认数目");
        playSound("message");
        return;
      }

      const reply = demoReply(position, boardSize);
      if (!reply) {
        setPositions((current) =>
          current.at(-1) === position ? [...current, applyPass(position)] : current,
        );
        resetMovedClock(demoColor);
        setRuleNotice(`${colorName(demoColor)}无可用演示应手，选择停一手`);
        return;
      }
      const next = applyLegalMove(position, reply.point, reply.result);
      setPositions((current) => (current.at(-1) === position ? [...current, next] : current));
      resetMovedClock(demoColor);
      setRuleNotice(
        `${colorName(demoColor)}演示应手 ${coordinate({ ...reply.point, color: demoColor }, boardSize)}${reply.result.captured ? `，提 ${reply.result.captured} 子` : ""}；轮到${colorName(userColor)}`,
      );
      playSound("stone");
    }, 650);
    return () => window.clearTimeout(timer);
  }, [boardSize, playSound, position, resetMovedClock, thinking, userColor]);

  function place(point: { x: number; y: number }) {
    if (gameOver || scoring || spectator) return;
    if (nextColor !== userColor) {
      setRuleNotice(`请等待${colorName(nextColor)}演示应手`);
      playSound("error");
      return;
    }
    const move = playMove({
      stones,
      size: boardSize,
      color: nextColor,
      point,
      forbiddenHash: position.hashes.at(-2),
    });
    if (!move.ok) {
      const messages = {
        occupied: "该交叉点已有棋子",
        "out-of-board": "落子超出棋盘",
        suicide: "禁入点：落子后本方无气，且不能提子",
        ko: "劫争：不能立即还原上一盘面",
      };
      setRuleNotice(messages[move.reason]);
      playSound("error");
      return;
    }
    setPositions((current) => [...current, applyLegalMove(position, point, move)]);
    resetMovedClock(nextColor);
    setRuleNotice(
      `${colorName(nextColor)}落子 ${coordinate({ ...point, color: nextColor }, boardSize)}${move.captured ? `，提 ${move.captured} 子` : ""}；${colorName(opposite(nextColor))}正在应手`,
    );
    playSound("stone");
  }

  function addMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("message") as HTMLInputElement;
    const text = input.value.trim();
    if (!text) return;
    setMessages((current) => [
      ...current,
      {
        time: formatSiteTime(),
        name: spectator ? "观战棋友" : "访客棋手",
        text,
      },
    ]);
    form.reset();
    playSound("message");
  }

  function addPrivateMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("message") as HTMLTextAreaElement;
    const text = input.value.trim();
    if (!text) return;
    setPrivateMessages((current) => [
      ...current,
      {
        name: spectator ? "观战棋友" : "访客棋手",
        time: formatSiteTime(),
        text,
      },
    ]);
    form.reset();
    playSound("message");
  }

  function pass() {
    if (scoring || nextColor !== userColor || thinking) return;
    const color = userColor;
    const next = applyPass(position);
    setPositions((current) => [...current, next]);
    resetMovedClock(color);
    setMessages((current) => [
      ...current,
      {
        time: "系统",
        name: "系统",
        text: `${color === "black" ? "黑方" : "白方"}选择停一手。`,
        system: true,
      },
    ]);
    if (next.consecutivePasses >= 2) {
      setDeadKeys(new Set());
      setScoring(true);
      setRuleNotice("双方连续停着：请点击盘上死子整组标记，再确认数目");
    } else {
      setRuleNotice(`${colorName(color)}停一手，等待${colorName(opposite(color))}确认`);
    }
    playSound("message");
  }

  function toggleDeadStone(point: GoPoint) {
    if (!scoring) return;
    const group = getGroupPoints(stones, boardSize, point);
    if (!group.length) {
      setRuleNotice("请点击需要标记为死子的棋块");
      playSound("error");
      return;
    }
    const keys = group.map(({ x, y }) => `${x},${y}`);
    const unmark = keys.every((key) => deadKeys.has(key));
    setDeadKeys((current) => {
      const next = new Set(current);
      keys.forEach((key) => (unmark ? next.delete(key) : next.add(key)));
      return next;
    });
    const stone = stones.find(({ x, y }) => x === point.x && y === point.y)!;
    setRuleNotice(`${unmark ? "取消" : "标记"}${colorName(stone.color)}死子 ${group.length} 枚`);
    playSound("message");
  }

  function confirmScore() {
    if (!scoring) return;
    const scoreWinner = scorePreview.winner;
    const removed = scoredPosition.removed.black + scoredPosition.removed.white;
    setWinnerColor(scoreWinner);
    setSgfResult(scoreWinner ? `${scoreWinner === "black" ? "B" : "W"}+${scorePreview.margin}` : "0");
    setResult(
      `终局确认：黑 ${scorePreview.black} ${scoreUnit}，白 ${scorePreview.white} ${scoreUnit}（含贴目 ${room?.komi ?? 7.5}）；${scoreWinner ? `${colorName(scoreWinner)}胜 ${scorePreview.margin} ${scoreUnit}` : "双方和棋"}。标记死子 ${removed} 枚。`,
    );
    setMessages((current) => [
      ...current,
      { time: "系统", name: "系统", text: `双方确认数目，终局移除死子 ${removed} 枚。`, system: true },
    ]);
    setPositions((current) => {
      const latest = current.at(-1)!;
      return [
        ...current.slice(0, -1),
        { ...latest, stones: scoredPosition.stones, captures: scoredPosition.captures },
      ];
    });
    setDeadKeys(new Set());
    setScoring(false);
    setGameOver(true);
    setPrivateOpen(false);
    setResultOpen(true);
    setRuleNotice("终局数目已确认，对局结束");
    playSound("success");
  }

  function resumePlay() {
    if (!scoring) return;
    setPositions((current) => {
      const latest = current.at(-1)!;
      return [...current.slice(0, -1), { ...latest, consecutivePasses: 0 }];
    });
    setDeadKeys(new Set());
    setScoring(false);
    setMessages((current) => [
      ...current,
      { time: "系统", name: "系统", text: "死子判定未达成一致，恢复行棋。", system: true },
    ]);
    setRuleNotice(`已恢复行棋，轮到${colorName(nextColor)}`);
    playSound("message");
  }

  function resign() {
    const resigned = userColor;
    const winning = resigned === "black" ? "white" : "black";
    setWinnerColor(winning);
    setResult(`${resigned === "black" ? "黑方" : "白方"}认输，${winning === "black" ? "黑方" : "白方"}胜`);
    setSgfResult(`${winning === "black" ? "B" : "W"}+R`);
    setGameOver(true);
    setPrivateOpen(false);
    setResultOpen(true);
    setRuleNotice("对局已因认输结束");
    playSound("success");
  }

  function requestUndo() {
    if (positions.length <= 1) {
      setRuleNotice("当前没有可以悔棋的着手");
      playSound("error");
      return;
    }
    const removeCount = nextColor === userColor ? Math.min(2, positions.length - 1) : 1;
    setPositions((current) => current.slice(0, -removeCount));
    const previous = positions.at(-(removeCount + 1))!;
    setMessages((current) => [
      ...current,
      {
        time: "系统",
        name: "系统",
        text: `${opponentName}已同意本地悔棋，回退 ${removeCount} 手；联网后将由对手确认。`,
        system: true,
      },
    ]);
    setRuleNotice(`已回退 ${removeCount} 手，轮到${colorName(previous.nextColor)}重新落子`);
    playSound("message");
  }

  function saveSgf() {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob(
        [
          buildSgf({
            appVersion: SITE_VERSION,
            size: boardSize,
            komi: room?.komi ?? 7.5,
            rules: room?.rules ?? "中国规则",
            timeControl: room?.timeControl ?? "20分+3×30秒",
            blackName,
            whiteName,
            result: sgfResult,
            moves,
          }),
        ],
        { type: "application/x-go-sgf" },
      ),
    );
    link.download = `围达网-${id}号棋局.sgf`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  return (
    <main className={styles.game}>
      <section className={styles.boardPanel}>
        <GoBoard
          stones={stones}
          size={boardSize}
          readOnly={spectator || gameOver}
          disabled={thinking}
          markDead={scoring}
          deadStoneKeys={deadKeys}
          onMove={place}
          onToggleDead={toggleDeadStone}
        />
        {scoring && (
          <div className={styles.scoringBar} role="status">
            <b>终局数目：</b>
            点击棋块整组标记死子　已标 {deadKeys.size} 子　盘面黑 {scorePreview.black} / 白{" "}
            {scorePreview.white}
          </div>
        )}
        <div className={styles.boardStatus} role="status">
          <b>
            {gameOver
              ? "对局结束"
              : spectator
                ? "观战模式"
                : scoring
                  ? "死子确认中"
                  : thinking
                    ? `${colorName(nextColor)}演示应手中…`
                    : `轮到${colorName(nextColor)}`}
            　·　{fresh ? "第" : "演示第"} {moves.length} 手
          </b>
          {!spectator && <span>{ruleNotice}</span>}
        </div>
        {resultOpen && (
          <div className={styles.resultDialog} role="dialog" aria-modal="true" aria-label="比赛结果">
            <header>
              <span>围达网 - 比赛结果</span>
              <button type="button" onClick={() => setResultOpen(false)} aria-label="关闭比赛结果" autoFocus>
                ×
              </button>
            </header>
            <div>
              <h1>{provisionalScore ? "盘面试算" : "比赛结束"}</h1>
              <p>{result}</p>
              {winnerColor && (
                <>
                  <hr />
                  <section>
                    <article>
                      <Avatar name={winner.name} variant={winner.variant} size="large" />
                      <p>
                        <em>{provisionalScore ? "试算领先" : "胜方"}</em>
                        <b>{winner.name}</b>
                        <span>
                          胜{winner.wins}　败{winner.losses}
                        </span>
                      </p>
                    </article>
                    <article>
                      <Avatar name={loser.name} variant={loser.variant} size="large" />
                      <p>
                        <em className={styles.loser}>{provisionalScore ? "试算落后" : "败方"}</em>
                        <b>{loser.name}</b>
                        <span>
                          胜{loser.wins}　败{loser.losses}
                        </span>
                      </p>
                    </article>
                  </section>
                </>
              )}
            </div>
          </div>
        )}
        {privateOpen && (
          <div
            className={styles.privateDialog}
            role="dialog"
            aria-modal="true"
            aria-label={`与${opponentName}对话`}
          >
            <header>
              与 {opponentName} 对话中
              <button type="button" onClick={() => setPrivateOpen(false)} aria-label="关闭私聊">
                ×
              </button>
            </header>
            <div className={styles.privateMessages}>
              {privateMessages.map((message, index) => (
                <p key={`${message.time}-${index}`}>
                  <b>
                    {message.name}　{message.time}
                  </b>
                  <br />
                  {message.text}
                </p>
              ))}
            </div>
            <form onSubmit={addPrivateMessage}>
              <textarea name="message" aria-label="私聊内容" maxLength={160} autoFocus />
              <button type="submit">发送</button>
            </form>
          </div>
        )}
      </section>

      <aside className={styles.sidebar}>
        <section className={styles.matchCard}>
          <div className={styles.gameMeta}>
            <b>
              {id}号对局室　{boardSize}路　{room?.rules ?? "中国规则"}
            </b>
            <span>
              黑贴{room?.komi ?? 7.5}目　{room?.timeControl ?? "20分+3×30秒"}
            </span>
          </div>
          <div className={styles.versus}>
            <article>
              <i className={styles.blackStone} />
              <Avatar name={blackName} variant={blackPlayer.variant} size="large" />
              <b>
                {blackName}
                <small>({blackPlayer.rank})</small>
              </b>
              {gameOver && winnerColor && !provisionalScore && (
                <span className={winnerColor === "black" ? styles.winSeal : styles.loseSeal}>
                  {winnerColor === "black" ? "胜" : "负"}
                </span>
              )}
            </article>
            <strong>VS</strong>
            <article>
              <i className={styles.whiteStone} />
              <Avatar name={whiteName} variant={whitePlayer.variant} size="large" />
              <b>
                {whiteName}
                <small>({whitePlayer.rank})</small>
              </b>
              {gameOver && winnerColor && !provisionalScore && (
                <span className={winnerColor === "white" ? styles.winSeal : styles.loseSeal}>
                  {winnerColor === "white" ? "胜" : "负"}
                </span>
              )}
            </article>
          </div>
          <div className={styles.clocks}>
            <span
              className={`${!gameOver && !scoring && nextColor === "black" ? styles.activeClock : ""} ${clocks.black.expired ? styles.expiredClock : ""}`}
            >
              <b>黑方</b>　{formatGameClock(clocks.black)}
            </span>
            <span
              className={`${!gameOver && !scoring && nextColor === "white" ? styles.activeClock : ""} ${clocks.white.expired ? styles.expiredClock : ""}`}
            >
              <b>白方</b>　{formatGameClock(clocks.white)}
            </span>
          </div>
          <div className={styles.ruleStats}>
            <span>黑提 {captures.black} 子</span>
            <span>白提 {captures.white} 子</span>
            <span>
              {scoring
                ? `死子 ${deadKeys.size} · 待确认`
                : position.consecutivePasses
                  ? `连续停着 ${position.consecutivePasses}`
                  : "禁自杀 · 简单劫"}
            </span>
          </div>
        </section>

        <section className={styles.messageCard}>
          <nav>
            <button
              type="button"
              className={tab === "moves" ? styles.activeTab : ""}
              onClick={() => setTab("moves")}
            >
              对局记录
            </button>
            <button
              type="button"
              className={tab === "chat" ? styles.activeTab : ""}
              onClick={() => setTab("chat")}
            >
              大厅消息
            </button>
          </nav>
          {tab === "chat" ? (
            <>
              <div className={styles.chatList} aria-live="polite">
                {messages.map((message, index) => (
                  <article key={`${message.time}-${index}`}>
                    <time>{message.time}</time>
                    <p>
                      <b>{message.name}：</b>
                      {message.text}
                    </p>
                  </article>
                ))}
              </div>
              <form className={styles.chatForm} onSubmit={addMessage}>
                <input name="message" aria-label="聊天内容" maxLength={80} placeholder="说点什么……" />
                <button type="submit">发送</button>
              </form>
            </>
          ) : (
            <div className={styles.moves} aria-live="polite">
              {moves.slice(-10).map((move, index) => (
                <p
                  key={`${moves.length - Math.min(10, moves.length) + index}-${coordinate(move, boardSize)}`}
                >
                  {fresh ? "第" : "演示第"} {moves.length - Math.min(10, moves.length) + index + 1} 手　
                  {move.color === "black" ? "黑" : "白"}　{coordinate(move, boardSize)}
                  {move.captured ? `　提${move.captured}子` : ""}
                </p>
              ))}
              {gameOver && <p>{result}</p>}
            </div>
          )}
        </section>

        <div className={styles.gameActions}>
          {!spectator &&
            !gameOver &&
            (scoring ? (
              <>
                <button type="button" onClick={confirmScore}>
                  确认数目
                </button>
                <button type="button" onClick={resumePlay}>
                  恢复行棋
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={pass} disabled={thinking}>
                  停一手
                </button>
                <button type="button" onClick={requestUndo} disabled={thinking || positions.length <= 1}>
                  请求悔棋
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("确定认输并结束本局吗？")) resign();
                  }}
                  disabled={thinking}
                >
                  认输
                </button>
              </>
            ))}
          {gameOver && !resultOpen && (
            <button
              type="button"
              onClick={() => {
                setPrivateOpen(false);
                setResultOpen(true);
              }}
            >
              查看比赛结果
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setResultOpen(false);
              setPrivateOpen(true);
            }}
          >
            和对手聊聊
          </button>
          <button type="button" onClick={saveSgf}>
            保存棋谱
          </button>
          <Link href="/hall">返回大厅</Link>
        </div>
      </aside>
    </main>
  );
}
