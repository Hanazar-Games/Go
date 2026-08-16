"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { hotGames, recentGames } from "@/data/mock";
import { MAX_PLAYER_QUERY_LENGTH, normalizePlayerQuery } from "@/lib/filters";
import { getGameSummaryHref } from "@/lib/game-data";
import styles from "@/components/portal/PortalPages.module.css";

const results = ["全部", "黑胜", "白胜", "进行中"];

export function GamesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlayer = normalizePlayerQuery(searchParams.get("player") ?? "");
  const initialBoard = ["9", "13", "19"].includes(searchParams.get("board") ?? "")
    ? (searchParams.get("board") ?? "全部")
    : "全部";
  const initialResult = results.includes(searchParams.get("result") ?? "")
    ? (searchParams.get("result") ?? "全部")
    : "全部";
  const [playerQuery, setPlayerQuery] = useState(initialPlayer);
  const [boardQuery, setBoardQuery] = useState(initialBoard);
  const [resultQuery, setResultQuery] = useState(initialResult);
  const normalizedPlayer = playerQuery.trim().toLocaleLowerCase("zh-CN");
  const games = [...hotGames, ...recentGames].filter((game) => {
    const matchesPlayer =
      !normalizedPlayer ||
      game.black.toLocaleLowerCase("zh-CN").includes(normalizedPlayer) ||
      game.white.toLocaleLowerCase("zh-CN").includes(normalizedPlayer);
    const matchesBoard = boardQuery === "全部" || game.boardSize === Number(boardQuery);
    const matchesResult =
      resultQuery === "全部" ||
      (resultQuery === "进行中" ? game.result === "进行中" : game.result.startsWith(resultQuery.slice(0, 1)));
    return matchesPlayer && matchesBoard && matchesResult;
  });

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const player = normalizePlayerQuery(playerQuery);
    setPlayerQuery(player);
    const query = new URLSearchParams();
    if (player) query.set("player", player);
    if (boardQuery !== "全部") query.set("board", boardQuery);
    if (resultQuery !== "全部") query.set("result", resultQuery);
    router.replace(query.size ? `/games?${query}` : "/games");
  }

  return (
    <main className={styles.page}>
      <div className={styles.title}>
        <b>围达棋谱大厅</b>
        <span>{playerQuery ? `棋手“${playerQuery}”的公开棋谱` : "自动保存的公开对局，可回放并下载 SGF"}</span>
      </div>
      <form className={styles.filters} onSubmit={submitFilters}>
        <label>
          棋手：
          <input
            name="player"
            value={playerQuery}
            onChange={(event) => setPlayerQuery(event.target.value)}
            maxLength={MAX_PLAYER_QUERY_LENGTH}
            placeholder="用户名"
          />
        </label>
        <label>
          棋盘：
          <select name="board" value={boardQuery} onChange={(event) => setBoardQuery(event.target.value)}>
            <option value="全部">全部</option>
            <option value="19">19×19</option>
            <option value="13">13×13</option>
            <option value="9">9×9</option>
          </select>
        </label>
        <label>
          结果：
          <select name="result" value={resultQuery} onChange={(event) => setResultQuery(event.target.value)}>
            {results.map((result) => (
              <option key={result}>{result}</option>
            ))}
          </select>
        </label>
        <button type="submit">查询棋谱</button>
      </form>
      <section className={styles.tablePanel}>
        <table>
          <thead>
            <tr>
              <th>棋谱号</th>
              <th>黑方</th>
              <th>白方</th>
              <th>棋盘</th>
              <th>结果</th>
              <th>手数</th>
              <th>观战</th>
              <th>结束时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr key={game.id}>
                <td>{game.id}</td>
                <td>
                  {game.black}（{game.blackRank}）
                </td>
                <td>
                  {game.white}（{game.whiteRank}）
                </td>
                <td>
                  {game.boardSize}×{game.boardSize}
                </td>
                <td>{game.result}</td>
                <td>{game.moves}</td>
                <td>{game.spectators}</td>
                <td>{game.finishedAt ?? "进行中"}</td>
                <td>
                  <Link href={getGameSummaryHref(game)}>{game.result === "进行中" ? "观战" : "回放"}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {games.length === 0 && <div className={styles.empty}>没有找到符合条件的公开棋谱。</div>}
      </section>
    </main>
  );
}
