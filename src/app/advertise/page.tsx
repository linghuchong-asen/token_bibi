import Link from "next/link";
import { sponsors } from "@/data";

export const metadata = { title: "赞助位合作" };

export default function AdvertisePage() {
  return (
    <main className="page-shell narrow">
      <div className="breadcrumbs"><Link href="/">首页</Link><span>/</span><span>赞助位合作</span></div>
      <h1 style={{ marginBottom: 8, fontSize: 38, letterSpacing: "-0.03em" }}>赞助位合作</h1>
      <p className="muted">把服务展示给正在比较 AI 成本的人。所有商业内容都会明确标注。</p>

      <section className="section stack">
        {sponsors.map((sponsor) => (
          <article className="card card-pad" key={sponsor.id}>
            <div className="badge-row">
              <span className="badge">{sponsor.label}</span>
              <span className="badge badge-neutral">{sponsor.placement}</span>
            </div>
            <h2 style={{ margin: "12px 0 4px" }}>{sponsor.title}</h2>
            <p className="muted" style={{ marginTop: 0 }}>{sponsor.description}</p>
            <div className="small muted">赞助方：{sponsor.sponsorName}</div>
          </article>
        ))}
      </section>

      <section className="section card card-pad">
        <h2 style={{ marginTop: 0 }}>投放规范</h2>
        <div className="stack">
          <div className="note">广告位数量固定，满额后不加塞。</div>
          <div className="warning">赞助不会改变价格、有效成本、稳定性评分或自然排序。</div>
          <div className="danger">不接受“官方推荐”“最稳定”“包可用”等无法核验的表述。</div>
        </div>
      </section>
    </main>
  );
}
