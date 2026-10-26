"use client";

import { useState } from "react";
import type { Model, Provider } from "@/data/types";

type Props = {
  models: Model[];
  providers: Provider[];
};

export function FeedbackForm({ models, providers }: Props) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      modelId: String(form.get("modelId") || ""),
      providerId: String(form.get("providerId") || ""),
      issueType: String(form.get("issueType") || "other"),
      description: String(form.get("description") || ""),
      sourceUrl: String(form.get("sourceUrl") || ""),
      contact: String(form.get("contact") || ""),
    };
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "提交失败");
      setStatus("success");
      setMessage("已收到，感谢你的反馈。");
      event.currentTarget.reset();
    } catch {
      setStatus("error");
      setMessage("提交失败，请稍后再试。");
    }
  }

  return (
    <form className="card card-pad stack" onSubmit={submit}>
      <div className="section-heading" style={{ marginBottom: 0 }}>
        <div><h2 style={{ margin: 0 }}>提交纠错</h2><p>请尽量附上平台链接和截图描述，方便核验。</p></div>
        <span className="badge badge-amber">人工审核</span>
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="feedback-model">模型</label>
          <select id="feedback-model" name="modelId" className="select">
            <option value="">不指定</option>
            {models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="feedback-provider">平台</label>
          <select id="feedback-provider" name="providerId" className="select">
            <option value="">不指定</option>
            {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="feedback-type">问题类型</label>
          <select id="feedback-type" name="issueType" className="select" defaultValue="price">
            <option value="price">价格错误</option>
            <option value="billing">计费规则</option>
            <option value="risk">风险信息</option>
            <option value="source">来源缺失</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="feedback-source">来源链接</label>
          <input id="feedback-source" name="sourceUrl" className="input" type="url" placeholder="https://…" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="feedback-description">问题描述</label>
        <textarea id="feedback-description" name="description" className="input" rows={5} required minLength={5} placeholder="请描述你看到的问题、时间和证据。" style={{ paddingTop: 12, paddingBottom: 12, height: "auto" }} />
      </div>
      <div className="field">
        <label htmlFor="feedback-contact">联系方式（可选）</label>
        <input id="feedback-contact" name="contact" className="input" placeholder="邮箱 / Telegram / 其他" />
      </div>
      <div className="toolbar">
        <button type="submit" className="button button-primary" disabled={status === "submitting"}>{status === "submitting" ? "提交中…" : "提交纠错"}</button>
        <span className="small muted" aria-live="polite">{message}</span>
      </div>
      {status === "success" && <div className="note">反馈已记录。MVP 阶段需要管理员人工处理。</div>}
      {status === "error" && <div className="danger" role="alert">{message}</div>}
    </form>
  );
}
