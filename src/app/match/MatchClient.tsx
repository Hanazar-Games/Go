"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { usePreferences } from "@/components/preferences/PreferencesProvider";
import { MATCH_DEMO_ID } from "@/lib/game-data";
import styles from "@/components/portal/PortalPages.module.css";

export function MatchClient() {
  const router = useRouter();
  const opponent = useSearchParams().get("opponent") ?? undefined;
  const { playSound } = usePreferences();
  const [searching, setSearching] = useState(false);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!searching) return;
    if (seconds >= 5) {
      if (seconds === 5) playSound("success");
      const redirect = window.setTimeout(() => router.push(`/game/${MATCH_DEMO_ID}`), 800);
      return () => window.clearTimeout(redirect);
    }
    const timer = window.setTimeout(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearTimeout(timer);
  }, [playSound, router, searching, seconds]);
  return (
    <main className={styles.matchPage}>
      <section className={styles.matchWindow}>
        <header>{opponent ? `挑战演示：${opponent}` : "快速匹配"}</header>
        <div className={styles.matchContent}>
          <div className={styles.matchStone}>棋</div>
          <h1 aria-live="polite">
            {searching ? (seconds >= 5 ? "匹配成功！" : "正在寻找对手……") : "围达自动匹配"}
          </h1>
          <p>预计棋力范围：7K — 1D</p>
          <p>棋盘：19×19　中国规则　黑贴7.5目</p>
          {searching ? (
            <>
              <strong>等待时间　00:{String(seconds).padStart(2, "0")}</strong>
              <small>等待时间越长，Rating 搜索范围将逐步扩大</small>
              <button
                type="button"
                onClick={() => {
                  setSearching(false);
                  setSeconds(0);
                }}
              >
                取消匹配
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setSearching(true)}>
              {opponent ? "开始挑战演示" : "开始寻找对手"}
            </button>
          )}
          <small>当前为前端匹配演示，不会向其他账号发送邀请或变更 Rating。</small>
          <Link href="/hall">返回对弈大厅</Link>
        </div>
      </section>
    </main>
  );
}
