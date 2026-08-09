"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { usePreferences } from "@/components/preferences/PreferencesProvider";
import { Avatar } from "@/components/ui/Avatar";
import { createEndgameStones, lobbyMessages, players } from "@/data/mock";
import {
  boardHash,
  playMove,
  scorePosition,
  type CaptureTally,
  type GoColor,
  type GoPoint,
  type PlayResult,
} from "@/lib/go-engine";
import { SITE_VERSION } from "@/lib/release";
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

function coordinate(move: GameMove) {
  if (move.x === undefined || move.y === undefined) return "停一手";
  return `${"ABCDEFGHJKLMNOPQRST"[move.x] ?? "?"}${move.y + 1}`;
}

const opposite = (color: GoColor): GoColor => (color === "black" ? "white" : "black");
const colorName = (color: GoColor) => (color === "black" ? "黑方" : "白方");

function startingPosition(size: BoardSize, fresh: boolean) {
  if (fresh) {
    const starLine = size === 9 ? 2 : 3;
    return [{ x: size - 1 - starLine, y: starLine, color: "black", last: true } satisfies Stone];
  }
  return createEndgameStones().filter(({ x, y }) => x < size && y < size);
}

function createInitialPosition(size: BoardSize, fresh: boolean): PositionState {
  const stones = startingPosition(size, fresh);
  const hash = boardHash(stones, size);
  return {
    stones,
    moves: stones.map(({ x, y, color }) => ({ x, y, color })),
    nextColor: fresh ? "white" : "black",
    captures: { black: 0, white: 0 },
    consecutivePasses: 0,
    hashes: fresh ? [boardHash([], size), hash] : [hash],
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

function initialClock(timeControl?: string) {
  const minutes = Number(timeControl?.match(/^(\d+)分/)?.[1] ?? 20);
  return Number.isFinite(minutes) ? minutes * 60 : 20 * 60;
}

function formatClock(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function GameRoom({
  id,
  room,
  spectator = false,
  fresh = false,
}: {
  id: string;
  room?: Room;
  spectator?: boolean;
  fresh?: boolean;
}) {
  const boardSize = room?.boardSize ?? 19;
  const finished = room?.status === "已结束" || id === "2371";
  const waiting = room?.status === "等待中";
  const { playSound } = usePreferences();
  const [positions, setPositions] = useState<PositionState[]>(() => [createInitialPosition(boardSize, fresh)]);
  const position = positions.at(-1)!;
  const { stones, moves, nextColor, captures } = position;
  const [gameOver, setGameOver] = useState(finished);
  const [resultOpen, setResultOpen] = useState(finished);
  const [tab, setTab] = useState<"moves" | "chat">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>(lobbyMessages);
  const [privateOpen, setPrivateOpen] = useState(false);
  const [privateMessages, setPrivateMessages] = useState(() => (id === "2371" ? initialPrivateMessages : []));
  const [result, setResult] = useState(finished ? "白中盘胜" : "对局进行中");
  const [winnerColor, setWinnerColor] = useState<GoColor | null>(finished ? "white" : null);
  const [sgfResult, setSgfResult] = useState(finished ? "W+R" : "?");
  const [ruleNotice, setRuleNotice] = useState(fresh ? "白方（访客棋手）请落子" : "棋局资料已载入");
  const startingSeconds = initialClock(room?.timeControl);
  const [clocks, setClocks] = useState({ black: startingSeconds, white: startingSeconds });

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
  const opponentName = id === "2371" || (waiting && fresh) ? blackName : (room?.guest ?? room?.host ?? "俞晓旸");
  const userColor: GoColor = fresh ? "white" : "black";
  const thinking = fresh && !spectator && !gameOver && nextColor !== userColor;
  const provisionalScore = position.consecutivePasses >= 2;

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
    if (spectator || gameOver || !fresh) return;
    const timer = window.setInterval(() => {
      setClocks((current) => ({ ...current, [nextColor]: Math.max(0, current[nextColor] - 1) }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [fresh, gameOver, nextColor, spectator]);

  useEffect(() => {
    if (!thinking) return;
    const timer = window.setTimeout(() => {
      if (position.consecutivePasses === 1) {
        const next = applyPass(position);
        const rules = room?.rules ?? "中国规则";
        const komi = room?.komi ?? 7.5;
        const score = scorePosition(next.stones, boardSize, rules, komi, next.captures);
        const scoreWinner = score.winner;
        setPositions((current) => (current.at(-1) === position ? [...current, next] : current));
        setMessages((current) => [
          ...current,
          { time: "系统", name: "系统", text: "黑方同意停一手，进入本地数目试算。", system: true },
        ]);
        setWinnerColor(scoreWinner);
        setSgfResult(scoreWinner ? `${scoreWinner === "black" ? "B" : "W"}+${score.margin}` : "0");
        setResult(
          `本地试算：黑 ${score.black} 点，白 ${score.white} 点（含贴目 ${komi}）；${scoreWinner ? `${colorName(scoreWinner)}领先 ${score.margin} 点` : "双方同分"}。死子尚待双方确认。`,
        );
        setGameOver(true);
        setResultOpen(true);
        setRuleNotice("试算完成：正式结果需双方确认死子");
        playSound("success");
        return;
      }

      const reply = demoReply(position, boardSize);
      if (!reply) {
        setPositions((current) => (current.at(-1) === position ? [...current, applyPass(position)] : current));
        setRuleNotice("黑方无可用演示应手，选择停一手");
        return;
      }
      const next = applyLegalMove(position, reply.point, reply.result);
      setPositions((current) => (current.at(-1) === position ? [...current, next] : current));
      setRuleNotice(
        `黑方演示应手 ${coordinate({ ...reply.point, color: "black" })}${reply.result.captured ? `，提 ${reply.result.captured} 子` : ""}；轮到白方`,
      );
      playSound("stone");
    }, 650);
    return () => window.clearTimeout(timer);
  }, [boardSize, playSound, position, room?.komi, room?.rules, thinking]);

  function place(point: { x: number; y: number }) {
    if (gameOver || spectator) return;
    if (nextColor !== userColor) {
      setRuleNotice("请等待黑方演示应手");
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
    setRuleNotice(
      `${colorName(nextColor)}落子 ${coordinate({ ...point, color: nextColor })}${move.captured ? `，提 ${move.captured} 子` : ""}；黑方正在应手`,
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
        time: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
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
        time: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
        text,
      },
    ]);
    form.reset();
    playSound("message");
  }

  function pass() {
    if (nextColor !== userColor || thinking) return;
    const color = userColor;
    setPositions((current) => [...current, applyPass(position)]);
    setMessages((current) => [
      ...current,
      {
        time: "系统",
        name: "系统",
        text: `${color === "black" ? "黑方" : "白方"}选择停一手。`,
        system: true,
      },
    ]);
    setRuleNotice(`${colorName(color)}停一手，等待黑方确认`);
    playSound("message");
  }

  function resign() {
    const resigned = userColor;
    const winning = resigned === "black" ? "white" : "black";
    setWinnerColor(winning);
    setResult(`${resigned === "black" ? "黑方" : "白方"}认输，${winning === "black" ? "黑方" : "白方"}胜`);
    setSgfResult(`${winning === "black" ? "B" : "W"}+R`);
    setGameOver(true);
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
    setMessages((current) => [
      ...current,
      {
        time: "系统",
        name: "系统",
        text: `黑方已同意本地悔棋，回退 ${removeCount} 手；联网后将由对手确认。`,
        system: true,
      },
    ]);
    setRuleNotice(`已回退 ${removeCount} 手，轮到白方重新落子`);
    playSound("message");
  }

  function saveSgf() {
    const sgfMoves = moves
      .map(
        ({ x, y, color }) =>
          `;${color === "black" ? "B" : "W"}[${x === undefined || y === undefined ? "" : `${String.fromCharCode(97 + x)}${String.fromCharCode(97 + y)}`}]`,
      )
      .join("");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob(
        [
          `(;GM[1]FF[4]CA[UTF-8]AP[Weida:${SITE_VERSION}]SZ[${boardSize}]KM[${room?.komi ?? 7.5}]RU[${room?.rules ?? "中国规则"}]PW[${whiteName}]PB[${blackName}]RE[${sgfResult}]${sgfMoves})`,
        ],
        { type: "application/x-go-sgf" },
      ),
    );
    link.download = `围达网-${id}号棋局.sgf`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 0);
  }

  return (
    <main className={styles.game}>
      <section className={styles.boardPanel}>
        <GoBoard
          stones={stones}
          size={boardSize}
          readOnly={spectator || gameOver}
          disabled={thinking}
          onMove={place}
        />
        <div className={styles.boardStatus} role="status">
          <b>
            {gameOver ? "对局结束" : spectator ? "观战模式" : thinking ? "黑方演示应手中…" : `轮到${colorName(nextColor)}`}
            　·　第 {moves.length} 手
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
          <div>
            {id}号对局室　{room?.rules ?? "中国规则"}　黑贴{room?.komi ?? 7.5}目
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
            <span className={!gameOver && nextColor === "black" ? styles.activeClock : ""}>
              黑方　{formatClock(clocks.black)}
            </span>
            <span className={!gameOver && nextColor === "white" ? styles.activeClock : ""}>
              白方　{formatClock(clocks.white)}
            </span>
          </div>
          <div className={styles.ruleStats}>
            <span>黑提 {captures.black} 子</span>
            <span>白提 {captures.white} 子</span>
            <span>{position.consecutivePasses ? `连续停着 ${position.consecutivePasses}` : "禁自杀 · 简单劫"}</span>
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
                <p key={`${moves.length - Math.min(10, moves.length) + index}-${coordinate(move)}`}>
                  第 {moves.length - Math.min(10, moves.length) + index + 1} 手　
                  {move.color === "black" ? "黑" : "白"}　{coordinate(move)}
                  {move.captured ? `　提${move.captured}子` : ""}
                </p>
              ))}
              {gameOver && <p>{result}</p>}
            </div>
          )}
        </section>

        <div className={styles.gameActions}>
          {!spectator && !gameOver && (
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
          )}
          <button type="button" onClick={() => setPrivateOpen(true)}>
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
