// 文件用途：模型比价列表页（所属模块：src/app/models，静态生成 + 客户端筛选）
// 顶部先声明数据新鲜度，再进入比价表格——比价结论的可信度取决于数据状态。
// 最近降价的模型以绿色徽章突出（来自每日变动记录），实时性成为可感知的钩子。
import Link from "next/link";
import { getSponsorForPlacement, priceChanges, prices } from "@/data";
import { enrichPrices } from "@/lib/enrich";
import { recentlyCutModelIds } from "@/lib/price-history";
import { ModelsExplorer } from "@/components/ModelsExplorer";
import { SponsorSlot } from "@/components/SponsorSlot";
import { FreshnessBanner } from "@/components/FreshnessBanner";

export const metadata = { title: "模型比价" };

export default function ModelsPage() {
  const recentCutModelIds = recentlyCutModelIds(priceChanges.changes);
  return (
    <main className="page-shell">
      <div className="breadcrumbs"><span>首页</span><span>/</span><span>模型比价</span></div>
      <div className="section-heading">
        <div>
          <h1 style={{ margin: 0, fontSize: 34 }}>模型比价</h1>
          <p>同一模型在不同平台、不同计费方式下的真实成本。</p>
        </div>
        <Link href="/compare" className="button">对比模型 →</Link>
      </div>
      <div style={{ marginBottom: 14 }}>
        {/* 比价结果的可信度取决于数据新鲜度，先声明状态再给结论 */}
        <FreshnessBanner prices={prices} />
      </div>
      <div style={{ marginBottom: 18 }}>
        <SponsorSlot sponsor={getSponsorForPlacement("models")} compact />
      </div>
      <ModelsExplorer rows={enrichPrices(prices)} recentCutModelIds={recentCutModelIds} />
    </main>
  );
}
