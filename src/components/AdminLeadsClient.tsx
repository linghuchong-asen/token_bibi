"use client";

// 文件用途：销售线索后台客户端（所属模块：src/components）
// 运营者输入 ADMIN_TOKEN 后加载 data/sponsor-leads.jsonl 的全部线索。
// 与 AdminReviewClient 同一套交互约定：令牌只保存在本页内存中，
// 不落 localStorage、不打日志——商业敏感数据按最高标准处理。
import { useState } from "react";

type Lead = {
  id: string;
  createdAt: string;
  status: string;
  product: string;
  placement?: string;
  company: string;
  contact: string;
  email: string;
  budget?: string;
  message?: string;
};

const PRODUCT_LABELS: Record<string, string> = {
  sponsor_slot: "广告位",
  api_subscription: "数据 API",
};

export function AdminLeadsClient() {
  const [token, setToken] = useState("");
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function load(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/admin/leads", { headers: { "x-admin-token": token } });
      const result = await response.json();
      if (response.status === 503) throw new Error("服务端未配置 ADMIN_TOKEN（.env.production）");
      if (response.status === 401) throw new Error("令牌不正确");
      if (!response.ok) throw new Error(result.error || "加载失败");
      setLeads(result.leads);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "加载失败");
    }
  }

  return (
    <div className="stack">
      <form className="card card-pad stack" onSubmit={load}>
        <div className="field">
          <label htmlFor="leads-token">ADMIN_TOKEN</label>
          <input id="leads-token" type="password" className="input" value={token} onChange={(event) => setToken(event.target.value)} required placeholder="与 .env.production 中的 ADMIN_TOKEN 一致" />
        </div>
        <div className="toolbar">
          <button type="submit" className="button button-primary" disabled={status === "loading"}>{status === "loading" ? "加载中…" : "加载线索"}</button>
          <span className="small muted" aria-live="polite">{error}</span>
        </div>
      </form>

      {leads !== null && (
        leads.length === 0 ? (
          <div className="empty">还没有线索。/advertise 和 /data-api 的申请提交后会出现在这里。</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>产品</th>
                  <th>位次</th>
                  <th>公司</th>
                  <th>联系人</th>
                  <th>邮箱</th>
                  <th>预算</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="small">{lead.createdAt.replace("T", " ").slice(0, 16)}</td>
                    <td><span className="badge">{PRODUCT_LABELS[lead.product] ?? lead.product}</span></td>
                    <td className="small">{lead.placement ?? "—"}</td>
                    <td className="strong">{lead.company}</td>
                    <td className="small">{lead.contact}</td>
                    <td className="small">{lead.email}</td>
                    <td className="small">{lead.budget || "—"}</td>
                    <td><span className="badge badge-amber">{lead.status === "new" ? "待跟进" : lead.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
