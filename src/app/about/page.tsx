import Link from "next/link";

export const metadata = { title: "数据方法与商业边界" };

export default function AboutPage() {
  return (
    <main className="page-shell narrow">
      <div className="breadcrumbs"><Link href="/">首页</Link><span>/</span><span>数据方法</span></div>
      <h1 style={{ marginBottom: 8, fontSize: 38, letterSpacing: "-0.03em" }}>数据方法与商业边界</h1>
      <p className="muted">token比比先解决“真实成本可解释”，再考虑商业合作。</p>

      <section className="section grid-3">
        <div className="card card-pad">
          <h2 style={{ marginTop: 0 }}>数据方法</h2>
          <ul className="muted" style={{ paddingLeft: 18, marginBottom: 0 }}>
            <li>公开来源优先</li>
            <li>人工核验与定期快照</li>
            <li>来源、更新时间可见</li>
            <li>用户可提交纠错</li>
          </ul>
        </div>
        <div className="card card-pad">
          <h2 style={{ marginTop: 0 }}>计算口径</h2>
          <div className="stack small muted">
            <div>有效成本 = 标价 × 充值系数 × 模型倍率 × 分组倍率</div>
            <div>订阅成本 = 套餐价格 ÷ 套餐额度</div>
            <div>破局点 = 按量成本等于订阅成本时的用量</div>
          </div>
        </div>
        <div className="card card-pad">
          <h2 style={{ marginTop: 0 }}>商业边界</h2>
          <ul className="muted" style={{ paddingLeft: 18, marginBottom: 0 }}>
            <li>广告与 AFF 单独标注</li>
            <li>商业合作不影响默认排序</li>
            <li>不隐藏风险提示</li>
            <li>收录不等于推荐</li>
          </ul>
        </div>
      </section>

      <section className="section card card-pad">
        <h2 style={{ marginTop: 0 }}>当前阶段</h2>
        <p className="muted">当前为产品 MVP 验证阶段。价格来自公开来源并标注核验状态；套餐、积分和卡密等规则仍有样例数据，下单前请以平台公示为准。</p>
        <div className="note">如果你发现数据错误，请记录平台、模型、页面链接和截图，后续可在后台提交纠错。</div>
      </section>

      <section id="disclaimer" className="section card card-pad">
        <h2 style={{ marginTop: 0 }}>免责声明</h2>
        <p className="muted">token比比提供的是信息整理和成本计算工具，不参与交易、不开账号、不做担保。用户应自行核验平台价格、条款、售后和合规要求。</p>
      </section>
    </main>
  );
}
