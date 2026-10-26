import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("data snapshots", () => {
  it("has a snapshot manifest with valid hashes", async () => {
    // TC-1c / data snapshot smoke
    const root = path.join(process.cwd(), "data", "snapshots");
    const entries = await readdir(root, { withFileTypes: true });
    const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    expect(dirs.length).toBeGreaterThan(0);
    const latest = dirs[dirs.length - 1];
    const manifest = JSON.parse(await readFile(path.join(root, latest, "manifest.json"), "utf8")) as {
      files: Array<{ file: string; sha256: string }>;
    };
    expect(manifest.files.length).toBeGreaterThan(0);
    for (const item of manifest.files) {
      const content = await readFile(path.join(root, latest, item.file));
      expect(createHash("sha256").update(content).digest("hex")).toBe(item.sha256);
    }
  });
});
