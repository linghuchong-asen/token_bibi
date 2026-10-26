// 文件用途：根布局（所属模块：src/app，全站外壳）
// 站点级元数据统一在这里声明：标题模板、描述、RSS 自动发现
// （订阅器可探测 /feed.xml）、OG 基础信息——全站传播面的入口。
import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://tokenbibi.example.com"),
  title: {
    default: "token比比 · AI 模型真实成本比价",
    template: "%s · token比比",
  },
  description: "比较按量、订阅、积分和卡密四类购买方式的真实到手成本。",
  alternates: {
    types: { "application/rss+xml": "/feed.xml" },
  },
  openGraph: {
    siteName: "token比比",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
