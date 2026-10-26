// 文件用途：销售线索（leads）的输入校验与落盘结构（所属模块：src/lib）
// 所有商业化入口（广告位投放申请、数据 API 订阅咨询）统一汇到这里：
// 一个 zod schema 挡住脏数据，一个 JSONL 追加写保证线索不丢。
// 为什么用 JSONL 而不是 JSON 数组：追加写不会因为并发/中断损坏已有线索，
// 与 feedback.jsonl 保持同一套存储约定。
import { z } from "zod";

export const LEAD_PRODUCTS = ["sponsor_slot", "api_subscription"] as const;

export const leadSchema = z
  .object({
    product: z.enum(LEAD_PRODUCTS),
    // sponsor_slot 必填：想投哪个位；api 订阅不需要
    placement: z.enum(["home", "models", "footer"]).optional(),
    company: z.string().trim().min(2).max(120),
    contact: z.string().trim().min(2).max(60),
    email: z.string().trim().email().max(160),
    // 预算可选，方便优先跟进有明确预算的线索
    budget: z.string().trim().max(60).optional().or(z.literal("")),
    message: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  // 投放申请必须指定位次，其余产品不允许带位次，避免后续跟进时歧义
  .refine((data) => (data.product === "sponsor_slot" ? data.placement !== undefined : data.placement === undefined), {
    message: "sponsor_slot 必须携带 placement，其他产品不允许携带",
  });

export type LeadInput = z.infer<typeof leadSchema>;

export type LeadRecord = LeadInput & {
  id: string;
  createdAt: string;
  status: "new";
};

// 校验 API 返回给前端的错误结构，路由层直接透传 issues
export function describeLeadIssues(issues: { path: (string | number | symbol)[]; message: string }[]): string[] {
  return issues.map((issue) => `${issue.path.map(String).join(".") || "form"}: ${issue.message}`);
}
