import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ISG 技术情报台",
  description: "中国服务器市场新技术：证据、项目进展与竞争跟踪。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/isg-radar-mark.png",
    shortcut: "/isg-radar-mark.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
