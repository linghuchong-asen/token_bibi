import type { MetadataRoute } from "next";
import { models, providers } from "@/data";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tokenbibi.example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/models", "/providers", "/subscriptions", "/credits", "/card-keys", "/calculator", "/topics", "/about", "/share"].map((path) => ({
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
