// 文件用途：全站顶部导航（所属模块：src/components，所有页面共用）
// "数据状态"入口常驻导航：数据可信度是本产品的卖点，必须让用户随时能查证。
const links = [
  { href: "/models", label: "模型比价" },
  { href: "/providers", label: "平台比价" },
  { href: "/subscriptions", label: "订阅" },
  { href: "/credits", label: "积分 / 充值" },
  { href: "/card-keys", label: "卡密 / 兑换码" },
  { href: "/calculator", label: "计算器" },
  { href: "/data-status", label: "数据状态" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a href="/" className="brand" aria-label="token比比首页">
          <span className="brand-mark">比</span>
          <span>token比比</span>
        </a>
        <nav className="nav-links" aria-label="主导航">
          {links.map((link) => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
        </nav>
        <div className="nav-actions">
          <a href="/about" className="button button-small button-ghost">数据方法</a>
          <a href="/calculator" className="button button-small button-primary">开始计算</a>
        </div>
      </div>
    </header>
  );
}
