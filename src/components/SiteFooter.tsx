// 文件用途：全站页脚（所属模块：src/components，所有页面共用）
// 四栏结构：品牌区 + 产品入口 + 数据与信任 + 商业合作与法律文件。
// 盈利入口需要稳定、全站可见的曝光位置；法律文件（隐私政策/服务条款）
// 是商业化站点的基本信任件，一并放在页脚可达。
import Link from "next/link";
import { getSponsorForPlacement } from "@/data";
import { SponsorSlot } from "./SponsorSlot";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "20px 24px 0" }}>
        <SponsorSlot sponsor={getSponsorForPlacement("footer")} compact />
      </div>
      <div className="footer-inner">
        <div className="footer-cols">
          <div>
            <strong>token比比</strong>
            <p className="muted small" style={{ margin: "8px 0 0", maxWidth: 260 }}>
              AI 模型 API 真实成本比价：按量、订阅、积分、卡密放在同一口径里比较。价格每日与平台实时来源逐字段复核。
            </p>
          </div>
          <div className="footer-col">
            <strong className="small">产品</strong>
            <Link href="/models">模型比价</Link>
            <Link href="/providers">平台比价</Link>
            <Link href="/compare">模型对比</Link>
            <Link href="/calculator">成本计算器</Link>
            <Link href="/price-drops">降价动态</Link>
          </div>
          <div className="footer-col">
            <strong className="small">数据与信任</strong>
            <Link href="/data-status">数据状态</Link>
            <Link href="/about">数据方法</Link>
            <Link href="/faq">常见问题</Link>
            <Link href="/feedback">数据纠错</Link>
            <Link href="/feed.xml">RSS 订阅</Link>
          </div>
          <div className="footer-col">
            <strong className="small">商业与法律</strong>
            <Link href="/advertise">广告合作</Link>
            <Link href="/data-api">数据 API</Link>
            <Link href="/privacy">隐私政策</Link>
            <Link href="/terms">服务条款</Link>
            <Link href="/about#disclaimer">免责声明</Link>
          </div>
        </div>
        <div className="small muted">© 2026 token比比 · 价格标注核验状态与来源，套餐/卡密等未核验信息一律不上架</div>
      </div>
    </footer>
  );
}
