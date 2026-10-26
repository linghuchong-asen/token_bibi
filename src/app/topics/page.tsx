import Link from "next/link";

const topics = [
  { slug: "openrouter-credits", title: "OpenRouter credits 是什么？", description: "购买 credits 后按 token 扣费，平台费在购买时收取。" },
  { slug: "subscription-vs-payg", title: "订阅和按量哪个便宜？", description: "关键不是套餐折扣，而是你的月用量是否超过破局点。" },
  { slug: "glm-5-3-flash-cost", title: "GLM-5.3 Flash 真实成本", description: "比较不同平台、不同充值方式下的有效输入和输出成本。" },
];

export const metadata = { title: "长尾专题" };

export default function TopicsPage() {
  return (
    <main className="page-shell">
      <div className="breadcrumbs"><Link href="/">首页</Link><span>/</span><span>长尾专题</span></div>
      <div className="section-heading"><div><h1 style={{ margin: 0, fontSize: 34 }}>长尾专题</h1><p>面向具体搜索意图的比价与成本解释。</p></div></div>
      <div className="grid-3">
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
