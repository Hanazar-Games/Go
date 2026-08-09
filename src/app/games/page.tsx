import type { Metadata } from "next";
import Link from "next/link";
import { hotGames, recentGames } from "@/data/mock";
import styles from "@/components/portal/PortalPages.module.css";

export const metadata: Metadata = { title: "棋谱大厅" };

export default async function GamesPage({ searchParams }: PageProps<"/games">) {
  const { player, board, result } = await searchParams;
  const playerQuery = typeof player === "string" ? player.trim() : "";
  const boardQuery = typeof board === "string" && ["9", "13", "19"].includes(board) ? Number(board) : null;
  const resultQuery =
    typeof result === "string" && ["全部", "黑胜", "白胜", "进行中"].includes(result) ? result : "全部";
  const games = [...hotGames, ...recentGames].filter((game) => {
    const matchesPlayer =
      !playerQuery || game.black.includes(playerQuery) || game.white.includes(playerQuery);
    const matchesBoard = boardQuery === null || game.boardSize === boardQuery;
    const matchesResult =
      resultQuery === "全部" ||
      (resultQuery === "进行中" ? game.result === "进行中" : game.result.startsWith(resultQuery.slice(0, 1)));
    return matchesPlayer && matchesBoard && matchesResult;
  });
  return (
    <main className={styles.page}>
      <div className={styles.title}>
        <b>围达棋谱大厅</b>
        <span>{playerQuery ? `棋手“${playerQuery}”的公开棋谱` : "自动保存的公开对局，可回放并下载 SGF"}</span>
      </div>
      <form action="/games" className={styles.filters}>
        <label>
          棋手：
          <input name="player" defaultValue={playerQuery} placeholder="用户名" />
        </label>
        <label>
          棋盘：
          <select name="board" defaultValue={boardQuery?.toString() ?? "全部"}>
            <option value="全部">全部</option>
            <option value="19">19×19</option>
            <option value="13">13×13</option>
            <option value="9">9×9</option>
          </select>
        </label>
        <label>
          结果：
          <select name="result" defaultValue={resultQuery}>
            <option>全部</option>
            <option>黑胜</option>
            <option>白胜</option>
            <option>进行中</option>
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
                  {game.result === "进行中" ? (
                    <Link href={`/watch/${game.id}`}>观战</Link>
                  ) : (
                    <Link href={`/game-record/${game.id}`}>回放</Link>
                  )}
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
