// 文件用途：隐私政策页（所属模块：src/app/privacy，静态生成）
// 商业化站点的基本信任件：如实说明本站收集什么、不收集什么。
// 与实际行为严格对应：无账号系统、无第三方追踪脚本；
// 表单提交内容（纠错/广告申请）会存入站点数据库供运营查看，这一点必须写明。
import Link from "next/link";

export const metadata = { title: "隐私政策" };
export const lastUpdated = "2026-10-28";

export default function PrivacyPage() {
  return (
    <main className="page-shell narrow">
      <div className="breadcrumbs"><Link href="/">首页</Link><span>/</span><span>隐私政策</span></div>
      <h1 style={{ marginBottom: 8, fontSize: 38, letterSpacing: "-0.03em" }}>隐私政策</h1>
      <p className="muted">最后更新：{lastUpdated}。本政策描述 token比比 处理信息的方式。我们刻意让这件事很简单：能不收就不收。</p>

      <section className="section card card-pad">
        <h2 style={{ marginTop: 0 }}>我们不收集什么</h2>
        <ul className="muted" style={{ paddingLeft: 18, marginBottom: 0 }}>
          <li><strong>不需要注册账号</strong>：浏览、比价、计算、订阅 RSS 都不要求任何身份信息。</li>
          <li><strong>没有第三方追踪脚本</strong>：不嵌入广告联盟的追踪代码，不做跨站用户画像。</li>
          <li><strong>不使用登录态 Cookie</strong>：站点无账号系统，不种登录/追踪 Cookie。</li>
        </ul>
      </section>

      <section className="section card card-pad">
        <h2 style={{ marginTop: 0 }}>我们会收集什么（仅当你主动提交）</h2>
        <div className="stack">
          <div className="note">
            <strong>数据纠错表单（/feedback）与广告申请表单（/advertise）：</strong>
            你在表单里填写的内容（联系方式、描述、截图链接）会保存到站点数据库，仅用于处理你的反馈或商务沟通，不对外公开、不出售、不用于营销群发。
          </div>
          <div className="note">
            <strong>分享链接：</strong>
            使用"生成分享链接"时，计算参数会编码在链接本身（URL 参数）里，服务器不留存这些参数与你的身份的关联。
          </div>
        </div>
      </section>

      <section className="section card card-pad">
        <h2 style={{ marginTop: 0 }}>自动记录的技术信息</h2>
        <p className="muted">
          为防止滥用（如接口刷量），公开 API 与表单接口会按 IP 做限流计数。
          IP 仅用于限流与安全审计，不与浏览行为做用户级关联分析。
        </p>
      </section>

      <section className="section card card-pad">
        <h2 style={{ marginTop: 0 }}>你的控制权</h2>
        <p className="muted">
          想删除已提交的表单信息，或对数据处理有任何疑问，通过 <Link href="/feedback" className="strong">反馈表单</Link> 联系我们，
          说明大致提交时间与内容即可定位。政策若有实质变更，会在本页更新"最后更新"日期。
        </p>
      </section>
    </main>
  );
}
