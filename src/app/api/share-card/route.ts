import { NextRequest, NextResponse } from "next/server";
import { Resvg } from "@resvg/resvg-js";
import { buildShareCardSvg } from "@/lib/share-card";
import { resolveShareData } from "@/lib/share-data";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const slug = params.get("model") ?? "gpt-5-6-sol";
  const input = Number(params.get("input") ?? 10_000_000);
  const output = Number(params.get("output") ?? 5_000_000);
  const cache = Number(params.get("cache") ?? 0.2);
  const download = params.get("download") === "1";
  const data = resolveShareData(slug, Number.isFinite(input) ? input : 10_000_000, Number.isFinite(output) ? output : 5_000_000, Number.isFinite(cache) ? cache : 0.2);
  if (!data) return NextResponse.json({ error: "MODEL_NOT_FOUND" }, { status: 404 });

  const svg = buildShareCardSvg(data);
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    background: "rgba(15,23,42,1)",
  }).render().asPng();

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      ...(download ? { "Content-Disposition": 'attachment; filename="token-bibi-card.png"' } : {}),
    },
  });
}
