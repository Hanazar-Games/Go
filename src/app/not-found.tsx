import Link from "next/link";
import styles from "@/components/portal/PortalPages.module.css";

export default function NotFound() {
  return (
    <main className={styles.infoPage}>
      <header>围达网 - 页面未找到</header>
      <section>
        <h2>404　您访问的页面不存在</h2>
        <p>该房间、棋谱或棋手页面没有收录，可能已经关闭，也可能尚未生成静态页面。</p>
        <p>
          <Link href="/">返回围达首页</Link>　·　<Link href="/hall">进入对弈大厅</Link>
        </p>
      </section>
    </main>
  );
}
