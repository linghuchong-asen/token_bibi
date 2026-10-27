// 文件用途：服务条款页（所属模块：src/app/terms，静态生成）
// 商业化站点的基本信任件：服务性质、数据时效、免责边界、使用规范。
// 措辞与 about 页免责声明保持同一口径：信息整理工具、不参与交易、不构成建议。
import Link from "next/link";

export const metadata = { title: "服务条款" };
export const lastUpdated = "2026-10-28";

export default function TermsPage() {
  return (
    <main className="page-shell narrow">
      <div className="breadcrumbs"><Link href="/">首页</Link><span>/</span><span>服务条款</span></div>
      <h1 style={{ marginBottom: 8, fontSize: 38, letterSpacing: "-0.03em" }}>服务条款</h1>
      <p className="muted">最后更新：{lastUpdated}。使用 token比比 即表示你同意以下条款。</p>

      <section className="section card card-pad">
        <h2 style={{ marginTop: 0 }}>服务性质</h2>
        <p className="muted">
          token比比提供 AI 模型 API 价格的信息整理与成本核算工具，包括比价、计算器、历史变动与公开数据接口。
          本站不参与任何交易，不代理充值，不出售账号或额度；一切购买行为均发生在各平台官方渠道，相应权利义务由你与平台之间独立成立。
        </p>
      </section>

      <section className="section card card-pad">
        <h2 style={{ marginTop: 0 }}>数据时效与准确性</h2>
        <div className="stack">
          <div className="warning">
            价格与规则具有强时效性：即使每日核验，你看到数字与实际下单之间仍可能发生变动。
            实际价格、计费规则、售后政策一律以平台官方公示为准。
          </div>
          <div className="note">
            每条价格都标注核验状态与来源链接：已核验表示与来源逐字段一致，待核验表示尚未完成比对。
            核验方法见 <Link href="/data-status" className="strong">数据状态页</Link>。
          </div>
        </div>
      </section>

      <section className="section card card-pad">
        <h2 style={{ marginTop: 0 }}>免责声明</h2>
        <p className="muted">
          本站内容按"现状"提供，不构成购买建议、投资建议或对任何平台的担保。
          因使用本站信息做出的决策及其后果，由你自行承担。在法律允许的最大范围内，本站不对因使用或无法使用本服务造成的损失承担责任。
        </p>
      </section>

      <section className="section card card-pad">
        <h2 style={{ marginTop: 0 }}>使用规范</h2>
        <ul className="muted" style={{ paddingLeft: 18, marginBottom: 0 }}>
          <li>公开数据接口有频率限制（免费层 60 次/分钟/IP），请勿绕过限流或滥用表单接口。</li>
          <li>引用本站数据时请注明来源并附页面链接；批量转载或商用接入请使用 <Link href="/data-api" className="strong">数据 API</Link>。</li>
          <li>不得利用本站从事违反适用法律法规的活动。</li>
        </ul>
      </section>

      <section className="section card card-pad">
        <h2 style={{ marginTop: 0 }}>知识产权与条款变更</h2>
        <p className="muted">
          站点设计与原创内容（计算方法、核验方法、专题文章）的版权归 token比比 所有；收录的价格事实数据本身欢迎规范引用。
          条款如有更新，以本页最新版本为准；重大变更会在首页公告。
        </p>
      </section>
    </main>
  );
}
