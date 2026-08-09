import type { Metadata } from "next";
import Link from "next/link";
import { players } from "@/data/mock";
import styles from "@/components/portal/PortalPages.module.css";

export const metadata: Metadata = { title: "棋手排行榜" };

const rankingModes = [
  { key: "rating", label: "Rating排行", value: (player: (typeof players)[number]) => player.rating },
  { key: "winRate", label: "胜率排行", value: (player: (typeof players)[number]) => player.winRate },
  { key: "wins", label: "胜场排行", value: (player: (typeof players)[number]) => player.wins },
  { key: "streak", label: "连胜排行", value: (player: (typeof players)[number]) => player.streak },
] as const;

export default async function RankingPage({ searchParams }: PageProps<"/ranking">) {
  const { sort } = await searchParams;
  const activeMode = rankingModes.find(({ key }) => key === sort) ?? rankingModes[0];
  const ranking = [...players].sort((a, b) => activeMode.value(b) - activeMode.value(a));

  return (
    <main className={styles.page}>
      <div className={styles.title}>
        <b>围达棋手排行榜</b>
        <span>体验数据排行 · 当前按{activeMode.label.replace("排行", "")}排序</span>
      </div>
      <nav className={styles.tabs} aria-label="排行类别">
        {rankingModes.map((mode) => (
          <Link
            className={mode.key === activeMode.key ? styles.activeTab : ""}
            href={`/ranking?sort=${mode.key}`}
            key={mode.key}
          >
            {mode.label}
          </Link>
        ))}
      </nav>
      <section className={styles.tablePanel}>
        <table>
          <thead>
            <tr>
              <th>排名</th>
              <th>用户名</th>
              <th>段位</th>
              <th>Rating</th>
              <th>胜</th>
              <th>负</th>
              <th>胜率</th>
              <th>连胜</th>
              <th>当前状态</th>
              <th>资料</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((player, index) => (
              <tr key={player.username}>
                <td className={index < 3 ? styles.medal : ""}>{index + 1}</td>
                <td>
                  <Link href={`/players/${encodeURIComponent(player.username)}`}>{player.username}</Link>
                </td>
                <td>{player.rank}</td>
                <td>
                  <b>{player.rating}</b>
                </td>
                <td>{player.wins}</td>
                <td>{player.losses}</td>
                <td>{player.winRate}%</td>
                <td>{player.streak}</td>
                <td>{player.status}</td>
                <td>
                  <Link href={`/players/${encodeURIComponent(player.username)}`}>查看</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className={styles.footnote}>
        当前为固定体验数据；账号和权威对局服务接入后，排行将在有效对局结束后更新。
      </p>
    </main>
  );
}
