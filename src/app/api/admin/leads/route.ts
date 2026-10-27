// 文件用途：销售线索管理 API（所属模块：src/app/api/admin/leads，Node 运行时）
// GET /api/admin/leads：读取 data/sponsor-leads.jsonl 供运营后台查看，
// 需要 x-admin-token 头（与 /api/admin/prices/verify 同一套鉴权）。
// 线索是商业敏感数据：无令牌一律 401/503，绝不能像公开页面一样可匿名访问。
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isAdminTokenValid } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = request.headers.get("x-admin-token");
  if (!process.env.ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: "ADMIN_TOKEN_NOT_CONFIGURED" }, { status: 503 });
  }
  if (!isAdminTokenValid(token)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const leadsPath = path.join(process.cwd(), "data", "sponsor-leads.jsonl");
  let leads: Record<string, unknown>[] = [];
  try {
    const raw = await readFile(leadsPath, "utf8");
    // JSONL 逐行解析：单行损坏只丢那一行，不能让整个后台 500
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        leads.push(JSON.parse(trimmed));
      } catch {
        // 跳过无法解析的行
      }
    }
  } catch {
    // 文件不存在 = 还没有线索，返回空列表而不是错误
  }

  // 新线索排前面
  leads.sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
  return NextResponse.json({ ok: true, count: leads.length, leads });
}
