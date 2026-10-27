// 文件用途：卡密 / 兑换码页（所属模块：src/app/card-keys，静态生成）
// 定位是"购买路径风险指南"：卡密是灰色地带最容易出现欺诈的购买方式，
// 在没有逐平台可核验的规则数据之前，不放任何具体平台条目，
// 只给通用的核验方法与风险框架——宁缺毋假。
// 各平台的"卡密支持情况"会在平台详情页以"未发现公开入口/待核验"如实呈现。
import Link from "next/link";

export const metadata = { title: "卡密 / 兑换码" };

export default function CardKeysPage() {
  return (
    <main className="page-shell">
      <div className="breadcrumbs"><Link href="/">首页</Link><span>/</span><span>卡密 / 兑换码</span></div>
      <div className="section-heading">
        <div>
          <h1 style={{ margin: 0, fontSize: 34 }}>卡密 / 兑换码怎么避坑</h1>
          <p>这是购买路径和风险维度，不直接参与价格倍率计算。</p>
        </div>
        <Link href="/credits" className="button">先看充值汇率</Link>
      </div>

      <section className="warning card-pad card">
        <strong>为什么这页没有平台条目：</strong>卡密规则散落在私下渠道，难核验、易造假。
        本站只收录可核验的数据——在拿到平台官方公示的卡密规则之前，这里不放任何具体条目。
        平台详情页会如实标注"未发现公开入口 / 待核验"。
      </section>

      <section className="section grid-3">
        <div className="card card-pad">
          <h2 style={{ marginTop: 0 }}>第一步：认入口</h2>
          <div className="stack small muted">
            <div>兑换码只认平台官方站内的兑换入口，任何"站外代充"都脱离了平台规则保护。</div>
            <div>先到平台官网确认是否官方发行过兑换码，没有公示就是高风险。</div>
          </div>
        </div>
        <div className="card card-pad">
          <h2 style={{ marginTop: 0 }}>第二步：小钱试单</h2>
          <div className="stack small muted">
            <div>第一次购买用最小面额试单：确认能兑换、能计费、能开发票再考虑加量。</div>
            <div>截图保存商品页、聊天记录和支付凭证——事后维权全靠这些。</div>
          </div>
        </div>
        <div className="card card-pad">
          <h2 style={{ marginTop: 0 }}>第三步：算真实成本</h2>
          <div className="stack small muted">
            <div>兑换码面额 ÷ 实付金额 = 真实折扣，再乘上平台充值汇率与模型倍率。</div>
            <div>用 <Link href="/calculator" className="strong">成本计算器</Link> 代入，别信卖家口中的"几折"。</div>
          </div>
        </div>
      </section>

      <section className="section card card-pad">
        <h2 style={{ marginTop: 0 }}>常见风险信号</h2>
        <div className="stack">
          <div className="danger">价格明显低于官方汇率（例如 5 折以下）：大概率是黑卡、盗刷或共享账号，随时封停。</div>
          <div className="warning">只接受私下转账、不发商品链接：没有平台担保，纠纷时无处追责。</div>
          <div className="warning">宣称"永久有效/无限额度"：正规平台额度都有重置周期与模型限制。</div>
          <div className="note">兑换码只是获取额度的一种路径，不等于折扣；真实成本永远以折算后的单价为准。</div>
        </div>
      </section>
    </main>
  );
}
