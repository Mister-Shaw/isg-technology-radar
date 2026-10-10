import type { Metadata } from "next";
import "./globals.css";
import "./compact.css";

export const metadata: Metadata = {
  title: "ISG 技术情报台",
  description: "中国服务器市场新技术：证据、项目进展与竞争跟踪。",
  icons: {
    icon: [{ url: "/isg-radar-blue-trail.svg", type: "image/svg+xml" }, { url: "/isg-radar-trail-icon.png", type: "image/png" }],
    shortcut: "/isg-radar-trail-icon.png",
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
