// 文件用途：销售线索收集 API（所属模块：src/app/api/leads，Node 运行时）
// POST /api/leads：广告位投放申请与数据 API 订阅咨询的统一入口。
// 校验失败的请求只返回字段级错误，不落盘；成功的线索追加到
// data/sponsor-leads.jsonl（与 feedback.jsonl 同一套存储约定）。
import { randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { leadSchema } from "@/lib/leads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "INVALID_INPUT", issues: parsed.error.issues }, { status: 400 });
  }

  const record = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: "new" as const,
    ...parsed.data,
  };
  const dataDir = path.join(process.cwd(), "data");
  await mkdir(dataDir, { recursive: true });
  await appendFile(path.join(dataDir, "sponsor-leads.jsonl"), `${JSON.stringify(record)}\n`, "utf8");
  return NextResponse.json({ ok: true, id: record.id });
}
