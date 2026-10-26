import type { MetadataRoute } from "next";
import { models, providers } from "@/data";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tokenbibi.example.com";

// 文件用途：站点 sitemap 生成（所属模块：src/app，构建时执行）
// 静态页 + 模型/平台详情页全量收录；数据状态页承载"真实性承诺"，需要被搜索引擎看到。
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/models", "/providers", "/subscriptions", "/credits", "/card-keys", "/calculator", "/topics", "/about", "/share", "/data-status", "/data-api", "/advertise", "/faq", "/compare"].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date("2026-10-22"),
    changeFrequency: path === "" ? "daily" as const : "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  return [
    ...staticRoutes,
    ...models.map((model) => ({
      url: `${baseUrl}/models/${model.slug}`,
      lastModified: new Date("2026-10-22"),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...providers.map((provider) => ({
      url: `${baseUrl}/providers/${provider.slug}`,
      lastModified: new Date(provider.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
