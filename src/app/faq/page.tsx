// 文件用途：常见问题页（所属模块：src/app/faq，静态生成）
// 定位：程序化 SEO 的长尾承接页——接住"AI API 怎么算钱""token 多少钱"
// "中转站能不能用"这类搜索意图；同时输出 FAQPage JSON-LD，
// 让搜索引擎/answer engine 可以直接引用问答（GEO）。
// 答案全部来自站内既有事实（数据方法、核验机制、商业边界），不新增承诺。
import Link from "next/link";

export const metadata = {
  title: "常见问题",
  description: "AI 模型 API 价格怎么算、token比比 的数据怎么核验、中转站风险、订阅和按量怎么选——关于 AI 成本比价的常见问题。",
};

const FAQS = [
  {
    question: "1M tokens 的价格是什么意思？我实际会花多少钱？",
    answer:
      "1M tokens 价格是每 100 万 token 的单价，输入和输出通常不同价。实际花费 = 输入 token 数 × 输入价 + 输出 token 数 × 输出价（缓存命中另有缓存价）。一次普通对话大约几千 token，你可以用成本计算器按自己的用量估算。",
  },
  {
    question: "标价便宜就真的便宜吗？",
    answer:
      "不一定。很多平台通过充值汇率、模型倍率、分组倍率改变真实成本：同样标价，1 元 = 1.2 额度和 1 元 = 0.8 额度是两种世界。token比比 的「有效成本」 = 标价 × 充值系数 × 模型倍率 × 分组倍率，比价页排序用的是有效成本而不是标价。",
  },
  {
    question: "token比比 的价格数据是哪来的，可信吗？",
    answer:
      "价格来自各平台公开定价页与官方 API，由脚本每日自动采集。只有与公开来源逐字段一致（输入价、输出价、缓存价完全相同）的记录才标记为「已核验」；源站改价或模型下架时，已核验徽章会被自动撤销。全部核验情况在数据状态页公开。",
  },
  {
    question: "价格上的「已核验 / 待核验」是什么意思？",
    answer:
      "已核验表示这条价格与平台实时公开来源逐字段比对过（输入价、输出价、缓存价完全一致）；待核验表示还没完成这一轮比对，或源站已不再认可这条价格。比价页默认只显示已核验价格，每条都带来源链接和更新时间，全部核验统计在数据状态页公开。",
  },
  {
    question: "订阅套餐和按量计费怎么选？",
    answer:
      "关键看你的月用量是否超过订阅的「破局点」——按量成本正好等于订阅月费时的用量。低于破局点按量更划算，超过才值得订阅。注意订阅额度受模型范围、重置周期和超额规则约束，不是无限额度。",
  },
  {
    question: "API 中转站 / 卡密兑换码能用吗？有什么风险？",
    answer:
      "中转站和卡密只是购买路径，不改变模型本身，但售后、退款、余额有效期和跑路风险都落在购买路径上。token比比 会标注每个平台的风险因素（上游类型、发票、退款政策、卡密支持情况）。收录不等于推荐，下单前请以平台公示为准。",
  },
  {
    question: "价格多久更新一次？怎么第一时间知道降价？",
    answer:
      "每日自动采集并复核一次；检测到价格变化时，已核验徽章会按实际情况保留或撤销，并在数据状态页留痕。你可以订阅 RSS（/feed.xml）在价格调整时第一时间收到通知；开发者可以直接调用免费的价格 API。",
  },
  {
    question: "token比比 怎么盈利？会不会影响数据客观性？",
    answer:
      "收入来自固定数量的广告位、数据 API 订阅和个别平台的推广分成，全部在页面上明示。数据侧与商业侧分离：收入来源无法改变已核验价格的判定标准、比价排序和风险披露口径。",
  },
];

export default function FaqPage() {
  // FAQPage JSON-LD：答案原文同步输出，搜索引擎可以直接引用
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <main className="page-shell narrow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="breadcrumbs"><Link href="/">首页</Link><span>/</span><span>常见问题</span></div>
      <h1 style={{ marginBottom: 8, fontSize: 38, letterSpacing: "-0.03em" }}>关于 AI 成本比价的常见问题</h1>
      <p className="muted">关于 token 价格、核验机制、购买路径风险和商业边界的所有关键问题，一次说清。</p>

      <section className="section stack">
        {FAQS.map((faq, index) => (
          <article className="card card-pad" key={faq.question}>
            <h2 style={{ marginTop: 0, fontSize: 20 }}>{index + 1}. {faq.question}</h2>
            <p className="muted" style={{ marginBottom: 0 }}>{faq.answer}</p>
          </article>
        ))}
      </section>

      <section className="section card card-pad">
        <h2 style={{ marginTop: 0 }}>还有别的问题？</h2>
        <p className="muted">数据问题请到数据纠错页提交（带来源链接更容易被采纳）；商业合作见页脚"广告合作"与"数据 API"。</p>
        <div className="hero-actions">
          <Link href="/feedback" className="button">提交数据纠错</Link>
          <Link href="/data-status" className="button">查看数据状态</Link>
        </div>
      </section>
    </main>
  );
}
