import { readFile } from "node:fs/promises";
import path from "node:path";
import { getModelById, getProviderById } from "@/data";
import type { EnrichedPrice, Price } from "@/data/types";
import { applyModifiers } from "@/lib/pricing";
import { AdminReviewClient } from "@/components/AdminReviewClient";

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
      <AdminReviewClient initialRows={rows} />
    </main>
  );
}
