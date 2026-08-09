"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GoBoard } from "@/components/game/GoBoard";
import { usePreferences } from "@/components/preferences/PreferencesProvider";
import { createEndgameStones } from "@/data/mock";
import styles from "@/components/portal/PortalPages.module.css";

export function RecordReplay({ id }: { id: string }) {
  const { playSound } = usePreferences();
  const allMoves = useMemo(() => createEndgameStones(), []);
  const [move, setMove] = useState(allMoves.length);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing || move >= allMoves.length) return;
    const next = Math.min(allMoves.length, move + 1);
    const timer = window.setTimeout(() => {
      setMove(next);
      playSound("stone");
      if (next >= allMoves.length) setPlaying(false);
    }, 260);
    return () => window.clearTimeout(timer);
  }, [allMoves.length, move, playSound, playing]);
  return (
    <main className={styles.recordPage}>
      <section className={styles.recordBoard}>
        <GoBoard
          stones={allMoves.slice(0, move).map((stone, index) => ({ ...stone, last: index === move - 1 }))}
          readOnly
        />
      </section>
      <aside className={styles.recordSide}>
        <div className={styles.title}>
          <b>{id} 号棋谱</b>
          <span>公开棋局回放</span>
        </div>
        <dl>
          <div>
            <dt>黑方：</dt>
            <dd>俞晓旸（9P）</dd>
          </div>
          <div>
            <dt>白方：</dt>
            <dd>褚赢（9D）</dd>
          </div>
          <div>
            <dt>结果：</dt>
            <dd>白中盘胜</dd>
          </div>
          <div>
            <dt>规则：</dt>
            <dd>中国规则 / 黑贴7.5目</dd>
          </div>
          <div>
            <dt>当前：</dt>
            <dd aria-live="polite">
              第 {move} / {allMoves.length} 手
            </dd>
          </div>
        </dl>
        <div className={styles.replayControls}>
          <button
            type="button"
            disabled={move === 0}
            onClick={() => {
              setPlaying(false);
              setMove(0);
            }}
          >
            第一手
          </button>
          <button
            type="button"
            disabled={move === 0}
            onClick={() => {
              setPlaying(false);
              setMove((value) => Math.max(0, value - 1));
            }}
          >
            上一手
          </button>
          <button
            type="button"
            onClick={() => {
              if (playing) {
                setPlaying(false);
                return;
              }
              if (move >= allMoves.length) setMove(0);
              setPlaying(true);
            }}
          >
            {playing && move < allMoves.length ? "暂停" : "自动播放"}
          </button>
          <button
            type="button"
            disabled={move >= allMoves.length}
            onClick={() => {
              setPlaying(false);
              setMove((value) => Math.min(allMoves.length, value + 1));
              playSound("stone");
            }}
          >
            下一手
          </button>
          <button
            type="button"
            disabled={move >= allMoves.length}
            onClick={() => {
              setPlaying(false);
              setMove(allMoves.length);
            }}
          >
            最后一手
          </button>
        </div>
        <div className={styles.recordLinks}>
          <Link href={`/watch/${id}`}>进入观战页</Link>
          <Link href="/games">返回棋谱大厅</Link>
        </div>
        <p>变化图与 KataGo 分析接口已在架构中预留，将在后续阶段接入。</p>
      </aside>
    </main>
  );
}
