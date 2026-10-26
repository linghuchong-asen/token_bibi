import { randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { feedbackSchema } from "@/lib/feedback";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "INVALID_INPUT", issues: parsed.error.issues }, { status: 400 });
  }

  const record = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: "pending" as const,
    ...parsed.data,
  };
  const dataDir = path.join(process.cwd(), "data");
  await mkdir(dataDir, { recursive: true });
  await appendFile(path.join(dataDir, "feedback.jsonl"), `${JSON.stringify(record)}\n`, "utf8");
  return NextResponse.json({ ok: true, id: record.id });
}
