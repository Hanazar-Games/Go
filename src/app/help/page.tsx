import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/portal/PortalPages.module.css";
export const metadata: Metadata = { title: "帮助" };
export default function HelpPage() {
  return (
    <main className={styles.infoPage}>
      <header>围达网帮助中心</header>
      <section>
        <h2>怎样开始一盘棋？</h2>
        <p>
          进入<Link href="/hall">对弈大厅</Link>，选择等待中的房间加入；也可以创建房间或使用
          <Link href="/match">快速匹配</Link>。
        </p>
      </section>
      <section>
        <h2>对局操作</h2>
        <ul>
          <li>轮到自己时，鼠标移到空交叉点会出现半透明棋子预览；也可用方向键和回车落子。</li>
          <li>“停一手”会记录 Pass；“请求悔棋”目前生成本地请求记录；“认输”会立即结束本局体验。</li>
          <li>公开棋局允许棋友观战，观战者不能落子。</li>
          <li>当前体验版尚未启用气、提子、自杀、劫与终局数目判定，请勿将棋盘结果用于正式比赛。</li>
        </ul>
      </section>
      <section>
        <h2>棋力和排行榜</h2>
        <p>
          页面使用模拟 Rating 展示棋力，段位是 Rating
          的显示映射。账号和权威对局服务接入后，有效对局才会自动更新分数。
        </p>
      </section>
      <section>
        <h2>快捷键提示</h2>
        <p>
          顶部“开始(O)、操作(S)、对战(B)、设置(S)、帮助(H)”沿用早期客户端菜单命名，当前可直接点击进入相应页面。
        </p>
      </section>
    </main>
  );
}
