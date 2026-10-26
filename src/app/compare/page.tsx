// 文件用途：模型对比页（所属模块：src/app/compare，静态参数 + 动态渲染）
// 经典刚需：把 2-3 个模型放在同一口径里并排比——最低有效输入/输出价
// （只取已核验，无已核验时如实标注）、上下文、能力、平台覆盖数。
// 用 searchParams 驱动 + GET 表单，零客户端状态；链接可直接分享。
import Link from "next/link";
import { getModelBySlug, getPricesForModel, models } from "@/data";
import { enrichPrices } from "@/lib/enrich";
import { formatCny, formatTokens } from "@/lib/format";

export const metadata = {
  title: "模型对比",
  description: "把 2-3 个 AI 模型放在同一口径里对比：已核验最低有效价、上下文长度、能力与平台覆盖。",
};

const MAX_MODELS = 3;

type ComparisonRow = {
  slug: string;
  name: string;
  vendor: string;
  contextLength: number;
  capabilities: string[];
  releaseDate: string;
  cheapestInput: number | null;
  cheapestOutput: number | null;
  cheapestSource: string | null;
  onlyVerified: boolean;
  verifiedCount: number;
  providerCount: number;
};

function buildRow(slug: string): ComparisonRow | null {
  const model = getModelBySlug(slug);
  if (!model) return null;
  const modelPrices = enrichPrices(getPricesForModel(model.id));
  const verified = modelPrices.filter((price) => price.dataStatus === "verified");
  // 对比结论优先建立在已核验价格上；没有已核验时回退并如实标注
  const pool = verified.length > 0 ? verified : modelPrices;
  const cheapest = [...pool].sort((a, b) => a.effectiveInputPrice - b.effectiveInputPrice)[0];
  return {
    slug: model.slug,
    name: model.name,
    vendor: model.vendor,
    contextLength: model.contextLength,
    capabilities: model.capabilities,
    releaseDate: model.releaseDate,
    cheapestInput: cheapest?.effectiveInputPrice ?? null,
    cheapestOutput: cheapest?.effectiveOutputPrice ?? null,
    cheapestSource: cheapest?.provider.name ?? null,
    onlyVerified: verified.length > 0,
    verifiedCount: verified.length,
    providerCount: new Set(modelPrices.map((price) => price.providerId)).size,
  };
}

export default async function ComparePage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {};
  const raw = typeof params.models === "string" ? params.models : "";
  const slugs = raw.split(",").map((slug) => slug.trim()).filter(Boolean).slice(0, MAX_MODELS);
  const rows = slugs.map(buildRow).filter((row): row is ComparisonRow => row !== null);
  // 没带参数时的默认对比组合：两款热门模型 + 一款旗舰
  const defaultSlugs = ["glm-5-3-flash", "kimi-k3", "claude-opus-5"];
  const effectiveSlugs = rows.length > 0 ? rows.map((row) => row.slug) : defaultSlugs;
  const displayRows = rows.length > 0 ? rows : defaultSlugs.map(buildRow).filter((row): row is ComparisonRow => row !== null);

  // 各列的最低值加粗：一眼看出谁便宜
  const minInput = Math.min(...displayRows.map((row) => row.cheapestInput ?? Number.POSITIVE_INFINITY));
  const minOutput = Math.min(...displayRows.map((row) => row.cheapestOutput ?? Number.POSITIVE_INFINITY));
  const maxContext = Math.max(...displayRows.map((row) => row.contextLength));

  return (
    <main className="page-shell">
      <div className="breadcrumbs"><Link href="/">首页</Link><span>/</span><Link href="/models">模型比价</Link><span>/</span><span>模型对比</span></div>
      <div className="section-heading">
        <div>
          <h1 style={{ margin: 0, fontSize: 34 }}>模型对比</h1>
          <p>同一口径并排比：已核验最低有效价、上下文、能力、平台覆盖。对比链接可直接分享。</p>
        </div>
      </div>

      <section className="section card card-pad">
        {/* GET 表单驱动：选完模型提交即更新 URL，可收藏、可分享，不引入客户端状态 */}
        <form method="get" action="/compare" className="form-grid" style={{ alignItems: "end" }}>
          {Array.from({ length: MAX_MODELS }).map((_, index) => (
            <div className="field" key={index}>
              <label htmlFor={`compare-model-${index}`}>模型 {index + 1}{index === 0 ? "（必选）" : index === 1 ? "（必选）" : "（可选）"}</label>
              <select id={`compare-model-${index}`} name="models" className="select" defaultValue={effectiveSlugs[index] ?? ""}>
                <option value="">不选择</option>
                {models.map((model) => <option key={model.slug} value={model.slug}>{model.name}</option>)}
              </select>
            </div>
          ))}
          <div className="field">
            <button type="submit" className="button button-primary" style={{ width: "100%" }}>开始对比</button>
          </div>
        </form>
      </section>

      {displayRows.length < 2 ? (
        <section className="section"><div className="empty">至少选择两个模型才能对比。</div></section>
      ) : (
        <section className="section">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>维度</th>
                  {displayRows.map((row) => (
                    <th key={row.slug}><Link href={`/models/${row.slug}`}>{row.name}</Link></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>厂商</th>
                  {displayRows.map((row) => <td key={row.slug}>{row.vendor}</td>)}
                </tr>
                <tr>
                  <th>最低有效输入价 / 1M</th>
                  {displayRows.map((row) => (
                    <td key={row.slug} className="num">
                      {row.cheapestInput === null ? "—" : (
                        <strong style={row.cheapestInput <= minInput ? { color: "var(--green)" } : undefined}>
                          {formatCny(row.cheapestInput, 3)}
                        </strong>
                      )}
                      {row.cheapestSource && <div className="small muted">{row.cheapestSource}{row.onlyVerified ? " · 已核验" : " · 未核验"}</div>}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th>最低有效输出价 / 1M</th>
                  {displayRows.map((row) => (
                    <td key={row.slug} className="num">
                      {row.cheapestOutput === null ? "—" : (
                        <strong style={row.cheapestOutput <= minOutput ? { color: "var(--green)" } : undefined}>
                          {formatCny(row.cheapestOutput, 3)}
                        </strong>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th>上下文长度</th>
                  {displayRows.map((row) => (
                    <td key={row.slug} className="num">
                      {formatTokens(row.contextLength)}
                      {row.contextLength >= maxContext && row.contextLength === maxContext && <span className="badge badge-neutral" style={{ marginLeft: 6 }}>最长</span>}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th>能力</th>
                  {displayRows.map((row) => <td key={row.slug}><div className="badge-row">{row.capabilities.map((capability) => <span key={capability} className="badge badge-neutral">{capability}</span>)}</div></td>)}
                </tr>
                <tr>
                  <th>已核验价格数</th>
                  {displayRows.map((row) => <td key={row.slug} className="num">{row.verifiedCount}</td>)}
                </tr>
                <tr>
                  <th>收录平台数</th>
                  {displayRows.map((row) => <td key={row.slug} className="num">{row.providerCount}</td>)}
                </tr>
                <tr>
                  <th>发布日期</th>
                  {displayRows.map((row) => <td key={row.slug} className="small">{row.releaseDate}</td>)}
                </tr>
                <tr>
                  <th></th>
                  {displayRows.map((row) => (
                    <td key={row.slug}><Link href={`/models/${row.slug}`} className="button button-small">查看 {row.name} 详情</Link></td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="small muted" style={{ marginTop: 10 }}>
            对比链接：<code className="kbd">/compare?models={effectiveSlugs.join(",")}</code> —— 复制给同事或贴进文档，打开就是同一组对比。
          </div>
        </section>
      )}
    </main>
  );
}
