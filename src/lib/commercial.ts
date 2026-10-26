// 文件用途：商业化出站链接与披露规则（所属模块：src/lib，平台页与商业页共用）
// 盈利必须建立在透明之上：只要平台配置了 affiliateUrl，出站链接就换成推广链接，
// 并强制 rel="sponsored nofollow"（搜索引擎合规）+ 页面披露声明。
// 没配置就回退到普通官网链接——机制先建好，分成账号谈下来填一个字段即可生效。
import type { Provider } from "@/data/types";

export function providerOutboundUrl(provider: Pick<Provider, "websiteUrl" | "affiliateUrl">): string {
  return provider.affiliateUrl ?? provider.websiteUrl;
}

export function providerOutboundRel(provider: Pick<Provider, "affiliateUrl">): string {
  // sponsored 告知搜索引擎这是商业链接；nofollow 避免传递权重，符合各方广告规范。
  return provider.affiliateUrl ? "sponsored nofollow" : "noreferrer";
}

export function hasAffiliateRelation(provider: Pick<Provider, "affiliateUrl">): boolean {
  return provider.affiliateUrl !== null && provider.affiliateUrl !== "";
}
