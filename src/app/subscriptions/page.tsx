// 文件用途：订阅套餐页（所属模块：src/app/subscriptions，静态生成）
// 定位是"订阅怎么算"的方法论页 + 真实按量基线表，而不是套餐货架：
// 收录的套餐必须来自平台官方公示且经过核验，没有核验过的套餐一律不上架。
// 页面给出订阅折算与破局点的计算方法，并用当前已核验的按量价格做基线，
// 用户可以代入任意一个候选套餐自行估算回本点；交互估算交给 /calculator。
import Link from "next/link";
import { prices } from "@/data";
import { enrichPrices } from "@/lib/enrich";
import { formatCny } from "@/lib/format";

export const metadata = { title: "订阅套餐" };

export default function SubscriptionsPage() {
  // 每个模型取已核验价格里的最低有效输入/输出价，作为订阅估算的按量基线
  const verified = enrichPrices(prices).filter((row) => row.dataStatus === "verified");
  const cheapestByModel = new Map<string, { name: string; provider: string; input: number; output: number }>();
  for (const row of verified) {
    const current = cheapestByModel.get(row.modelId);
    if (!current || row.effectiveInputPrice < current.input) {
      cheapestByModel.set(row.modelId, {
        name: row.model.name,
        provider: row.provider.name,
        input: row.effectiveInputPrice,
        output: row.effectiveOutputPrice,
      });
    }
  }
  const baseline = Array.from(cheapestByModel.values()).sort((a, b) => a.input - b.input).slice(0, 12);

  return (
    <main className="page-shell">
      <div className="breadcrumbs"><Link href="/">首页</Link><span>/</span><span>订阅套餐</span></div>
      <div className="section-heading">
        <div>
          <h1 style={{ margin: 0, fontSize: 34 }}>订阅套餐怎么算</h1>
          <p>不要只看月费，先看额度、重置周期、模型范围和破局点。</p>
        </div>
        <Link href="/calculator" className="button button-primary">用用量计算</Link>
      </div>

      <section className="note card-pad card">
        <strong>收录口径：</strong>订阅套餐必须来自平台官方公示且经过核验才会上架（标注核验状态与来源）。
        当前收录以按量计费为主，暂无已核验的订阅套餐——下面先给出计算方法和按量基线，
        任何一个候选套餐都可以代入自行估算。
      </section>

      <section className="section grid-3">
        <div className="card card-pad">
          <h2 style={{ marginTop: 0 }}>① 折算单价</h2>
          <div className="stack small muted">
            <div>订阅折算单价 = 月费 ÷ 套餐额度</div>
            <div>得到"每 1M tokens 多少钱"，与按量价同口径可比。</div>
          </div>
        </div>
        <div className="card card-pad">
          <h2 style={{ marginTop: 0 }}>② 破局点</h2>
          <div className="stack small muted">
            <div>破局点（tokens）= 月费 ÷ 按量有效单价</div>
            <div>月用量低于破局点时按量更省，高于时订阅更划算。</div>
          </div>
        </div>
        <div className="card card-pad">
          <h2 style={{ marginTop: 0 }}>③ 修正项</h2>
          <div className="stack small muted">
            <div>额度常按输入价折算，输出价通常是输入的 3~5 倍。</div>
            <div>模型范围、重置周期、超额规则都会改变真实可用性。</div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>按量基线（已核验最低价）</h2>
            <p>把候选套餐的"月费 ÷ 你的月用量"与这里的单价比一比，就知道值不值。</p>
          </div>
          <Link href="/models" className="button button-small">查看全部模型</Link>
        </div>
        <div className="card card-pad table-wrap">
          <table className="table">
            <thead>
              <tr><th>模型</th><th>最低价平台</th><th className="num">有效输入价 / 1M</th><th className="num">有效输出价 / 1M</th></tr>
            </thead>
            <tbody>
              {baseline.map((row) => (
                <tr key={row.name}>
                  <td className="strong">{row.name}</td>
                  <td>{row.provider}</td>
                  <td className="num">{formatCny(row.input, 3)}</td>
                  <td className="num">{formatCny(row.output, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section card card-pad">
        <h2 style={{ marginTop: 0 }}>订阅页要重点看什么？</h2>
        <div className="grid-3">
          <div className="note">额度是否按月重置，还是会累计。</div>
          <div className="warning">"不限额度"不等于无限制，仍受模型、并发和分组规则约束。</div>
          <div className="danger">年付折扣看起来更低，但要先确认退款和降级规则。</div>
        </div>
      </section>
    </main>
  );
}
