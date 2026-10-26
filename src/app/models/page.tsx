import { getSponsorForPlacement, prices } from "@/data";
import { enrichPrices } from "@/lib/enrich";
import { ModelsExplorer } from "@/components/ModelsExplorer";
import { SponsorSlot } from "@/components/SponsorSlot";

export const metadata = { title: "模型比价" };

export default function ModelsPage() {
  return (
    <main className="page-shell">
      <div className="breadcrumbs"><span>首页</span><span>/</span><span>模型比价</span></div>
      <div className="section-heading">
        <div>
          <h1 style={{ margin: 0, fontSize: 34 }}>模型比价</h1>
          <p>同一模型在不同平台、不同计费方式下的真实成本。</p>
        </div>
      </div>
      <div style={{ marginBottom: 18 }}>
        <SponsorSlot sponsor={getSponsorForPlacement("models")} compact />
      </div>
      <ModelsExplorer rows={enrichPrices(prices)} />
    </main>
  );
}
