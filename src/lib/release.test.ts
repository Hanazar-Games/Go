import { describe, expect, it } from "vitest";
import packageInfo from "../../package.json";
import { announcements, historicalAnnouncements } from "@/data/mock";
import { SITE_VERSION } from "./release";

describe("release data", () => {
  it("keeps the package and displayed release versions in sync", () => {
    expect(packageInfo.version).toBe(SITE_VERSION);
    expect(announcements[0]?.version).toBe(SITE_VERSION);
  });

  it("moves the previous release notice into history", () => {
    expect(announcements.some(({ text }) => text.includes("公开测试开始"))).toBe(false);
    expect(historicalAnnouncements.some(({ text }) => text.includes("公开测试开始"))).toBe(true);
  });
});
