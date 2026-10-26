// 文件用途：全站页脚（所属模块：src/components，所有页面共用）
// 含页脚赞助位、核心入口链接与商业入口（广告位、数据 API）——
// 盈利入口需要稳定、全站可见的曝光位置。
import { getSponsorForPlacement } from "@/data";
import { SponsorSlot } from "./SponsorSlot";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "20px 24px 0" }}>
        <SponsorSlot sponsor={getSponsorForPlacement("footer")} compact />
      </div>
      <div className="footer-inner">
        <div>
          <strong>token比比</strong>
          <span className="muted"> · 不要只看 token 单价，先看真实到手成本。</span>
        </div>
        <div className="footer-links">
          <a href="/about">数据方法</a>
          <a href="/data-status">数据状态</a>
          <a href="/faq">常见问题</a>
          <a href="/feed.xml">RSS 订阅</a>
          <a href="/feedback">数据纠错</a>
          <a href="/about#disclaimer">免责声明</a>
          <a href="/models">模型比价</a>
          <a href="/providers">平台比价</a>
          <a href="/advertise">广告合作</a>
          <a href="/data-api">数据 API</a>
        </div>
        <div>© 2026 token比比 · 价格标注核验状态，套餐与规则部分仍为样例数据</div>
      </div>
    </footer>
  );
}
