// 文件用途：首页（所属模块：src/app，静态生成）
// 结构：数据新鲜度横幅 → 三个核心数字 → 精选比价表 → 赞助位 → 方法说明与分享入口。
// 首页只展示已核验价格（verifiedFeatured），核验不足时才回退到全量并如实标注。
import { models, plans, prices, providers } from "@/data";
import { enrichPrices } from "@/lib/enrich";
import { formatCny, formatTokens } from "@/lib/format";
import { estimateSubscriptionPlan } from "@/lib/pricing";
import { priceStatusNote } from "@/lib/data-status";
import { PriceTable } from "@/components/PriceTable";
import { SponsorSlot } from "@/components/SponsorSlot";
import { FreshnessBanner } from "@/components/FreshnessBanner";
import { getSponsorForPlacement } from "@/data";

const paths = [
  { title: "按量计费", note: "输入、输出、缓存按 token 扣费" },
  { title: "订阅套餐", note: "月费、额度、重置周期和超额规则" },
  { title: "积分 / 额度", note: "充值汇率、最低充值和余额有效期" },
  { title: "卡密 / 兑换码", note: "购买路径、使用规则和售后风险" },
];

export default function HomePage() {
  const featuredRows = enrichPrices(prices.filter((price) => ["gpt-5-6-sol", "glm-5-3-flash", "claude-sonnet-5"].includes(price.modelId)));
  const verifiedFeatured = featuredRows.filter((price) => price.dataStatus === "verified");
  const featured = (verifiedFeatured.length > 0 ? verifiedFeatured : featuredRows).slice(0, 8);
  const cheapest = [...featured].sort((a, b) => a.effectiveInputPrice - b.effectiveInputPrice)[0];
  const samplePlan = plans[1];
  const samplePlanEstimate = estimateSubscriptionPlan(samplePlan, cheapest?.effectiveInputPrice);
  const verifiedPriceCount = prices.filter((price) => price.dataStatus === "verified").length;

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <span className="badge">真实到手成本，而不是标价</span>
          <h1>不要只看 token 单价</h1>
          <p>按量、订阅、积分、卡密放在同一口径里比较。先算清真实成本，再决定买哪一种。</p>
          <div className="hero-actions">
            <a href="/calculator" className="button button-primary">开始计算</a>
            <a href="/models" className="button">查看模型比价</a>
          </div>
          <p className="small muted" style={{ marginTop: 18 }}>
            共 {models.length} 个模型、{providers.length} 个平台、{prices.length} 条价格记录 · {verifiedPriceCount} 条价格已核验
          </p>
        </div>
        <div className="hero-side">
          {paths.map((path) => (
            <div className="path-card" key={path.title}>
              <div>
                <strong>{path.title}</strong>
                <span>{path.note}</span>
              </div>
              <span className="badge badge-neutral">比较</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        {/* 数据新鲜度横幅：把"截至何时、核验了多少"放在首屏，真实性可被第一眼验证 */}
        <FreshnessBanner prices={prices} />
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>先看三个数字</h2>
            <p>把“标价便宜”翻译成“实际便宜”。</p>
          </div>
        </div>
        <div className="grid-3">
          <div className="metric">
            <div className="metric-label">已核验最低有效输入价</div>
            <div className="metric-value">{cheapest ? formatCny(cheapest.effectiveInputPrice, 3) : "—"}</div>
            <div className="metric-note">{cheapest ? `${cheapest.model.name} · ${cheapest.provider.name} · 来源复核` : "暂无数据"}</div>
          </div>
          <div className="metric">
            <div className="metric-label">样例套餐额度折算</div>
            <div className="metric-value">{samplePlanEstimate.effectivePerMillion ? formatCny(samplePlanEstimate.effectivePerMillion, 2) : "不限"}</div>
            <div className="metric-note">{samplePlan.name} · 套餐仍为样例数据</div>
          </div>
          <div className="metric">
            <div className="metric-label">订阅破局点</div>
            <div className="metric-value">{samplePlanEstimate.breakEvenTokens ? formatTokens(samplePlanEstimate.breakEvenTokens) : "—"}</div>
            <div className="metric-note">按样例套餐估算；低于该用量时按量可能更划算</div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>真实成本对比</h2>
            <p>{priceStatusNote(prices)}</p>
          </div>
          <a href="/models" className="button button-small">查看全部模型</a>
        </div>
        <div className="card card-pad">
          <PriceTable rows={featured} showModel />
        </div>
      </section>

      <section className="section">
        <SponsorSlot sponsor={getSponsorForPlacement("home")} />
      </section>

      <section className="section">
        <div className="split">
          <div className="card card-pad">
            <h2 style={{ marginTop: 0 }}>为什么不能只看标价？</h2>
            <div className="stack">
              <div className="note">充值汇率会改变真实成本：`1 元 = 1.2 额度` 和 `1 元 = 0.8 额度` 是两种世界。</div>
              <div className="warning">订阅额度不是无限额度：模型范围、重置周期、分组和超额规则都会影响可用性。</div>
              <div className="danger">卡密 / 兑换码只是购买路径，不等于价格倍率；售后和有效期更重要。</div>
            </div>
          </div>
          <div className="card card-pad">
            <h2 style={{ marginTop: 0 }}>分享你的比价结论</h2>
            <p className="muted">计算完成后生成可复制链接，把“真实成本”带回社区讨论。</p>
            <div className="hero-actions">
              <a href="/calculator" className="button button-primary">生成一次计算</a>
              <a href="/share" className="button">查看分享卡片</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
