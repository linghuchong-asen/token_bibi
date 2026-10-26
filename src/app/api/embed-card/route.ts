import { NextRequest, NextResponse } from "next/server";
import { buildEmbedHtml } from "@/lib/embed";
import { resolveShareData } from "@/lib/share-data";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const slug = params.get("model") ?? "gpt-5-6-sol";
  const input = Number(params.get("input") ?? 10_000_000);
  const output = Number(params.get("output") ?? 5_000_000);
  const cache = Number(params.get("cache") ?? 0.2);
  const data = resolveShareData(slug, Number.isFinite(input) ? input : 10_000_000, Number.isFinite(output) ? output : 5_000_000, Number.isFinite(cache) ? cache : 0.2);
  if (!data) return NextResponse.json({ error: "MODEL_NOT_FOUND" }, { status: 404 });
  const query = `model=${encodeURIComponent(slug)}&input=${input}&output=${output}&cache=${cache}`;
  return new NextResponse(buildEmbedHtml(data, request.nextUrl.origin, query), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
