"use client";

import { useState } from "react";
import type { EnrichedPrice } from "@/data/types";
import { CopyButton } from "@/components/CopyButton";
import { formatCny } from "@/lib/format";

const RELEASE_COMMAND = "npm run build && systemctl restart token-bibi-app.service";

const errorMessages: Record<string, string> = {
  ADMIN_TOKEN_NOT_CONFIGURED: "服务端未配置 ADMIN_TOKEN，暂时无法核验。",
  UNAUTHORIZED: "ADMIN_TOKEN 不正确。",
  MISSING_ID: "缺少价格 ID。",
  NOT_FOUND: "找不到这条价格，可能已被处理。",
  INVALID_JSON: "请求格式错误，请刷新页面后重试。",
};

export function AdminReviewClient({ initialRows }: { initialRows: EnrichedPrice[] }) {
  const [token, setToken] = useState("");
  const [rows, setRows] = useState(initialRows);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [verifiedCount, setVerifiedCount] = useState(0);

  async function verify(id: string) {
    setPendingId(id);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/prices/verify", {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (!response.ok) {
        const message = typeof result.error === "string" ? errorMessages[result.error] : undefined;
        throw new Error(message || result.error || "核验失败");
      }
      setRows((current) => current.filter((row) => row.id !== id));
      setVerifiedCount((current) => current + 1);
      setNotice({
        kind: "success",
        text: "已写入核验结果。前台尚未更新，请完成下方发布步骤后再核对线上价格。",
      });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "核验失败" });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="stack">
      <div className="warning" role="note">
        <strong>核验不会自动上线。</strong> 本操作只更新 <code>data/prices.json</code> 并生成备份；模型页和平台页是静态构建，必须重新构建并重启应用后，前台才会显示新状态。
      </div>

      <section className="card card-pad stack" aria-labelledby="release-steps-title">
        <div>
          <h2 id="release-steps-title" style={{ margin: 0, fontSize: 20 }}>核验后的发布步骤</h2>
          <p className="small muted" style={{ margin: "6px 0 0" }}>批量核验完成后执行一次即可。自动化采集定时任务仍按每日 03:45 自行构建和重启。</p>
        </div>
        <ol className="small" style={{ margin: 0, paddingLeft: 20 }}>
          <li>确认来源链接、价格和核验时间。</li>
          <li>逐条标记已核验，直到待核验列表清空。</li>
          <li>在 ECS 执行下方命令，然后刷新前台页面复核。</li>
        </ol>
        <div className="command-row">
          <code className="command">{RELEASE_COMMAND}</code>
          <CopyButton value={RELEASE_COMMAND} label="复制发布命令" />
        </div>
        <p className="small muted" style={{ margin: 0 }}>管理后台不会触发自动重启，避免核验过程中反复中断线上服务。</p>
      </section>

      <div className="card card-pad stack">
        <div className="field">
          <label htmlFor="admin-token">ADMIN_TOKEN</label>
          <input id="admin-token" className="input" type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="输入管理 token" autoComplete="off" />
        </div>
        <div className="note">Token 只保存在当前页面内存中。核验前请确认来源链接、价格和核验时间。</div>
        {notice && (
          <div className={notice.kind === "success" ? "note" : "danger"} role={notice.kind === "error" ? "alert" : undefined} aria-live="polite">
            {notice.text}
          </div>
        )}
      </div>

      <div className="card card-pad">
        <div className="section-heading">
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>待核验价格</h2>
            <p>剩余 {rows.length} 条{verifiedCount > 0 ? `，本次已核验 ${verifiedCount} 条` : ""}</p>
          </div>
          {verifiedCount > 0 && <span className="badge badge-amber">待发布</span>}
        </div>
        {rows.length === 0 ? <div className="empty">当前没有待核验价格。</div> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>价格 ID</th><th>平台 / 模型</th><th className="num">输入 / 输出</th><th>来源</th><th>操作</th></tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="small"><code>{row.id}</code></td>
                    <td><strong>{row.provider.name}</strong><div className="small muted">{row.model.name}</div></td>
                    <td className="num">{formatCny(row.inputPricePerMTokens, 3)} / {formatCny(row.outputPricePerMTokens, 3)}</td>
                    <td><a href={row.sourceUrl} target="_blank" rel="noreferrer" className="small">查看来源</a></td>
                    <td>
                      <button className="button button-small button-primary" type="button" onClick={() => verify(row.id)} disabled={pendingId === row.id || !token}>
                        {pendingId === row.id ? "核验中…" : "标记已核验"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
