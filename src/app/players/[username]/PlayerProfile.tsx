"use client";

import Link from "next/link";
import { useState } from "react";
import { usePreferences } from "@/components/preferences/PreferencesProvider";
import { Avatar } from "@/components/ui/Avatar";
import type { Player } from "@/types/site";
import styles from "./profile.module.css";

const games = [
  { id: 2371, opponent: "Akira", date: "2004-01-04", result: "胜" },
  { id: 2368, opponent: "Akira", date: "2004-01-03", result: "胜" },
  { id: 2367, opponent: "天机手", date: "2004-01-03", result: "胜" },
  { id: 2365, opponent: "万里孤山走", date: "2004-01-03", result: "胜" },
  { id: 2361, opponent: "俞晓旸", date: "2004-01-02", result: "胜" },
];

function MiniBoard({ index }: { index: number }) {
  const points = [
    [
      [16, 16],
      [72, 68],
      [82, 18],
    ],
    [
      [22, 34],
      [80, 16],
      [76, 70],
    ],
    [
      [18, 72],
      [47, 38],
      [82, 17],
    ],
    [
      [20, 20],
      [46, 63],
      [81, 22],
    ],
    [
      [16, 20],
      [50, 48],
      [82, 72],
    ],
  ][index];
  return (
    <span className={styles.miniBoard}>
      {points.map(([x, y], point) => (
        <i
          className={point % 2 ? styles.whiteDot : ""}
          style={{ left: `${x}%`, top: `${y}%` }}
          key={`${x}-${y}`}
        />
      ))}
    </span>
  );
}

export function PlayerProfile({ player }: { player: Player }) {
  const { preferences } = usePreferences();
  const [followed, setFollowed] = useState(false);
  const [notice, setNotice] = useState("");
  return (
    <main className={styles.page}>
      <div className={styles.ribbon}>{player.username}的主页</div>
      {notice && (
        <div className={styles.notice} role="status">
          {notice}
          <button type="button" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}
      <section className={styles.profile}>
        <Avatar
          name={player.username}
          variant={player.username === "褚赢" ? "warrior" : "person"}
          size="large"
        />
        <h1>{player.username}</h1>
        <p className={styles.motto}>{player.username === "褚赢" ? "你是我的眼" : "手谈一局，以棋会友"}</p>
        <dl>
          <div>
            <dt>UID：</dt>
            <dd>WD{10028 + player.rating}</dd>
          </div>
          <div>
            <dt>注册时间：</dt>
            <dd>2003-10-28</dd>
          </div>
          <div>
            <dt>当前段位：</dt>
            <dd>{player.rank}</dd>
          </div>
          <div>
            <dt>Rating：</dt>
            <dd>{player.rating}</dd>
          </div>
          <div>
            <dt>最高段位：</dt>
            <dd>{player.rank}</dd>
          </div>
          <div>
            <dt>常用棋盘：</dt>
            <dd>19×19</dd>
          </div>
          <div>
            <dt>我的战绩：</dt>
            <dd>
              {player.wins + player.losses}场 {player.wins}胜 {player.losses}败
            </dd>
          </div>
          <div>
            <dt>当前状态：</dt>
            <dd>{player.status}</dd>
          </div>
        </dl>
      </section>
      <section className={styles.history}>
        <h2>最近棋局：</h2>
        <div>
          {games.map((game, index) => (
            <Link href={`/game-record/${game.id}`} key={game.id}>
              <MiniBoard index={index} />
              <b>对手：{game.opponent}</b>
              <span>
                {game.date}　{game.result}
              </span>
            </Link>
          ))}
        </div>
      </section>
      <div className={styles.actions}>
        <button
          type="button"
          onClick={() => {
            setFollowed((value) => !value);
            setNotice(`${followed ? "已取消关注" : "已关注"} ${player.username}（仅本次浏览，登录后可同步）`);
          }}
        >
          {followed ? "取消关注" : "关注棋手"}
        </button>
        {preferences.allowChallenges ? (
          <Link href={`/match?opponent=${encodeURIComponent(player.username)}`}>向他挑战</Link>
        ) : (
          <button type="button" disabled title="可在设置中重新开启">
            挑战已关闭
          </button>
        )}
        <Link href={`/games?player=${encodeURIComponent(player.username)}`}>查看全部棋谱</Link>
      </div>
    </main>
  );
}
