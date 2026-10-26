"use client";

import { useMemo, useState } from "react";
import type { RechargeRule } from "@/data/types";
import { parseRechargeMultiplier } from "@/lib/pricing";
import { formatCny } from "@/lib/format";

export function CreditCalculator({ rules }: { rules: RechargeRule[] }) {
  const [ruleId, setRuleId] = useState(rules[0]?.id ?? "");
  const [amount, setAmount] = useState(100);
  const rule = rules.find((item) => item.id === ruleId) ?? rules[0];
  const multiplier = useMemo(() => parseRechargeMultiplier(rule?.rechargeRatio), [rule]);
  const credits = multiplier > 0 ? amount / multiplier : 0;
  const effectiveDiscount = multiplier < 1 ? 1 - multiplier : 0;

  return (
    <div className="card card-pad stack">
      <div className="section-heading" style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ margin: 0 }}>积分 / 额度换算</h2>
          <p>把充值金额换算为到手额度和有效折价。</p>
        </div>
        <span className="badge">样例数据</span>
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="credit-rule">充值规则</label>
          <select id="credit-rule" className="select" value={ruleId} onChange={(event) => setRuleId(event.target.value)}>
            {rules.map((item) => <option key={item.id} value={item.id}>{item.providerId} · {item.rechargeRatio}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="credit-amount">充值金额（元）</label>
          <input id="credit-amount" className="input" type="number" min={0} value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
        </div>
      </div>
      <div className="calc-result">
        <span className="small muted">到手额度</span>
        <strong>{credits.toFixed(2)} credits</strong>
        <span className="small muted">等效折价：{effectiveDiscount > 0 ? `${(effectiveDiscount * 100).toFixed(1)}%` : "无折扣"}</span>
      </div>
      <div className="note">示例：充值 {formatCny(amount)}，按当前规则可得到 {credits.toFixed(2)} credits。实际扣费还会受到模型、分组和渠道规则影响。</div>
    </div>
  );
}
