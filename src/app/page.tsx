import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Panel } from "@/components/ui/Panel";
import { announcements, hotGames, players, recentGames, siteStats } from "@/data/mock";
import { RELEASE_DATE, SITE_VERSION } from "@/lib/release";
import styles from "./page.module.css";

export default function HomePage() {
  const ranking = [...players].sort((a, b) => b.rating - a.rating).slice(0, 7);
  const masters = players.filter(({ status, rating }) => status !== "离开" && rating > 1900).slice(0, 6);

  return (
    <main className={styles.home}>
      <div className={styles.noticeStrip}>
        <span>当前位置：围达网 &gt; 门户首页　|　设为首页　|　加入收藏</span>
        <b>
          最后更新：{RELEASE_DATE}　版本 V{SITE_VERSION}
        </b>
      </div>

      <section className={styles.stats} aria-label="站点统计">
        <div>
          <span>当前在线</span>
          <strong>{siteStats.online.toLocaleString("zh-CN")}</strong>
          <small>人</small>
        </div>
        <div>
          <span>正在对局</span>
          <strong>{siteStats.playing}</strong>
          <small>局</small>
        </div>
        <div>
          <span>开放房间</span>
          <strong>{siteStats.rooms}</strong>
          <small>间</small>
        </div>
        <div>
          <span>今日棋局</span>
          <strong>{siteStats.gamesToday.toLocaleString("zh-CN")}</strong>
          <small>局</small>
        </div>
        <div className={styles.primaryActions}>
          <Link href="/hall">进入对弈大厅</Link>
          <Link href="/match">快速匹配</Link>
        </div>
      </section>

      <div className={styles.columns}>
        <aside className={styles.leftColumn}>
          <Panel title="高手在线" action={<span>{masters.length} 人在线</span>}>
            <ul className={styles.playerList}>
              {masters.map((player) => (
                <li key={player.username}>
                  <Avatar
                    name={player.username}
                    size="small"
                    variant={player.username === "褚赢" ? "warrior" : "person"}
                  />
                  <Link href={`/players/${encodeURIComponent(player.username)}`}>
                    <b>{player.username}</b>
                    <small>
                      {player.rank} / {player.rating}
                    </small>
                  </Link>
                  <i
                    className={
                      player.status === "空闲"
                        ? styles.statusFree
                        : player.status === "对局中"
                          ? styles.statusPlaying
                          : styles.statusWatching
                    }
                  >
                    {player.status}
                  </i>
                </li>
              ))}
            </ul>
            <Link className={styles.moreLink} href="/hall">
              查看全部在线棋友 &gt;&gt;
            </Link>
          </Panel>

          <Panel title="快捷通道">
            <div className={styles.quickLinks}>
              <Link href="/hall">● 创建棋局</Link>
              <Link href="/match">● 快速对弈</Link>
              <Link href="/watch/2371">● 观看名局</Link>
              <Link href="/games">● 棋谱回放</Link>
              <Link href="/ranking">● 棋力排行</Link>
              <Link href="/help">● 新手帮助</Link>
            </div>
          </Panel>

          <Panel title="棋友留言">
            <div className={styles.shortMessages}>
              <p>
                <b>周慢慢：</b>祝围达网越办越好！
              </p>
              <p>
                <b>任我游：</b>今晚九点约棋。
              </p>
              <p>
                <b>坐隐先生：</b>棋道贵静。
              </p>
            </div>
          </Panel>
        </aside>

        <section className={styles.centerColumn}>
          <Panel title="网站公告" action={<Link href="/announcements">更多公告 &gt;&gt;</Link>}>
            <ul className={styles.announcements}>
              {announcements.map((item, index) => (
                <li key={item.text}>
                  <b>【{item.type}】</b>
                  <span>
                    {item.text}
                    {index === 0 && <i className={styles.newBadge}>NEW</i>}
                  </span>
                  <time>{item.date}</time>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="★ 当前热门棋局" action={<Link href="/hall">进入观战大厅 &gt;&gt;</Link>}>
            <div className={styles.hotGames}>
              {hotGames.map((game, index) => (
                <article className={index === 0 ? styles.featuredGame : ""} key={game.id}>
                  <div className={styles.gameNumber}>第 {game.id} 室</div>
                  <div className={styles.stoneBlack}>黑</div>
                  <div>
                    <b>{game.black}</b>
                    <small>{game.blackRank}</small>
                  </div>
                  <strong className={styles.vs}>VS</strong>
                  <div>
                    <b>{game.white}</b>
                    <small>{game.whiteRank}</small>
                  </div>
                  <div className={styles.stoneWhite}>白</div>
                  <div className={styles.gameMeta}>
                    <span>{game.result}</span>
                    <span>第 {game.moves} 手</span>
                    <span>观战 {game.spectators}</span>
                  </div>
                  <Link href={`/watch/${game.id}`}>{game.result === "进行中" ? "进入观战" : "回看棋局"}</Link>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title="最近完成的棋局" action={<Link href="/games">棋谱大厅 &gt;&gt;</Link>}>
            <table className={styles.gameTable}>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>黑方</th>
                  <th>白方</th>
                  <th>结果</th>
                  <th>手数</th>
                  <th>棋谱</th>
                </tr>
              </thead>
              <tbody>
                {recentGames.map((game) => (
                  <tr key={game.id}>
                    <td>{game.finishedAt}</td>
                    <td>
                      {game.black}({game.blackRank})
                    </td>
                    <td>
                      {game.white}({game.whiteRank})
                    </td>
                    <td>{game.result}</td>
                    <td>{game.moves}</td>
                    <td>
                      <Link href={`/game-record/${game.id}`}>查看</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </section>

        <aside className={styles.rightColumn}>
          <Panel title="围达棋力榜" action={<Link href="/ranking">完整排行 &gt;&gt;</Link>}>
            <ol className={styles.ranking}>
              {ranking.map((player, index) => (
                <li key={player.username}>
                  <em>{index + 1}</em>
                  <Link href={`/players/${encodeURIComponent(player.username)}`}>{player.username}</Link>
                  <b>{player.rank}</b>
                  <span>{player.rating}</span>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="赛事中心" className={styles.anchorPanel}>
            <div id="events" className={styles.events}>
              <b>第十二届网络名人战</b>
              <p>报名时间：8月9日—8月16日</p>
              <p>参赛要求：1D 及以上</p>
              <Link href="/hall">前往赛事房间</Link>
            </div>
          </Panel>

          <Panel title="围棋资讯" className={styles.anchorPanel}>
            <ul id="news" className={styles.news}>
              <li>网络棋战决赛今日落子</li>
              <li>古谱《当湖十局》导读</li>
              <li>围棋入门：气与提子的判断</li>
              <li>本周高手棋谱推荐</li>
            </ul>
          </Panel>
        </aside>
      </div>
    </main>
  );
}
