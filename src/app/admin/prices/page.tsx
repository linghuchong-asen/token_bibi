// 文件用途：价格核验后台（所属模块：src/app/admin/prices，动态渲染）
// 待核验价格的人工核验入口；核验后需人工构建+重启（页面内有提示）。
// 管理侧其他入口：/admin/leads（销售线索）。
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getModelById, getProviderById } from "@/data";
import type { EnrichedPrice, Price } from "@/data/types";
import { applyModifiers } from "@/lib/pricing";
import { AdminReviewClient } from "@/components/AdminReviewClient";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "价格核验后台" };

async function readPendingPrices(): Promise<EnrichedPrice[]> {
  const prices = JSON.parse(await readFile(path.join(process.cwd(), "data", "prices.json"), "utf8")) as Price[];
  return prices
    .filter((price) => price.dataStatus === "pending_review")
    .map((price) => {
      const model = getModelById(price.modelId);
      const provider = getProviderById(price.providerId);
      if (!model || !provider) return null;
      return { ...price, model, provider, ...applyModifiers(price) };
    })
    .filter((price): price is EnrichedPrice => Boolean(price));
}

export default async function AdminPricesPage() {
  const rows = await readPendingPrices();
  return (
    <main className="page-shell narrow">
      <div className="breadcrumbs"><span>管理</span><span>/</span><span>价格核验</span></div>
      <div className="section-heading">
        <div><h1 style={{ margin: 0, fontSize: 34 }}>价格核验</h1><p>当前有 {rows.length} 条待核验价格。</p></div>
        <span className="badge badge-amber">需要 ADMIN_TOKEN</span>
      </div>
      <p className="small muted" style={{ marginTop: 0 }}>
        管理入口：<Link href="/admin/leads" className="strong">销售线索后台 →</Link>
      </p>
      <AdminReviewClient initialRows={rows} />
    </main>
  );
}
