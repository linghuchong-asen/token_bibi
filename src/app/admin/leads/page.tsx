// 文件用途：销售线索后台（所属模块：src/app/admin/leads，动态渲染）
// 盈利闭环的运营端：/advertise 与 /data-api 提交的申请最终都汇入
// data/sponsor-leads.jsonl，这里用 ADMIN_TOKEN 查看与跟进。
// 页面本身不含数据，数据经 /api/admin/leads 鉴权后加载。
import { AdminLeadsClient } from "@/components/AdminLeadsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "线索后台" };

export default function AdminLeadsPage() {
  return (
    <main className="page-shell narrow">
      <div className="breadcrumbs"><span>管理</span><span>/</span><span>线索</span></div>
      <div className="section-heading">
        <div><h1 style={{ margin: 0, fontSize: 34 }}>销售线索</h1><p>广告位投放申请与数据 API 订阅咨询，按提交时间倒序。</p></div>
        <span className="badge badge-amber">需要 ADMIN_TOKEN</span>
      </div>
      <AdminLeadsClient />
      <section className="section card card-pad stack">
        <h2 style={{ marginTop: 0 }}>跟进约定</h2>
        <div className="stack small muted">
          <div>1. 所有线索在 1 个工作日内回复（广告位见 /advertise 承诺；API 见 /data-api 承诺）。</div>
          <div>2. 跟进完成后手工把该行 status 从 new 改为 done（MVP 阶段直接编辑 JSONL，后续再做状态流转）。</div>
          <div>3. 线索属于商业敏感数据：不要截图外发，不要把令牌或内容贴进公开渠道。</div>
        </div>
      </section>
    </main>
  );
}
