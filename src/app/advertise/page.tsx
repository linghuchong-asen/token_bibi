// 文件用途：广告位自助投放页（所属模块：src/app/advertise，静态生成 + 客户端表单）
// 盈利入口①：把"赞助位"从占位说明升级为可直接下单的销售页——
// 刊例价与首发价、每个位次的位置和规格、剩余位次、申请表单、投放红线。
// 价格数据在 data/ad-products.json，运营调价不需要改代码。
import Link from "next/link";
import { adProducts, sponsors } from "@/data";
import { formatCny } from "@/lib/format";
import { LeadForm } from "@/components/LeadForm";

export const metadata = { title: "广告位合作" };

export default function AdvertisePage() {
  // 位次实况：sponsors.json 里 enabled 的记录代表当前已被占用的位。
  // 指向 /advertise 自身的位是"自推广"（位次未售出时的标准做法），
  // 不计入已占用，否则示例数据会把所有位次显示成"已满"，误导真实买家。
  const takenByPlacement = new Map<string, number>();
  for (const sponsor of sponsors) {
    if (!sponsor.enabled || sponsor.targetUrl === "/advertise") continue;
    takenByPlacement.set(sponsor.placement, (takenByPlacement.get(sponsor.placement) ?? 0) + 1);
  }

  return (
    <main className="page-shell">
      <div className="breadcrumbs"><Link href="/">首页</Link><span>/</span><span>广告位合作</span></div>
      <h1 style={{ marginBottom: 8, fontSize: 38, letterSpacing: "-0.03em" }}>把服务展示给正在比较 AI 成本的人</h1>
      <p className="muted">
        访客是带着购买决策来的：选模型、选平台、算成本。位次固定、数量有限、全部明确标注，赞助不影响任何数据与排序。
      </p>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>位次与刊例价</h2>
            <p>首发期价格，按月起投，季度投享 9 折。所有位次售完即止，不加塞。</p>
          </div>
        </div>
        <div className="grid-3">
          {adProducts.map((product) => {
            const taken = takenByPlacement.get(product.placement) ?? 0;
            const remaining = Math.max(product.slots - taken, 0);
            return (
              <article className="card card-pad" key={product.id}>
                <div className="badge-row">
                  <span className="badge">{product.name}</span>
                  <span className={`badge ${remaining > 0 ? "badge-green" : "badge-red"}`}>{remaining > 0 ? `余 ${remaining} 位` : "已满"}</span>
                </div>
                <div className="metric-value" style={{ marginTop: 10 }}>
                  {formatCny(product.launchPriceCnyPerMonth)}
                  <span className="small muted" style={{ fontWeight: 400 }}> / 月</span>
                </div>
                <div className="small muted">刊例价 {formatCny(product.priceCnyPerMonth)} / 月 · 首发期 {formatCny(product.launchPriceCnyPerMonth)}</div>
                <p className="small" style={{ marginBottom: 0 }}>{product.position}</p>
                <ul className="small muted" style={{ paddingLeft: 18, marginBottom: 0 }}>
                  {product.specs.map((spec) => <li key={spec}>{spec}</li>)}
                </ul>
                <div className="small muted">适合：{product.fitFor}</div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section">
        <LeadForm
          product="sponsor_slot"
          placements={adProducts.map((product) => ({ value: product.placement, label: product.name }))}
          title="申请投放"
          description="提交后 1 个工作日内回复报价与排期。MVP 阶段先占位后付款，未上架前不收费。"
          successNote="申请已收到，我们会在 1 个工作日内通过邮箱联系你。"
        />
      </section>

      <section className="section card card-pad">
        <h2 style={{ marginTop: 0 }}>投放规范（不可协商）</h2>
        <div className="stack">
          <div className="note">广告位数量固定，满额后不加塞；位次、样式、标注方式全站统一。</div>
          <div className="warning">赞助不会改变价格、有效成本、稳定性评分或自然排序；数据由独立的采集与核验管线产出。</div>
          <div className="danger">不接受“官方推荐”“最稳定”“包可用”等无法核验的表述；素材过度承诺会被下架且不退款。</div>
        </div>
      </section>
    </main>
  );
}
