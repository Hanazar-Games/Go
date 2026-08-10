export interface GameClock {
  mainSeconds: number | null;
  byoyomiSeconds: number;
  periodSeconds: number;
  periods: number;
  expired: boolean;
}

export function parseTimeControl(value: string): GameClock {
  if (value === "不限时") {
    return { mainSeconds: null, byoyomiSeconds: 0, periodSeconds: 0, periods: 0, expired: false };
  }

  const match = /^(\d+)分\+(\d+)×(\d+)秒$/.exec(value);
  if (!match) throw new Error("不支持的用时设置");
  const [, minutes, periods, seconds] = match.map(Number);
  if (
    ![minutes, periods, seconds].every(Number.isSafeInteger) ||
    minutes < 0 ||
    minutes > 1440 ||
    periods < 1 ||
    periods > 99 ||
    seconds < 1 ||
    seconds > 3600
  ) {
    throw new Error("不支持的用时设置");
  }

  return {
    mainSeconds: minutes * 60,
    byoyomiSeconds: seconds,
    periodSeconds: seconds,
    periods,
    expired: false,
  };
}

export function tickGameClock(clock: GameClock): GameClock {
  if (clock.expired || clock.mainSeconds === null) return clock;
  if (clock.mainSeconds > 0) return { ...clock, mainSeconds: clock.mainSeconds - 1 };
  if (clock.periodSeconds > 1) return { ...clock, periodSeconds: clock.periodSeconds - 1 };
  if (clock.periods > 1) {
    return { ...clock, periods: clock.periods - 1, periodSeconds: clock.byoyomiSeconds };
  }
  return { ...clock, periods: 0, periodSeconds: 0, expired: true };
}

export function resetByoyomi(clock: GameClock): GameClock {
  if (clock.expired || clock.mainSeconds !== 0) return clock;
  return { ...clock, periodSeconds: clock.byoyomiSeconds };
}

export function formatGameClock(clock: GameClock): string {
  if (clock.mainSeconds === null) return "不限时";
  if (clock.mainSeconds > 0) {
    const minutes = Math.floor(clock.mainSeconds / 60);
    const seconds = clock.mainSeconds % 60;
    return `主时 ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  if (clock.expired) return "超时";
  return `读秒 ${clock.periods}×${clock.periodSeconds}`;
}
