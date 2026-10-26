import { createHash } from "node:crypto";
import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "data");
const snapshotRoot = path.join(dataDir, "snapshots");
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const targetDir = path.join(snapshotRoot, stamp);

await mkdir(targetDir, { recursive: true });
const entries = await readdir(dataDir, { withFileTypes: true });
const files = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
  .map((entry) => entry.name)
  .sort();

const manifest = [];
for (const file of files) {
  const source = path.join(dataDir, file);
  const target = path.join(targetDir, file);
  const content = await readFile(source);
  await cp(source, target);
  manifest.push({
    file,
    bytes: content.byteLength,
    sha256: createHash("sha256").update(content).digest("hex"),
  });
}

await writeFile(
  path.join(targetDir, "manifest.json"),
  `${JSON.stringify({ createdAt: new Date().toISOString(), files: manifest }, null, 2)}\n`,
  "utf8",
);
console.log(`snapshot created: ${targetDir}`);
console.log(`files: ${manifest.length}`);
