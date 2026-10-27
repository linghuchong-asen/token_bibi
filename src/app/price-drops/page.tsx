// 文件用途：最近降价动态页（所属模块：src/app/price-drops，每次构建随数据刷新）
// 定位：RSS 的落地页 + "AI 模型降价"类搜索的长尾承接。
// 数据来自每日管线的价格变动记录，只列真实的输入/输出价下调事件；
// 没有降价时如实说没有——宁可页面空，也不编造降价制造噱头。
import Link from "next/link";
import { getModelById, priceChanges } from "@/data";
import { formatCny, formatDate } from "@/lib/format";

export const metadata = {
  title: "AI 模型降价动态",
  description: "每日自动检测的 AI 模型价格下调记录：哪家平台、哪个模型、降了多少，全部来自公开来源逐字段复核。",
  openGraph: {
    title: "AI 模型降价动态 · token比比",
    description: "每日检测的真实价格下调记录，每一笔都有前后值与检测时间。",
  },
  twitter: { card: "summary_large_image" },
};

type CutEvent = {
  modelId: string;
  modelName: string;
  providerId: string;
  field: string;
  from: number;
  to: number;
  percent: number;
};

const FIELD_LABELS: Record<string, string> = {
  inputPricePerMTokens: "输入价",
  outputPricePerMTokens: "输出价",
};

export default function PriceDropsPage() {
  // 只挑出真实的价格下调（含缓存价），状态/计费方式变化不算降价
  const cuts: CutEvent[] = [];
  for (const change of priceChanges.changes) {
    const model = getModelById(change.modelId);
    for (const diff of change.changes) {
      if (
        (diff.field === "inputPricePerMTokens" || diff.field === "outputPricePerMTokens") &&
        typeof diff.from === "number" &&
        typeof diff.to === "number" &&
        diff.to < diff.from
      ) {
        cuts.push({
          modelId: change.modelId,
          modelName: model?.name ?? change.modelId,
          providerId: change.providerId,
          field: FIELD_LABELS[diff.field] ?? diff.field,
          from: diff.from,
          to: diff.to,
          percent: diff.from === 0 ? 0 : ((diff.to - diff.from) / diff.from) * 100,
        });
      }
    }
  }
  // 降幅大的排前面，营销页的第一屏要能看到最实在的数字
  cuts.sort((a, b) => a.percent - b.percent);

  return (
    <main className="page-shell">
      <div className="breadcrumbs"><Link href="/">首页</Link><span>/</span><span>降价动态</span></div>
      <div className="section-heading">
        <div>
          <h1 style={{ margin: 0, fontSize: 34 }}>AI 模型降价动态</h1>
          <p>每日与公开来源逐字段核对，价格下调会第一时间出现在这里——每一笔都有前后值。</p>
        </div>
        <Link href="/feed.xml" className="button button-primary">RSS 订阅降价通知</Link>
      </div>

      {cuts.length === 0 ? (
        <section className="section">
          {/* 空态同样给出检测时间与基线：没有降价也要说明"什么时候查的" */}
          <div className="note">
            最近一轮对比没有发现降价。采集每日进行，订阅 RSS 可在价格下调时第一时间收到通知。
            <div className="small muted" style={{ marginTop: 6 }}>
              检测时间：{formatDate(priceChanges.generatedAt)} · 基线：上一个快照 · 完整变动记录见<Link href="/data-status" className="strong">数据状态页</Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="section">
          <div className="grid-3">
            {cuts.map((cut) => (
              <article className="card card-pad" key={`${cut.modelId}-${cut.field}`}>
                <div className="badge-row">
                  <span className="badge badge-green">{cut.field}下调 {Math.abs(cut.percent).toFixed(1)}%</span>
                </div>
                <h2 style={{ margin: "12px 0 4px", fontSize: 22 }}>
                  <Link href={`/models/${getModelById(cut.modelId)?.slug ?? ""}`} className="strong">{cut.modelName}</Link>
                </h2>
                <div className="metric-value" style={{ fontSize: 26 }}>
                  {formatCny(cut.from, 3)} → {formatCny(cut.to, 3)}
                </div>
                <div className="small muted">{cut.providerId} · 每 1M tokens</div>
              </article>
            ))}
          </div>
          <div className="small muted" style={{ marginTop: 12 }}>
            检测时间：{formatDate(priceChanges.generatedAt)} · 基线：上一个快照 · 完整变动记录见<Link href="/data-status" className="strong">数据状态页</Link>
          </div>
        </section>
      )}

      <section className="section card card-pad stack">
        <h2 style={{ marginTop: 0 }}>为什么敢说这些数字是真的？</h2>
        <div className="stack">
          <div className="note">每日自动采集 OpenRouter、SiliconFlow、Anthropic、智谱的公开价格，逐字段与库内记录比对。</div>
          <div className="warning">只有与源站完全一致的记录才挂"已核验"；源站改价后徽章自动撤销，降价记录也会随之更新。</div>
          <div className="danger">我们不做"预测降价"或"独家渠道价"——只记录已经发生的、可复核的价格事实。</div>
        </div>
        <Link href="/data-status" className="small" style={{ fontWeight: 700 }}>查看完整核验机制 →</Link>
      </section>
    </main>
  );
}
