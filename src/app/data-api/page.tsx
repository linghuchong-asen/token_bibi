// 文件用途：数据 API 订阅产品页（所属模块：src/app/data-api，静态生成 + 客户端表单）
// 盈利入口②：把"AI 模型价格数据"本身变成商品。
// 免费层即时可用（/api/prices），Pro/企业层通过表单线索人工开通——
// MVP 阶段不建支付与账号系统，先用真实可用的免费层 + 线索漏斗验证付费意愿。
import Link from "next/link";
import { LeadForm } from "@/components/LeadForm";

export const metadata = { title: "价格数据 API" };

const TIERS = [
  {
    name: "免费层",
    price: "¥0",
    note: "无需注册，立即可用",
    features: ["60 次 / 分钟", "仅已核验价格", "全量平台与模型", "CC BY 署名转载"],
    cta: { href: "/api/prices", label: "直接调用", external: false },
  },
  {
    name: "Pro",
    price: "¥199 / 月",
    note: "适合工具站、社区机器人、内容作者",
    features: ["10,000 次 / 天", "含待核验与样例状态过滤", "价格变动推送（Webhook）", "30 天历史价格", "商用授权（免署名）"],
    cta: { href: "#apply", label: "申请开通", external: false },
  },
  {
    name: "企业层",
    price: "定制",
    note: "适合交易台、聚合器、研究机构",
    features: ["专属配额与 SLA", "全量历史数据导出", "定制字段与模型覆盖", "数据质量周报", "发票与合同"],
    cta: { href: "#apply", label: "联系我们", external: false },
  },
];

export default function DataApiPage() {
  return (
    <main className="page-shell">
      <div className="breadcrumbs"><Link href="/">首页</Link><span>/</span><span>价格数据 API</span></div>
      <h1 style={{ marginBottom: 8, fontSize: 38, letterSpacing: "-0.03em" }}>把 token比比 的价格数据接进你的产品</h1>
      <p className="muted">
        每天自动采集并逐字段复核的 AI 模型价格，一个 GET 请求拿走。免费层即生产可用，数据水位随响应返回。
      </p>

      <section className="section">
        <div className="grid-3">
          {TIERS.map((tier) => (
            <article className="card card-pad" key={tier.name}>
              <div className="badge-row">
                <span className="badge">{tier.name}</span>
              </div>
              <div className="metric-value" style={{ marginTop: 10 }}>{tier.price}</div>
              <div className="small muted">{tier.note}</div>
              <ul className="small" style={{ paddingLeft: 18 }}>
                {tier.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
              <a href={tier.cta.href} className={`button ${tier.name === "免费层" ? "button" : "button-primary"}`} style={{ width: "100%" }}>
                {tier.cta.label}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="section split">
        <div className="card card-pad stack">
          <h2 style={{ margin: 0 }}>免费层示例</h2>
          <div className="small muted">拉取全部已核验价格（默认），或按模型 / 平台过滤：</div>
          <pre className="kbd" style={{ padding: 14, whiteSpace: "pre-wrap" }}>{`curl "https://tokenbibi.example.com/api/prices"
curl "https://tokenbibi.example.com/api/prices?model=glm-5-3-flash"
curl "https://tokenbibi.example.com/api/prices?provider=openrouter&status=all&limit=50"`}</pre>
          <div className="small muted">响应包含 meta（数据截至时间、已核验占比）与 data（每条价格含 lastVerifiedAt 与 sourceUrl，可自行溯源）。</div>
          <div className="note">限流响应头：X-RateLimit-Limit / Remaining / Reset。429 表示本分钟配额用尽。</div>
        </div>
        <div className="card card-pad stack">
          <h2 style={{ margin: 0 }}>为什么可信</h2>
          <div className="stack small">
            <div><strong>来源复核：</strong>只有与平台公开定价页逐字段一致的记录才是 verified 状态，免费层默认只输出这类数据。</div>
            <div><strong>自动降级：</strong>源站改价或模型下架时，已核验徽章会被自动撤销，不会输出过期数据还挂着新章。</div>
            <div><strong>变动留痕：</strong>每次调价都有检测时间与前后值，Pro 层可订阅推送。</div>
          </div>
          <Link href="/data-status" className="small" style={{ fontWeight: 700 }}>查看实时数据状态 →</Link>
        </div>
      </section>

      <section className="section">
        <LeadForm
          product="api_subscription"
          placements={[]}
          title="申请开通 Pro / 企业层"
          description="留下需求与联系方式，1 个工作日内回复开通方案。支持按量后付与年度合同。"
          successNote="申请已收到，我们会在 1 个工作日内通过邮箱联系你。"
        />
      </section>
    </main>
  );
}
