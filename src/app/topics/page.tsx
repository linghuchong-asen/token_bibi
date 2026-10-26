// 文件用途：长尾专题索引（所属模块：src/app/topics，静态生成）
// 面向具体搜索意图的专题入口；降价动态是数据驱动的独立页面（/price-drops）。
import Link from "next/link";

const topics = [
  { slug: "openrouter-credits", title: "OpenRouter credits 是什么？", description: "购买 credits 后按 token 扣费，平台费在购买时收取。" },
  { slug: "subscription-vs-payg", title: "订阅和按量哪个便宜？", description: "关键不是套餐折扣，而是你的月用量是否超过破局点。" },
  { slug: "glm-5-3-flash-cost", title: "GLM-5.3 Flash 真实成本", description: "比较不同平台、不同充值方式下的有效输入和输出成本。" },
  { slug: "kimi-k3-price-cut", title: "Kimi K3 降价了：现在多少钱？", description: "单日三次调价实测记录与各平台最新已核验对比。" },
  { slug: "qwen3-8-max-alternatives", title: "qwen3.8-max 下架了？替代方案", description: "官方快照替代版 0902 价格相同；对比其他长上下文模型。" },
];

export const metadata = { title: "长尾专题" };

export default function TopicsPage() {
  return (
    <main className="page-shell">
      <div className="breadcrumbs"><Link href="/">首页</Link><span>/</span><span>长尾专题</span></div>
      <div className="section-heading"><div><h1 style={{ margin: 0, fontSize: 34 }}>长尾专题</h1><p>面向具体搜索意图的比价与成本解释。</p></div></div>
      <div className="grid-3">
        <article className="card card-pad stack">
          <div className="badge-row"><span className="badge badge-green">数据驱动</span></div>
          <h2 style={{ margin: 0 }}>AI 模型降价动态</h2>
          <p className="muted">每日检测到的真实价格下调：哪家平台、哪个模型、降了多少。</p>
          <Link href="/price-drops" className="button">查看降价动态</Link>
        </article>
        {topics.map((topic) => (
          <article className="card card-pad stack" key={topic.slug}>
            <h2 style={{ margin: 0 }}>{topic.title}</h2>
            <p className="muted">{topic.description}</p>
            <Link href={`/topics/${topic.slug}`} className="button">阅读专题</Link>
          </article>
        ))}
      </div>
    </main>
  );
}
