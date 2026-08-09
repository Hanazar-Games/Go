"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { usePreferences } from "@/components/preferences/PreferencesProvider";
import { Avatar } from "@/components/ui/Avatar";
import { createEndgameStones, lobbyMessages, players } from "@/data/mock";
import type { BoardSize, ChatMessage, Room, Stone } from "@/types/site";
import { GoBoard } from "./GoBoard";
import styles from "./GameRoom.module.css";

interface GameMove {
  color: "black" | "white";
  x?: number;
  y?: number;
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
  if (move.x === undefined || move.y === undefined) return "Pass";
  return `${"ABCDEFGHJKLMNOPQRST"[move.x] ?? "?"}${move.y + 1}`;
}

function startingPosition(size: BoardSize, waiting: boolean) {
  if (waiting) return [];
  return createEndgameStones().filter(({ x, y }) => x < size && y < size);
}

export function GameRoom({ id, room, spectator = false }: { id: string; room?: Room; spectator?: boolean }) {
  const boardSize = room?.boardSize ?? 19;
  const finished = room?.status === "已结束" || id === "2371";
  const waiting = room?.status === "等待中";
  const { playSound } = usePreferences();
  const [stones, setStones] = useState<Stone[]>(() => startingPosition(boardSize, waiting));
  const [moves, setMoves] = useState<GameMove[]>(() =>
    startingPosition(boardSize, waiting).map(({ x, y, color }) => ({ x, y, color })),
  );
  const [nextColor, setNextColor] = useState<"black" | "white">("black");
  const [gameOver, setGameOver] = useState(finished);
  const [resultOpen, setResultOpen] = useState(finished);
  const [tab, setTab] = useState<"moves" | "chat">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>(lobbyMessages);
  const [privateOpen, setPrivateOpen] = useState(false);
  const [privateMessages, setPrivateMessages] = useState(() => (id === "2371" ? initialPrivateMessages : []));
  const [result, setResult] = useState(finished ? "白中盘胜" : "对局进行中");
  const [winnerColor, setWinnerColor] = useState<"black" | "white">("white");

  const blackName = room?.host ?? "俞晓旸";
  const whiteName = room?.guest ?? (waiting ? "等待对手" : "褚赢");
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
  const opponentName = id === "2371" ? blackName : (room?.guest ?? room?.host ?? "俞晓旸");

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

  function place(point: { x: number; y: number }) {
    if (gameOver || stones.some(({ x, y }) => x === point.x && y === point.y)) return;
    setStones((current) => [
      ...current.map((stone) => ({ ...stone, last: false })),
      { ...point, color: nextColor, last: true },
    ]);
    setMoves((current) => [...current, { ...point, color: nextColor }]);
    setNextColor((color) => (color === "black" ? "white" : "black"));
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
    const color = nextColor;
    setMoves((current) => [...current, { color }]);
    setNextColor((current) => (current === "black" ? "white" : "black"));
    setMessages((current) => [
      ...current,
      {
        time: "系统",
        name: "系统",
        text: `${color === "black" ? "黑方" : "白方"}选择停一手。`,
        system: true,
      },
    ]);
    playSound("message");
  }

  function resign() {
    const resigned = nextColor;
    const winning = resigned === "black" ? "white" : "black";
    setWinnerColor(winning);
    setResult(`${resigned === "black" ? "黑方" : "白方"}认输，${winning === "black" ? "黑方" : "白方"}胜`);
    setGameOver(true);
    setResultOpen(true);
    playSound("success");
  }

  function saveSgf() {
    const sgfMoves = moves
      .map(
        ({ x, y, color }) =>
          `;${color === "black" ? "B" : "W"}[${x === undefined || y === undefined ? "" : `${String.fromCharCode(97 + x)}${String.fromCharCode(97 + y)}`}]`,
      )
      .join("");
    const sgfResult = gameOver ? `${winnerColor === "black" ? "B" : "W"}+R` : "?";
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([`(;GM[1]FF[4]SZ[${boardSize}]PW[${whiteName}]PB[${blackName}]RE[${sgfResult}]${sgfMoves})`], {
        type: "application/x-go-sgf",
      }),
    );
    link.download = `围达网-${id}号棋局.sgf`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 0);
  }

  return (
    <main className={styles.game}>
      <section className={styles.boardPanel}>
        <GoBoard stones={stones} size={boardSize} readOnly={spectator || gameOver} onMove={place} />
        <div className={styles.boardStatus}>
          {gameOver ? result : spectator ? "观战模式" : `轮到${nextColor === "black" ? "黑方" : "白方"}`}
          　·　第 {moves.length} 手
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
              <h1>比赛结束</h1>
              <p>{result}</p>
              <hr />
              <section>
                <article>
                  <Avatar name={winner.name} variant={winner.variant} size="large" />
                  <p>
                    <em>胜方</em>
                    <b>{winner.name}</b>
                    <span>
                      胜{winner.wins}　败{winner.losses}
                    </span>
                  </p>
                </article>
                <article>
                  <Avatar name={loser.name} variant={loser.variant} size="large" />
                  <p>
                    <em className={styles.loser}>败方</em>
                    <b>{loser.name}</b>
                    <span>
                      胜{loser.wins}　败{loser.losses}
                    </span>
                  </p>
                </article>
              </section>
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
              {gameOver && (
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
              {gameOver && (
                <span className={winnerColor === "white" ? styles.winSeal : styles.loseSeal}>
                  {winnerColor === "white" ? "胜" : "负"}
                </span>
              )}
            </article>
          </div>
          <div className={styles.clocks}>
            <span>黑方　00:18:27</span>
            <span>白方　00:22:41</span>
          </div>
        </section>

        <section className={styles.messageCard}>
          <nav>
            <button
              type="button"
              className={tab === "moves" ? styles.activeTab : ""}
              onClick={() => setTab("moves")}
            >
              对局进程
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
              {moves.slice(-6).map((move, index) => (
                <p key={`${moves.length - 6 + index}-${coordinate(move)}`}>
                  第 {moves.length - Math.min(6, moves.length) + index + 1} 手　
                  {move.color === "black" ? "黑" : "白"}　{coordinate(move)}
                </p>
              ))}
              {gameOver && <p>{result}</p>}
            </div>
          )}
        </section>

        <div className={styles.gameActions}>
          {!spectator && !gameOver && (
            <>
              <button type="button" onClick={pass}>
                停一手
              </button>
              <button
                type="button"
                onClick={() =>
                  setMessages((current) => [
                    ...current,
                    { time: "系统", name: "系统", text: "已发送悔棋请求。", system: true },
                  ])
                }
              >
                请求悔棋
              </button>
              <button
                type="button"
                onClick={() => {
                  resign();
                }}
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
