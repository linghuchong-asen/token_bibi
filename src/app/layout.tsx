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

// 首页 JSON-LD 在各页面内各自输出；这里用 head 函数为全站补充 WebSite 实体
// （帮助搜索引擎把站名与站点关联）。app router 下通过 layout 内嵌脚本实现。
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "token比比",
    description: "AI 模型 API 真实成本比价：按量、订阅、积分、卡密同一口径。",
  };
  return (
    <html lang="zh-CN">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
