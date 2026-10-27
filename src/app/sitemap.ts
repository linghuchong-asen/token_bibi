// 文件用途：站点 sitemap 生成（所属模块：src/app，构建时执行）
// 静态页 + 模型/平台详情页全量收录；数据状态页承载"真实性承诺"，需要被搜索引擎看到。
// lastModified 取价格变动记录的生成时间（每日管线更新）：sitemap 里写死的
// 旧日期会欺骗爬虫的抓取节奏，搜索引擎一旦发现 lastModified 与实际内容
// 变化不符，会降权整个站点的 freshness 信号——SEO 上宁可保守也不造假。
import type { MetadataRoute } from "next";
import { models, priceChanges, providers } from "@/data";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tokenbibi.example.com";

// 全站数据最后更新时间：变动记录的生成时间（每日管线最后一步之一）
const dataUpdatedAt = new Date(priceChanges.generatedAt);

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/models", "/providers", "/subscriptions", "/credits", "/card-keys", "/calculator", "/topics", "/about", "/share", "/data-status", "/data-api", "/advertise", "/faq", "/compare", "/price-drops"].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: dataUpdatedAt,
    changeFrequency: path === "" ? "daily" as const : "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  return [
    ...staticRoutes,
    ...models.map((model) => ({
      url: `${baseUrl}/models/${model.slug}`,
      lastModified: dataUpdatedAt,
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
