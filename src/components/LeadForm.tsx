"use client";

// 文件用途：商业线索申请表单（所属模块：src/components，客户端组件）
// 供 /advertise（广告位投放）与 /data-api（API 订阅咨询）复用：
// 通过 product prop 区分场景，sponsor 场景额外展示位次选择。
// 提交到 /api/leads 统一汇入 data/sponsor-leads.jsonl，交给运营跟进。
import { useState } from "react";
import type { SponsorPlacement } from "@/data/types";

type Props = {
  product: "sponsor_slot" | "api_subscription";
  placements: { value: SponsorPlacement; label: string }[];
  title: string;
  description: string;
  successNote: string;
};

export function LeadForm({ product, placements, title, description, successNote }: Props) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const placement = String(form.get("placement") || "");
    const payload = {
      product,
      ...(product === "sponsor_slot" ? { placement } : {}),
      company: String(form.get("company") || ""),
      contact: String(form.get("contact") || ""),
      email: String(form.get("email") || ""),
      budget: String(form.get("budget") || ""),
      message: String(form.get("message") || ""),
    };
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "提交失败");
      setStatus("success");
      setMessage(successNote);
      event.currentTarget.reset();
    } catch {
      setStatus("error");
      setMessage("提交失败，请稍后再试。");
    }
  }

  return (
    <form className="card card-pad stack" onSubmit={submit} id="apply">
      <div className="section-heading" style={{ marginBottom: 0 }}>
        <div><h2 style={{ margin: 0 }}>{title}</h2><p>{description}</p></div>
      </div>
      {product === "sponsor_slot" && (
        <div className="field">
          <label htmlFor="lead-placement">投放位</label>
          <select id="lead-placement" name="placement" className="select" required defaultValue={placements[0]?.value}>
            {placements.map((placement) => (
              <option key={placement.value} value={placement.value}>{placement.label}</option>
            ))}
          </select>
        </div>
      )}
      <div className="form-grid">
        <div className="field">
          <label htmlFor="lead-company">公司 / 产品名</label>
          <input id="lead-company" name="company" className="input" required minLength={2} maxLength={120} placeholder="例如：某某 API 中转站" />
        </div>
        <div className="field">
          <label htmlFor="lead-contact">联系人</label>
          <input id="lead-contact" name="contact" className="input" required minLength={2} maxLength={60} placeholder="怎么称呼你" />
        </div>
        <div className="field">
          <label htmlFor="lead-email">邮箱</label>
          <input id="lead-email" name="email" className="input" type="email" required placeholder="business@example.com" />
        </div>
        <div className="field">
          <label htmlFor="lead-budget">预算（可选）</label>
          <input id="lead-budget" name="budget" className="input" maxLength={60} placeholder="例如：¥1,000 / 月" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="lead-message">补充说明（可选）</label>
        <textarea id="lead-message" name="message" className="input" rows={4} maxLength={1000} placeholder="想投的产品类型、期望开始时间、素材情况等。" style={{ paddingTop: 12, paddingBottom: 12, height: "auto" }} />
      </div>
      <div className="toolbar">
        <button type="submit" className="button button-primary" disabled={status === "submitting"}>{status === "submitting" ? "提交中…" : "提交申请"}</button>
        <span className="small muted" aria-live="polite">{message}</span>
      </div>
      {status === "success" && <div className="note">{successNote}</div>}
      {status === "error" && <div className="danger" role="alert">{message}</div>}
    </form>
  );
}
