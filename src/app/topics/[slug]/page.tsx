import Link from "next/link";
import { notFound } from "next/navigation";
import { getModelBySlug, getPricesForModel } from "@/data";
import { enrichPrices } from "@/lib/enrich";
import { PriceTable } from "@/components/PriceTable";

const topics = [
  { slug: "openrouter-credits", title: "OpenRouter credits 是什么？", description: "购买 credits 后按 token 扣费，平台费在购买 credits 时收取。", modelSlug: "glm-5-3-flash" },
  { slug: "subscription-vs-payg", title: "订阅和按量哪个便宜？", description: "关键不是套餐折扣，而是你的月用量是否超过破局点。", modelSlug: "gpt-5-6-sol" },
  { slug: "glm-5-3-flash-cost", title: "GLM-5.3 Flash 真实成本", description: "比较不同平台、不同充值方式下的有效输入和输出成本。", modelSlug: "glm-5-3-flash" },
];

export function generateStaticParams() {
  return topics.map((topic) => ({ slug: topic.slug }));
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = topics.find((item) => item.slug === slug);
  if (!topic) notFound();
  const model = getModelBySlug(topic.modelSlug);
  const rows = model ? enrichPrices(getPricesForModel(model.id)) : [];

  return (
    <main className="page-shell">
      <div className="breadcrumbs"><Link href="/">首页</Link><span>/</span><Link href="/topics">长尾专题</Link><span>/</span><span>{topic.title}</span></div>
      <section className="card card-pad">
        <span className="badge">专题</span>
        <h1 style={{ margin: "14px 0 8px", fontSize: 38, letterSpacing: "-0.03em" }}>{topic.title}</h1>
        <p className="muted" style={{ fontSize: 16 }}>{topic.description}</p>
      </section>

      <section className="section split">
        <div className="card card-pad">
          <h2 style={{ marginTop: 0 }}>一句话结论</h2>
          <p className="muted">先看真实到手成本，再看平台是否支持你需要的模型、支付方式和售后规则。</p>
          <div className="note">想让结论变成你自己的数字？打开计算器输入月用量。</div>
        </div>
        <div className="card card-pad">
          <h2 style={{ marginTop: 0 }}>快速计算</h2>
          <Link href={`/calculator?model=${topic.modelSlug}`} className="button button-primary">打开成本计算器</Link>
        </div>
      </section>

      <section className="section card card-pad">
        <h2 style={{ marginTop: 0 }}>相关平台数据</h2>
        <PriceTable rows={rows} showModel />
      </section>
    </main>
  );
}
