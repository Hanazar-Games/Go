import type { Metadata } from "next";
import { announcements, historicalAnnouncements } from "@/data/mock";
import { SITE_VERSION } from "@/lib/release";
import styles from "@/components/portal/PortalPages.module.css";

export const metadata: Metadata = { title: "网站公告" };

function AnnouncementList({ items }: { items: typeof announcements }) {
  return (
    <ul className={styles.announcementArchive}>
      {items.map((item) => (
        <li key={`${item.version ?? item.date}-${item.text}`}>
          <header>
            <b>
              【{item.type}】{item.text}
            </b>
            <time>{item.date}</time>
          </header>
          {item.version && <p>版本：V{item.version}</p>}
          {item.details && (
            <ul>
              {item.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function AnnouncementsPage() {
  return (
    <main className={styles.infoPage}>
      <header>围达网公告栏</header>
      <section>
        <h2>当前公告 · V{SITE_VERSION}</h2>
        <AnnouncementList items={announcements} />
      </section>
      <section>
        <h2>历史公告</h2>
        <AnnouncementList items={historicalAnnouncements} />
      </section>
    </main>
  );
}
