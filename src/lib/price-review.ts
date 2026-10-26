import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Price } from "@/data/types";

export async function verifyPendingPrice(id: string): Promise<Price | null> {
  const pricesPath = path.join(process.cwd(), "data", "prices.json");
  const prices = JSON.parse(await readFile(pricesPath, "utf8")) as Price[];
  const index = prices.findIndex((price) => price.id === id);
  if (index < 0) return null;
  const previous = prices[index];
  const updated: Price = {
    ...previous,
    dataStatus: "verified",
    lastVerifiedAt: new Date().toISOString(),
  };
  const next = [...prices];
  next[index] = updated;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await mkdir(path.join(process.cwd(), "data", "imports", "backups"), { recursive: true });
  await writeFile(path.join(process.cwd(), "data", "imports", "backups", `prices-before-admin-review-${stamp}.json`), `${JSON.stringify(prices, null, 2)}\n`, "utf8");
  await writeFile(pricesPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return updated;
}
