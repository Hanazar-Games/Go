import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteShell } from "@/components/shell/SiteShell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "围达网 - 围棋达人的网上家园", template: "%s - 围达网" },
  description: "经典中文互联网风格的在线围棋社区",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
