import { describe, expect, it } from "vitest";
import packageInfo from "../../package.json";
import { announcements, historicalAnnouncements } from "@/data/mock";
import { SITE_VERSION } from "./release";

describe("release data", () => {
  it("keeps the package and displayed release versions in sync", () => {
    expect(packageInfo.version).toBe(SITE_VERSION);
    expect(announcements[0]?.version).toBe(SITE_VERSION);
  });

  it("moves previous release notices into history", () => {
    expect(announcements.some(({ version }) => version === "0.8.1")).toBe(false);
    expect(historicalAnnouncements[0]?.version).toBe("0.8.1");
    expect(historicalAnnouncements.some(({ version }) => version === "0.8.1")).toBe(true);
    expect(historicalAnnouncements.some(({ version }) => version === "0.8.0")).toBe(true);
    expect(historicalAnnouncements.some(({ version }) => version === "0.7.0")).toBe(true);
  });
});
