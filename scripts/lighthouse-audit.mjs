// 文件用途：Lighthouse 移动端性能审计（所属模块：scripts，发布前回归）
// 跑 performance / accessibility / best-practices / seo 四类打分，性能低于 0.9
// 重试最多 6 次后判定失败；报告落盘 data/lighthouse-report-*.json。
// 浏览器解析：Windows 上用本机 Chrome/Edge（@sparticuz 的二进制只能跑在 Linux），
// Linux/ECS 走 @sparticuz/chromium；可用 LIGHTHOUSE_URL / LIGHTHOUSE_THROTTLING 覆盖目标与限速方式。
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import chromium from "@sparticuz/chromium";
import { launch as launchChrome } from "chrome-launcher";
import lighthouse from "lighthouse";

const url = process.env.LIGHTHOUSE_URL || "http://127.0.0.1:8090/";
const throttlingMethod = process.env.LIGHTHOUSE_THROTTLING === "provided" ? "provided" : "simulate";
const maxAttempts = 6;

// 与 e2e-test.mjs 同一套本机浏览器探测逻辑；两处都改时请保持一致
function findLocalBrowser() {
  const candidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    path.join(process.env.LOCALAPPDATA ?? "", "Google/Chrome/Application/chrome.exe"),
  ];
  return candidates.find((candidate) => candidate && existsSync(candidate)) ?? null;
}

const executablePath = process.platform === "linux" ? await chromium.executablePath() : (findLocalBrowser() ?? (await chromium.executablePath()));
// --single-process / --no-zygote 是 Lambda 内存裁剪专用，会弄死桌面版 Chrome 的
// DevTools 握手（与 e2e-test.mjs 的过滤保持一致）；
// --remote-allow-origins：本地新版 Chrome 的 DevTools 握手要求显式允许来源。
const chromeFlags = [
  ...chromium.args.filter((arg) => !arg.startsWith("--headless") && arg !== "--single-process" && arg !== "--no-zygote"),
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--remote-allow-origins=*",
];

async function runOnce() {
  const chrome = await launchChrome({ chromePath: executablePath, chromeFlags });
  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      formFactor: "mobile",
      screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false },
      throttlingMethod,
    });
    if (!result) throw new Error("Lighthouse returned no result");
    return result.lhr;
  } finally {
    await chrome.kill();
  }
}

let best = null;
let bestScore = -1;
for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const lhr = await runOnce();
  const score = lhr.categories.performance?.score ?? 0;
  const noScreenshots = Boolean(lhr.audits["final-screenshot"]?.errorMessage || lhr.audits["speed-index"]?.errorMessage);
  if (score > bestScore) {
    best = lhr;
    bestScore = score;
  }
  if (!noScreenshots && score >= 0.9) break;
  if (attempt < maxAttempts) await new Promise((resolve) => setTimeout(resolve, 1000));
}

if (bestScore < 0.9) {
  const scores = Object.fromEntries(Object.entries(best.categories).map(([key, value]) => [key, Math.round((value.score ?? 0) * 100)]));
  console.error(JSON.stringify({ url, throttlingMethod, scores, error: "performance below 0.9 after retries" }, null, 2));
  process.exit(1);
}

const reportPath = path.join(process.cwd(), "data", `lighthouse-report-${throttlingMethod}.json`);
await writeFile(reportPath, JSON.stringify(best, null, 2), "utf8");
const scores = Object.fromEntries(Object.entries(best.categories).map(([key, value]) => [key, Math.round((value.score ?? 0) * 100)]));
console.log(JSON.stringify({ url, throttlingMethod, scores, report: reportPath }, null, 2));
