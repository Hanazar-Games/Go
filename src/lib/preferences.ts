export const PREFERENCES_STORAGE_KEY = "weida-preferences";

export type SoundEffect = "button" | "stone" | "message" | "success" | "error";

export interface AudioPreferences {
  bgm: boolean;
  moveSound: boolean;
  interfaceSound: boolean;
  volume: number;
}

export interface SitePreferences {
  quality: "怀旧" | "清晰";
  boardSize: 9 | 13 | 19;
  rules: "中国规则" | "日本规则";
  allowChallenges: boolean;
  audio: AudioPreferences;
}

export const DEFAULT_PREFERENCES: SitePreferences = {
  quality: "怀旧",
  boardSize: 19,
  rules: "中国规则",
  allowChallenges: true,
  audio: {
    bgm: true,
    moveSound: true,
    interfaceSound: true,
    volume: 28,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parsePreferences(value: string | null): SitePreferences {
  if (!value) return DEFAULT_PREFERENCES;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed)) return DEFAULT_PREFERENCES;
    const audio = isRecord(parsed.audio) ? parsed.audio : {};
    const volume =
      typeof audio.volume === "number" ? Math.round(audio.volume) : DEFAULT_PREFERENCES.audio.volume;

    return {
      quality: parsed.quality === "清晰" ? "清晰" : "怀旧",
      boardSize: parsed.boardSize === 9 || parsed.boardSize === 13 ? parsed.boardSize : 19,
      rules: parsed.rules === "日本规则" ? "日本规则" : "中国规则",
      allowChallenges:
        typeof parsed.allowChallenges === "boolean"
          ? parsed.allowChallenges
          : DEFAULT_PREFERENCES.allowChallenges,
      audio: {
        bgm: typeof audio.bgm === "boolean" ? audio.bgm : DEFAULT_PREFERENCES.audio.bgm,
        moveSound:
          typeof audio.moveSound === "boolean" ? audio.moveSound : DEFAULT_PREFERENCES.audio.moveSound,
        interfaceSound:
          typeof audio.interfaceSound === "boolean"
            ? audio.interfaceSound
            : DEFAULT_PREFERENCES.audio.interfaceSound,
        volume: Math.min(100, Math.max(0, volume)),
      },
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}
