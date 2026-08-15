"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { usePreferences } from "@/components/preferences/PreferencesProvider";
import type { SitePreferences } from "@/lib/preferences";
import styles from "@/components/portal/PortalPages.module.css";

type PreferenceField =
  "quality" | "boardSize" | "rules" | "bgm" | "moveSound" | "interfaceSound" | "volume" | "allowChallenges";

function mergePreferenceDraft(
  draft: SitePreferences,
  preferences: SitePreferences,
  dirty: ReadonlySet<PreferenceField>,
): SitePreferences {
  const keep = (field: PreferenceField) => dirty.has(field);
  return {
    quality: keep("quality") ? draft.quality : preferences.quality,
    boardSize: keep("boardSize") ? draft.boardSize : preferences.boardSize,
    rules: keep("rules") ? draft.rules : preferences.rules,
    allowChallenges: keep("allowChallenges") ? draft.allowChallenges : preferences.allowChallenges,
    audio: {
      bgm: keep("bgm") ? draft.audio.bgm : preferences.audio.bgm,
      moveSound: keep("moveSound") ? draft.audio.moveSound : preferences.audio.moveSound,
      interfaceSound: keep("interfaceSound") ? draft.audio.interfaceSound : preferences.audio.interfaceSound,
      volume: keep("volume") ? draft.audio.volume : preferences.audio.volume,
    },
  };
}

export function SettingsForm() {
  const { preferences, savePreferences, playSound, previewSound } = usePreferences();
  const [draft, setDraft] = useState(preferences);
  const [saved, setSaved] = useState(false);
  const dirtyFieldsRef = useRef<Set<PreferenceField>>(new Set());

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setDraft((current) => mergePreferenceDraft(current, preferences, dirtyFieldsRef.current));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [preferences]);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = mergePreferenceDraft(draft, preferences, dirtyFieldsRef.current);
    savePreferences(next);
    setDraft(next);
    dirtyFieldsRef.current.clear();
    playSound("success");
    setSaved(true);
  }

  return (
    <main className={styles.infoPage}>
      <header>围达网设置</header>
      <section>
        <h2>显示、对局与声音偏好</h2>
        <form
          className={styles.settingsForm}
          onSubmit={save}
          onChange={(event) => {
            const target = event.target;
            if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) {
              dirtyFieldsRef.current.add(target.name as PreferenceField);
            }
            setSaved(false);
          }}
        >
          <label>
            <span>画面效果：</span>
            <select
              name="quality"
              value={draft.quality}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  quality: event.target.value === "清晰" ? "清晰" : "怀旧",
                }));
              }}
            >
              <option>怀旧</option>
              <option>清晰</option>
            </select>
          </label>
          <label>
            <span>建房默认棋盘：</span>
            <select
              name="boardSize"
              value={draft.boardSize}
              onChange={(event) => {
                setDraft((current) => ({ ...current, boardSize: Number(event.target.value) as 9 | 13 | 19 }));
              }}
            >
              <option value="19">19×19</option>
              <option value="13">13×13</option>
              <option value="9">9×9</option>
            </select>
          </label>
          <label>
            <span>建房默认规则：</span>
            <select
              name="rules"
              value={draft.rules}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  rules: event.target.value === "日本规则" ? "日本规则" : "中国规则",
                }));
              }}
            >
              <option>中国规则</option>
              <option>日本规则</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              name="bgm"
              checked={draft.audio.bgm}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  audio: { ...current.audio, bgm: event.target.checked },
                }));
              }}
            />
            低音量 MIDI 背景乐（首次操作后播放）
          </label>
          <label>
            <input
              type="checkbox"
              name="moveSound"
              checked={draft.audio.moveSound}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  audio: { ...current.audio, moveSound: event.target.checked },
                }));
              }}
            />
            落子声音
          </label>
          <label>
            <input
              type="checkbox"
              name="interfaceSound"
              checked={draft.audio.interfaceSound}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  audio: { ...current.audio, interfaceSound: event.target.checked },
                }));
              }}
            />
            按钮与消息提示音
          </label>
          <label>
            <span>音量：</span>
            <input
              type="range"
              name="volume"
              min="0"
              max="100"
              step="1"
              value={draft.audio.volume}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  audio: { ...current.audio, volume: Number(event.target.value) },
                }));
              }}
            />
            <output>{draft.audio.volume}%</output>
          </label>
          <label>
            <input
              type="checkbox"
              name="allowChallenges"
              checked={draft.allowChallenges}
              onChange={(event) => {
                setDraft((current) => ({ ...current, allowChallenges: event.target.checked }));
              }}
            />
            允许陌生人挑战（本机偏好，账号接入后同步）
          </label>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              previewSound("message", draft.audio.volume);
            }}
          >
            试听提示音
          </button>
          <button type="submit">保存设置</button>
          {saved && <output role="status">设置已保存到本机浏览器</output>}
        </form>
      </section>
    </main>
  );
}
