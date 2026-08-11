export function formatSiteTime(date = new Date()) {
  return date.toLocaleTimeString("zh-CN", { hour12: false, timeZone: "Asia/Shanghai" });
}
