import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/portal/PortalPages.module.css";
import { SITE_VERSION } from "@/lib/release";
export const metadata: Metadata = { title: "关于围达" };
export default function AboutPage() {
  return (
    <main className={styles.infoPage}>
      <header>关于围达网</header>
      <section>
        <h2>围棋达人的网上家园</h2>
        <p>
          围达网是一座按经典中文互联网视觉重建的在线围棋社区。界面保留旧式 PC
          围棋客户端的信息密度、暖黄棋盘与蓝色窗口，底层则面向现代浏览器和实时服务架构。
        </p>
      </section>
      <section>
        <h2>{SITE_VERSION} 怀旧体验版内容</h2>
        <ul>
          <li>围棋门户首页、对弈大厅、房间创建和快速匹配流程</li>
          <li>Canvas 棋盘、观战、聊天、棋谱回放和 SGF 下载</li>
          <li>棋手主页、Rating 排行和公开棋谱列表</li>
        </ul>
        <p>
          当前对弈是前端体验流程，尚未实现提子、劫与终局数目。账号、数据库和 WebSocket
          权威对局将按实施计划逐阶段接入。
        </p>
      </section>
      <section>
        <h2>开始使用</h2>
        <p>
          <Link href="/hall">进入对弈大厅</Link>　·　<Link href="/help">查看帮助</Link>　·　
          <Link href="/announcements">查看版本公告</Link>
        </p>
      </section>
    </main>
  );
}
