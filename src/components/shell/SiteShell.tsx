"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { PreferencesProvider, usePreferences } from "@/components/preferences/PreferencesProvider";
import { siteStats } from "@/data/mock";
import { SITE_VERSION } from "@/lib/release";
import styles from "./SiteShell.module.css";

const portalLinks = [
  ["首页", "/"],
  ["对弈大厅", "/hall"],
  ["棋谱", "/games"],
  ["赛事", "/#events"],
  ["排行榜", "/ranking"],
  ["高手对局", "/watch/2371"],
  ["围棋资讯", "/#news"],
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <PreferencesProvider>
      <SiteFrame>{children}</SiteFrame>
    </PreferencesProvider>
  );
}

function SiteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const immersive = /^\/(game|watch|game-record)\//.test(pathname);
  const [clock, setClock] = useState("--:--:--");
  const { preferences, savePreferences } = usePreferences();
  const crisp = preferences.quality === "清晰";

  useEffect(() => {
    const update = () => setClock(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={`${styles.window} ${crisp ? styles.crisp : ""}`}>
      <div className={styles.titleBar}>
        <span className={styles.appIcon} aria-hidden="true">
          <i />
        </span>
        <b>围达网 Online - [围棋达人的网上家园]</b>
        <span className={styles.titleMeta}>2001 网络体验版 · v{SITE_VERSION}</span>
        <span className={styles.windowControls} aria-hidden="true">
          <i>_</i>
          <i>□</i>
          <i>×</i>
        </span>
      </div>
      <nav className={styles.softwareMenu} aria-label="软件菜单">
        <Link href="/">开始(O)</Link>
        <Link href="/hall">操作(S)</Link>
        <Link href="/match">对战(B)</Link>
        <Link href="/settings">设置(S)</Link>
        <Link href="/help">帮助(H)</Link>
        <span className={styles.connection}>
          <i />
          Internet　128K
        </span>
      </nav>

      <header className={styles.masthead}>
        <Link className={styles.logo} href="/" aria-label="围达网首页">
          <strong>围达网</strong>
          <small>weidawq.com</small>
          <em>Since 2001</em>
        </Link>
        <span className={`${styles.bamboo} ${styles.bambooLeft}`} aria-hidden="true" />
        <div className={styles.brand}>
          <span className={styles.gem}>棋</span>
          <span className={styles.brandText}>
            <b>围棋达人的网上家园</b>
            <small>WEIDA ONLINE · 中国围棋网路一区</small>
          </span>
        </div>
        <span className={`${styles.bamboo} ${styles.bambooRight}`} aria-hidden="true" />
        <div className={styles.accountBox}>
          <span>当前账号：访客棋手</span>
          <b>9K　Rating 1000</b>
          <small>● 在线　大厅一区</small>
        </div>
        <div className={styles.headerButtons}>
          <Link href="/help">
            <i>?</i>帮助
          </Link>
          <button
            type="button"
            onClick={() => {
              savePreferences({ ...preferences, quality: crisp ? "怀旧" : "清晰" });
            }}
            aria-pressed={crisp}
          >
            <i>⚙</i>
            {crisp ? "怀旧" : "清晰"}
          </button>
        </div>
      </header>

      <nav className={styles.portalNav} aria-label="门户导航">
        {portalLinks.map(([label, href]) => {
          const base = href.split("#")[0];
          const active =
            href === "/" ? pathname === "/" : href.includes("#") ? false : pathname.startsWith(base);
          return (
            <Link className={active ? styles.active : ""} href={href} key={label}>
              {label}
            </Link>
          );
        })}
      </nav>

      {!immersive && (
        <div className={styles.ticker} aria-label="站内广播">
          <b>站内广播</b>
          <div>
            <p>
              欢迎来到围达网！　请棋友文明对弈　◆　第十二届网络名人战正在报名　◆　系统维护时间：周一 03:00
            </p>
          </div>
          <span>
            您是第 <strong>008972431</strong> 位访问者
          </span>
        </div>
      )}

      <div className={styles.content}>{children}</div>

      <footer className={styles.statusBar}>
        <span>
          <i className={styles.onlineDot} />
          服务器状态：正常
        </span>
        <span>在线棋友：{siteStats.online.toLocaleString("zh-CN")}</span>
        <span>正在对局：{siteStats.playing.toLocaleString("zh-CN")}</span>
        <span>今日棋局：{siteStats.gamesToday.toLocaleString("zh-CN")}</span>
        <span>最佳浏览 1024×768　IE5.5+</span>
        <span>Internet 区域　受保护模式：开</span>
        <button
          className={styles.soundToggle}
          type="button"
          aria-pressed={preferences.audio.bgm}
          title="低音量 MIDI 背景乐将在首次操作页面后播放"
          onClick={() =>
            savePreferences({
              ...preferences,
              audio: { ...preferences.audio, bgm: !preferences.audio.bgm },
            })
          }
        >
          ♪ BGM {preferences.audio.bgm ? "开" : "关"}
        </button>
        <span className={styles.clock}>北京时间　{clock}</span>
      </footer>
      <div className={styles.scanlines} aria-hidden="true" />
      <div className={styles.screenShade} aria-hidden="true" />
    </div>
  );
}
