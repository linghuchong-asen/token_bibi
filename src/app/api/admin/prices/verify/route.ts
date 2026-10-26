import { NextResponse } from "next/server";
import { isAdminTokenValid } from "@/lib/admin-auth";
import { verifyPendingPrice } from "@/lib/price-review";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = request.headers.get("x-admin-token");
  if (!process.env.ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: "ADMIN_TOKEN_NOT_CONFIGURED" }, { status: 503 });
  }
  if (!isAdminTokenValid(token)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  let payload: { id?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }
  if (!payload.id) return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
  const updated = await verifyPendingPrice(payload.id);
  if (!updated) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true, price: updated, note: "需要重新构建页面后前台才会更新" });
}
