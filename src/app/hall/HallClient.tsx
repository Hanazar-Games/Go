"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { usePreferences } from "@/components/preferences/PreferencesProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Panel } from "@/components/ui/Panel";
import { announcements } from "@/data/mock";
import { filterPlayers, filterRooms } from "@/lib/filters";
import type { BoardSize, ChatMessage, Player, PlayerStatus, Room, RoomStatus } from "@/types/site";
import styles from "./hall.module.css";

const playerStatuses: Array<PlayerStatus | "全部"> = ["全部", "空闲", "对局中", "观战", "匹配中"];
const initialHallMessages: ChatMessage[] = [
  { time: "11:52:13", name: "系统", text: "欢迎进入围达对弈大厅，请文明交流。", system: true },
  { time: "11:52:20", name: "周慢慢", text: "有没有 5K 左右的棋友下一盘？" },
];

function roomHref(room: Room) {
  if (room.status === "等待中") return `/game/${room.id}`;
  if (room.status === "已结束") return `/game-record/${room.id}`;
  if (!room.allowSpectators) return null;
  return `/watch/${room.id}`;
}

export function HallClient({
  initialPlayers,
  initialRooms,
}: {
  initialPlayers: Player[];
  initialRooms: Room[];
}) {
  const router = useRouter();
  const { preferences, playSound } = usePreferences();
  const [rooms, setRooms] = useState(initialRooms);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus | "全部">("全部");
  const [playerQuery, setPlayerQuery] = useState("");
  const [roomStatus, setRoomStatus] = useState<RoomStatus | "全部">("全部");
  const [boardSize, setBoardSize] = useState<BoardSize | "全部">("全部");
  const [selectedPlayer, setSelectedPlayer] = useState(initialPlayers[0]?.username ?? "");
  const [selectedRoom, setSelectedRoom] = useState(initialRooms[0]?.id ?? 0);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState("");
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [matchSeconds, setMatchSeconds] = useState<number | null>(null);
  const [hallMessages, setHallMessages] = useState(initialHallMessages);

  const visiblePlayers = useMemo(
    () => filterPlayers(initialPlayers, playerQuery, playerStatus),
    [initialPlayers, playerQuery, playerStatus],
  );
  const visibleRooms = useMemo(
    () => filterRooms(rooms, roomStatus, boardSize),
    [rooms, roomStatus, boardSize],
  );
  const player = visiblePlayers.find(({ username }) => username === selectedPlayer) ?? visiblePlayers[0];
  const room = visibleRooms.find(({ id }) => id === selectedRoom) ?? visibleRooms[0];
  const displayedNotice =
    matchSeconds !== null && matchSeconds >= 5
      ? "匹配成功：若无一切心（2D），正在进入 2388 号对局室……"
      : notice;

  useEffect(() => {
    if (matchSeconds === null) return;
    if (matchSeconds >= 5) {
      if (matchSeconds === 5) playSound("success");
      const redirect = window.setTimeout(() => router.push("/game/2388"), 900);
      return () => window.clearTimeout(redirect);
    }
    const timer = window.setTimeout(() => setMatchSeconds((value) => (value ?? 0) + 1), 1000);
    return () => window.clearTimeout(timer);
  }, [matchSeconds, playSound, router]);

  useEffect(() => {
    if (!createOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !creating) setCreateOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [createOpen, creating]);

  async function submitRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          boardSize: Number(form.get("boardSize")),
          rules: form.get("rules"),
          komi: Number(form.get("komi")),
          mainTime: Number(form.get("mainTime")),
          byoyomi: Number(form.get("byoyomi")),
          isPrivate: form.get("isPrivate") === "on",
          allowSpectators: form.get("allowSpectators") === "on",
        }),
      });
      const payload = (await response.json()) as { room?: Room; error?: string };
      if (!response.ok || !payload.room) {
        playSound("error");
        setNotice(payload.error ?? "创建房间失败");
        return;
      }
      setRooms((current) => [payload.room as Room, ...current]);
      setSelectedRoom(payload.room.id);
      setCreateOpen(false);
      setNotice(`${payload.room.id} 号房间已创建，正在等待对手。`);
      playSound("success");
    } catch {
      playSound("error");
      setNotice("网络连接失败，房间未创建，请稍后重试。");
    } finally {
      setCreating(false);
    }
  }

  function toggleFollow(username: string) {
    const adding = !followed.has(username);
    setFollowed((current) => {
      const next = new Set(current);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
    setNotice(`${adding ? "已关注" : "已取消关注"} ${username}（仅本次浏览，登录后可同步）。`);
  }

  async function copyRoomId(id: number) {
    const text = String(id);
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const field = document.createElement("textarea");
        field.value = text;
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.append(field);
        field.select();
        const copied = document.execCommand("copy");
        field.remove();
        if (!copied) throw new Error("copy failed");
      }
      setNotice(`已复制房号 ${id}。`);
      playSound("message");
    } catch {
      setNotice(`浏览器禁止自动复制，请手动记录房号 ${id}。`);
      playSound("error");
    }
  }

  function sendHallMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("hallMessage") as HTMLInputElement;
    const text = input.value.trim();
    if (!text) return;
    setHallMessages((current) => [
      ...current,
      { time: new Date().toLocaleTimeString("zh-CN", { hour12: false }), name: "访客棋手", text },
    ]);
    form.reset();
    setNotice("消息已加入本地大厅记录；账号服务接入后才会同步给其他棋友。");
    playSound("message");
  }

  return (
    <main className={styles.hall}>
      <div className={styles.hallTitle}>
        <b>围达对弈大厅</b>
        <span>
          大厅一区　在线 {initialPlayers.length} 人　开放房间 {rooms.length} 间
        </span>
        <button type="button" onClick={() => router.refresh()}>
          刷新列表
        </button>
      </div>

      {displayedNotice && (
        <div className={styles.notice} role="status">
          <b>系统：</b>
          {displayedNotice}
          <button type="button" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}

      <div className={styles.layout}>
        <aside className={styles.playersColumn}>
          <Panel title="在线棋友" action={<span>{visiblePlayers.length} 人</span>}>
            <div className={styles.playerFilters}>
              <input
                aria-label="搜索棋友"
                value={playerQuery}
                onChange={(event) => setPlayerQuery(event.target.value)}
                placeholder="输入用户名"
              />
              <select
                aria-label="棋友状态"
                value={playerStatus}
                onChange={(event) => setPlayerStatus(event.target.value as PlayerStatus | "全部")}
              >
                {playerStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className={styles.playersList}>
              {visiblePlayers.map((item) => (
                <button
                  className={player?.username === item.username ? styles.selectedPlayer : ""}
                  type="button"
                  onClick={() => setSelectedPlayer(item.username)}
                  key={item.username}
                >
                  <Avatar
                    name={item.username}
                    size="small"
                    variant={item.username === "褚赢" ? "warrior" : "person"}
                  />
                  <span>
                    <b>{item.username}</b>
                    <small>
                      {item.rank}　胜率 {item.winRate}%
                    </small>
                  </span>
                  <i className={styles[`status${item.status}`]}>{item.status}</i>
                </button>
              ))}
              {visiblePlayers.length === 0 && <p className={styles.emptyList}>没有符合条件的棋友</p>}
            </div>
          </Panel>

          {player && (
            <section className={styles.playerDetail}>
              <Avatar name={player.username} variant={player.username === "褚赢" ? "warrior" : "person"} />
              <div>
                <b>
                  {player.username}（{player.rank}）
                </b>
                <span>Rating {player.rating}</span>
                <span>
                  {player.wins}胜 {player.losses}负　连胜 {player.streak}
                </span>
              </div>
              <div className={styles.playerActions}>
                <Link href={`/players/${encodeURIComponent(player.username)}`}>查看资料</Link>
                {preferences.allowChallenges ? (
                  <Link href={`/match?opponent=${encodeURIComponent(player.username)}`}>挑战</Link>
                ) : (
                  <button type="button" disabled title="可在设置中重新开启">
                    挑战已关闭
                  </button>
                )}
                <button type="button" onClick={() => toggleFollow(player.username)}>
                  {followed.has(player.username) ? "取消关注" : "关注"}
                </button>
                <Link href={`/games?player=${encodeURIComponent(player.username)}`}>查看棋谱</Link>
              </div>
            </section>
          )}
        </aside>

        <section className={styles.roomsColumn}>
          <Panel title="房间 / 对局列表" action={<span>双击房间或使用下方按钮进入</span>}>
            <div className={styles.roomTools}>
              <label>
                状态：
                <select
                  value={roomStatus}
                  onChange={(event) => setRoomStatus(event.target.value as RoomStatus | "全部")}
                >
                  <option>全部</option>
                  <option>等待中</option>
                  <option>对局中</option>
                  <option>已结束</option>
                </select>
              </label>
              <label>
                棋盘：
                <select
                  value={boardSize}
                  onChange={(event) =>
                    setBoardSize(
                      event.target.value === "全部" ? "全部" : (Number(event.target.value) as BoardSize),
                    )
                  }
                >
                  <option>全部</option>
                  <option value="19">19×19</option>
                  <option value="13">13×13</option>
                  <option value="9">9×9</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => {
                  setRoomStatus("全部");
                  setBoardSize("全部");
                }}
              >
                清除筛选
              </button>
              <span>找到 {visibleRooms.length} 个房间</span>
            </div>
            <div className={styles.roomTableWrap}>
              <table className={styles.roomTable}>
                <thead>
                  <tr>
                    <th>房号</th>
                    <th>黑方 / 房主</th>
                    <th>白方 / 对手</th>
                    <th>棋盘</th>
                    <th>规则</th>
                    <th>时间</th>
                    <th>状态</th>
                    <th>观战</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRooms.map((item) => (
                    <tr
                      className={room?.id === item.id ? styles.selectedRoom : ""}
                      key={item.id}
                      onDoubleClick={() => {
                        const href = roomHref(item);
                        if (href) router.push(href);
                        else setNotice(`${item.id} 号房间未开放观战。`);
                      }}
                    >
                      <td>
                        <button type="button" onClick={() => setSelectedRoom(item.id)}>
                          {item.isPrivate ? "[密]" : ""}
                          {item.id}
                        </button>
                      </td>
                      <td>
                        {item.host}
                        <small>{item.hostRank}</small>
                      </td>
                      <td>
                        {item.guest ?? "—— 等待加入 ——"}
                        <small>{item.guestRank ?? ""}</small>
                      </td>
                      <td>
                        {item.boardSize}×{item.boardSize}
                      </td>
                      <td>{item.rules.replace("规则", "")}</td>
                      <td>{item.timeControl}</td>
                      <td>
                        <b className={styles[`room${item.status}`]}>{item.status}</b>
                      </td>
                      <td>{item.allowSpectators ? item.spectators : "禁"}</td>
                    </tr>
                  ))}
                  {visibleRooms.length === 0 && (
                    <tr>
                      <td className={styles.emptyTable} colSpan={8}>
                        没有符合条件的房间
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          {room && (
            <section className={styles.roomDetail}>
              <div>
                <b>{room.id} 号对局室</b>
                <span>
                  {room.boardSize}×{room.boardSize}　{room.rules}　贴 {room.komi} 目　{room.timeControl}　
                  {room.allowSpectators ? "允许观战" : "谢绝观战"}
                </span>
              </div>
              <div className={styles.roomPlayers}>
                <span>
                  ● 黑方　{room.host}（{room.hostRank}）
                </span>
                <span>○ 白方　{room.guest ? `${room.guest}（${room.guestRank}）` : "等待棋手加入"}</span>
              </div>
              <div className={styles.roomActions}>
                {room.status === "等待中" ? (
                  <Link href={`/game/${room.id}`}>加入对局</Link>
                ) : room.status === "已结束" ? (
                  <Link href={`/game-record/${room.id}`}>查看棋谱</Link>
                ) : !room.allowSpectators ? (
                  <button type="button" disabled>
                    禁止观战
                  </button>
                ) : (
                  <Link href={`/watch/${room.id}`}>进入观战</Link>
                )}
                <button type="button" onClick={() => void copyRoomId(room.id)}>
                  复制房号
                </button>
              </div>
            </section>
          )}

          <div className={styles.hallChat}>
            <div className={styles.hallChatMessages} aria-live="polite">
              {hallMessages.map((message, index) => (
                <p key={`${message.time}-${index}`}>
                  <b>
                    {message.time}　{message.name}：
                  </b>
                  {message.text}
                </p>
              ))}
            </div>
            <form onSubmit={sendHallMessage}>
              <input
                name="hallMessage"
                aria-label="大厅发言"
                maxLength={80}
                placeholder="大厅发言（本地体验）"
              />
              <button type="submit">发送</button>
            </form>
          </div>
        </section>

        <aside className={styles.sideColumn}>
          <Panel title="快速匹配">
            <div className={styles.matchBox}>
              <p>预计棋力：7K—1D</p>
              <p>规则：中国规则 / 19路</p>
              {matchSeconds === null ? (
                <button
                  type="button"
                  onClick={() => {
                    setMatchSeconds(0);
                    setNotice("正在寻找水平相近的对手……");
                  }}
                >
                  开始快速对弈
                </button>
              ) : (
                <>
                  <strong>正在寻找对手……</strong>
                  <em>{matchSeconds} 秒</em>
                  <button
                    type="button"
                    onClick={() => {
                      setMatchSeconds(null);
                      setNotice("已取消匹配。等待越久，搜索范围越大。 ");
                    }}
                  >
                    取消匹配
                  </button>
                </>
              )}
            </div>
          </Panel>
          <Panel title="创建棋局">
            <div className={styles.createBox}>
              <p>自定义棋盘、规则、贴目和时间。</p>
              <button type="button" onClick={() => setCreateOpen(true)}>
                创建新房间
              </button>
            </div>
          </Panel>
          <Panel title="大厅公告">
            <ul className={styles.announcements}>
              {announcements.slice(0, 3).map((item) => (
                <li key={item.text}>
                  <b>【{item.type}】</b>
                  {item.text}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="大厅排行">
            <ol className={styles.miniRanking}>
              {initialPlayers.slice(0, 6).map((item, index) => (
                <li key={item.username}>
                  <i>{index + 1}</i>
                  <span>{item.username}</span>
                  <b>{item.rank}</b>
                  <em>{item.rating}</em>
                </li>
              ))}
            </ol>
          </Panel>
        </aside>
      </div>

      {createOpen && (
        <div className={styles.modalBackdrop}>
          <form
            className={styles.createDialog}
            onSubmit={submitRoom}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-room-title"
            aria-busy={creating}
          >
            <header>
              <span id="create-room-title">创建新的对局室</span>
              <button type="button" onClick={() => setCreateOpen(false)}>
                ×
              </button>
            </header>
            <fieldset>
              <legend>棋局设置</legend>
              <label>
                棋盘尺寸：
                <select name="boardSize" defaultValue={preferences.boardSize} autoFocus>
                  <option value="19">19×19</option>
                  <option value="13">13×13</option>
                  <option value="9">9×9</option>
                </select>
              </label>
              <label>
                规则：
                <select name="rules" defaultValue={preferences.rules}>
                  <option>中国规则</option>
                  <option>日本规则</option>
                </select>
              </label>
              <label>
                贴目：
                <select name="komi" defaultValue="7.5">
                  <option value="7.5">黑贴 7.5 目</option>
                  <option value="6.5">黑贴 6.5 目</option>
                  <option value="0">不贴目</option>
                </select>
              </label>
            </fieldset>
            <fieldset>
              <legend>用时设置</legend>
              <label>
                主时间：
                <select name="mainTime" defaultValue="20">
                  <option value="60">60 分钟</option>
                  <option value="30">30 分钟</option>
                  <option value="20">20 分钟</option>
                  <option value="10">10 分钟</option>
                  <option value="0">不限时</option>
                </select>
              </label>
              <label>
                读秒：
                <select name="byoyomi" defaultValue="30">
                  <option value="60">60 秒</option>
                  <option value="30">30 秒</option>
                  <option value="20">20 秒</option>
                  <option value="10">10 秒</option>
                </select>
              </label>
            </fieldset>
            <div className={styles.checks}>
              <label>
                <input type="checkbox" name="isPrivate" />
                私人房间
              </label>
              <label>
                <input type="checkbox" name="allowSpectators" defaultChecked />
                允许观战
              </label>
            </div>
            <footer>
              <button type="button" onClick={() => setCreateOpen(false)}>
                取消
              </button>
              <button type="submit" disabled={creating}>
                {creating ? "创建中……" : "创建房间"}
              </button>
            </footer>
          </form>
        </div>
      )}
    </main>
  );
}
