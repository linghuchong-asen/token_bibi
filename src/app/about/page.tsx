// 文件用途：数据方法、运营主体与商业边界页（所属模块：src/app/about，静态生成）
// 回答四类问题：我们是谁（运营主体）、数据怎么来的（真实性）、
// 怎么联系（反馈渠道）、本站怎么赚钱（商业透明）。
// 页面顶部的规模数字直接从数据文件读取，随每日管线自动更新，避免手写过期。
import Link from "next/link";
import { models, prices, providers } from "@/data";

export const metadata = { title: "关于本站 · 数据方法与商业边界" };

export default function AboutPage() {
  const verifiedCount = prices.filter((price) => price.dataStatus === "verified").length;
  const activeProviders = providers.filter((provider) => provider.dataStatus === "verified").length;

  return (
    <main className="page-shell narrow">
      <div className="breadcrumbs"><Link href="/">首页</Link><span>/</span><span>关于本站</span></div>
      <h1 style={{ marginBottom: 8, fontSize: 38, letterSpacing: "-0.03em" }}>数据方法与商业边界</h1>
      <p className="muted">
        token比比收录 {models.length} 个模型、{providers.length} 个平台、{prices.length} 条价格，
        其中 {verifiedCount} 条价格全部与平台实时来源逐字段核对（{activeProviders} 个平台已接入每日自动采集）。
        先解决"真实成本可解释"，再考虑商业合作。
      </p>

      <section className="section card card-pad">
        <h2 style={{ marginTop: 0 }}>我们是谁</h2>
        <p className="muted">
          token比比由独立开发者维护运营，不含投资与导购背景，与下述收录平台无股权或代理关系。
          站点不参与交易、不代充值、不卖账号——我们只做"成本核算与比价"这一层，所有购买行为都发生在平台官方渠道。
        </p>
      </section>

      <section className="section grid-3">
        <div className="card card-pad">
          <h2 style={{ marginTop: 0 }}>数据方法</h2>
          <ul className="muted" style={{ paddingLeft: 18, marginBottom: 0 }}>
            <li>公开来源优先，每条价格带来源链接</li>
            <li>每日 03:45 自动采集 + 实时来源比对</li>
            <li>源站改价/下架，核验状态自动降级并留痕</li>
            <li>用户可提交纠错，核验方法公开</li>
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
        <h2 style={{ marginTop: 0 }}>我们怎么赚钱</h2>
        <p className="muted">盈利方式全部公开。数据侧与商业侧分离：收入来源无法改变任何一条价格、评分或排序。</p>
        <div className="stack">
          <div className="note"><strong>① 广告位：</strong>固定数量的位次（首页 / 比价页 / 页脚），明码标价、明确标注，售完即止。<Link href="/advertise" className="strong">查看刊例价 →</Link></div>
          <div className="note"><strong>② 数据 API 订阅：</strong>免费层人人可用；Pro / 企业层提供更高配额、历史价格与变动推送。<Link href="/data-api" className="strong">查看 API →</Link></div>
          <div className="note"><strong>③ 推广分成（AFF）：</strong>个别平台的"访问官网"按钮可能是推广链接，出现时页面会明确披露；没有披露的链接不带任何返佣。</div>
        </div>
        <div className="warning">以上收入都不会改变：已核验价格的判定标准、比价的默认排序、风险的披露口径。</div>
      </section>

      <section className="section card card-pad">
        <h2 id="contact" style={{ marginTop: 0 }}>联系我们</h2>
        <div className="stack">
          <div><strong>数据纠错 / 合作咨询：</strong><Link href="/feedback" className="strong">在线反馈表单</Link>（直达运营后台，最快）</div>
          <div><strong>广告投放：</strong><Link href="/advertise" className="strong">自助刊例与申请入口</Link></div>
          <div><strong>数据接入：</strong><Link href="/data-api" className="strong">公开 API</Link> 与 <Link href="/feed.xml" className="strong">RSS</Link> 可直接订阅价格变动</div>
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>
          提交纠错时请附：平台、模型、页面链接、平台公示截图。每一条纠错都会进入人工复核队列并在数据状态页留痕。
        </p>
      </section>

      <section id="disclaimer" className="section card card-pad">
        <h2 style={{ marginTop: 0 }}>免责声明</h2>
        <p className="muted">
          token比比提供的是信息整理和成本计算工具，不参与交易、不开账号、不做担保。
          价格与规则存在时效性，实际以平台官方公示为准；用户应自行核验平台价格、条款、售后和合规要求。
          详见 <Link href="/terms" className="strong">服务条款</Link> 与 <Link href="/privacy" className="strong">隐私政策</Link>。
        </p>
      </section>
    </main>
  );
}
