"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GoBoard } from "@/components/game/GoBoard";
import { usePreferences } from "@/components/preferences/PreferencesProvider";
import { createDemoGame } from "@/lib/demo-game";
import type { GameSummary, Room } from "@/types/site";
import styles from "@/components/portal/PortalPages.module.css";

export function RecordReplay({ id, game, room }: { id: string; game?: GameSummary; room?: Room }) {
  const { playSound } = usePreferences();
  const boardSize = game?.boardSize ?? room?.boardSize ?? 19;
  const replay = useMemo(() => createDemoGame(boardSize), [boardSize]);
  const allMoves = replay.moves;
  const [move, setMove] = useState(allMoves.length);
  const shownMove = Math.min(move, allMoves.length);
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
        <GoBoard stones={replay.positions[shownMove]} size={boardSize} readOnly />
      </section>
      <aside className={styles.recordSide}>
        <div className={styles.title}>
          <b>{id} 号棋谱</b>
          <span>公开棋局回放</span>
        </div>
        <dl>
          <div>
            <dt>黑方：</dt>
            <dd>
              {game?.black ?? room?.host ?? "未知棋手"}（{game?.blackRank ?? room?.hostRank ?? "—"}）
            </dd>
          </div>
          <div>
            <dt>白方：</dt>
            <dd>
              {game?.white ?? room?.guest ?? "未知棋手"}（{game?.whiteRank ?? room?.guestRank ?? "—"}）
            </dd>
          </div>
          <div>
            <dt>结果：</dt>
            <dd>{game?.result ?? "已结束"}</dd>
          </div>
          <div>
            <dt>规则：</dt>
            <dd>{room ? `${room.rules} / 黑贴${room.komi}目` : `${boardSize}路体验棋谱`}</dd>
          </div>
          <div>
            <dt>当前：</dt>
            <dd aria-live="polite">
              演示第 {shownMove} / {allMoves.length} 手
            </dd>
          </div>
        </dl>
        <div className={styles.replayControls}>
          <button
            type="button"
            disabled={shownMove === 0}
            onClick={() => {
              setPlaying(false);
              setMove(0);
            }}
          >
            回到开局
          </button>
          <button
            type="button"
            disabled={shownMove === 0}
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
            disabled={shownMove >= allMoves.length}
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
            disabled={shownMove >= allMoves.length}
            onClick={() => {
              setPlaying(false);
              setMove(allMoves.length);
            }}
          >
            最后一手
          </button>
        </div>
        <div className={styles.recordLinks}>
          <Link href="/hall">返回对弈大厅</Link>
          <Link href="/games">返回棋谱大厅</Link>
        </div>
        <p>当前展示合法着法组成的静态演示棋谱；完整原局与 KataGo 分析将在后端阶段接入。</p>
      </aside>
    </main>
  );
}
