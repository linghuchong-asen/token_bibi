// 文件用途：浏览器级 E2E 测试（所属模块：scripts，发布前回归）
// 覆盖：首页、比价搜索/筛选、计算器、分享卡、管理后台、移动端不溢出、
// 广告位申请表单（盈利入口的真实用户路径）。
// 浏览器解析顺序：E2E_EXECUTABLE_PATH 环境变量 → @sparticuz/chromium（Linux/ECS）
// → 本机 Chrome/Edge 常见安装路径（Windows 开发机）。@sparticuz 的二进制
// 只能在 Linux 上跑，Windows 上必须回退到本机浏览器。
import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

const base = process.env.E2E_BASE_URL || "http://127.0.0.1:8090";
// 用时间戳做线索标记：e2e 结束后按标记把测试线索从数据文件里剔除
const leadMarker = `e2e-${Date.now()}`;
const leadsPath = path.join(process.cwd(), "data", "sponsor-leads.jsonl");

// Windows 上常见的浏览器安装位置；按优先级找到第一个存在的可执行文件
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

async function resolveExecutablePath() {
  if (process.env.E2E_EXECUTABLE_PATH) return process.env.E2E_EXECUTABLE_PATH;
  if (process.platform === "linux") return chromium.executablePath();
  const local = findLocalBrowser();
  if (!local) {
    throw new Error("未找到本机 Chrome/Edge；可用 E2E_EXECUTABLE_PATH 指定浏览器路径");
  }
  return local;
}

const executablePath = await resolveExecutablePath();
const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
});

// 把本次 e2e 写入的测试线索从 JSONL 中过滤掉；若文件只剩测试数据则直接删除。
// 这样 e2e 可以在产线数据文件上反复跑而不留垃圾。
function cleanupTestLead() {
  if (!existsSync(leadsPath)) return;
  const lines = readFileSync(leadsPath, "utf8").split("\n").filter((line) => line.trim() !== "");
  const kept = lines.filter((line) => !line.includes(leadMarker));
  if (kept.length === 0) {
    rmSync(leadsPath);
  } else if (kept.length !== lines.length) {
    writeFileSync(leadsPath, `${kept.join("\n")}\n`, "utf8");
  }
}

async function main() {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  await page.goto(`${base}/`, { waitUntil: "networkidle0" });
  assert.match(await page.title(), /token比比/);
  assert.match(await page.$eval("h1", (el) => el.textContent), /不要只看 token 单价/);
  console.log("PASS home");

  await page.goto(`${base}/models`, { waitUntil: "networkidle0" });
  await page.type("#model-search", "glm");
  await page.waitForFunction(() => document.body.innerText.includes("GLM-5.3 Flash"));
  assert.equal(await page.$$eval("tbody tr", (rows) => rows.some((row) => row.innerText.includes("GPT-5.6 Sol"))), false);
  await page.select("#status-filter", "all");
  await page.waitForFunction(() => document.body.innerText.includes("样例数据"));
  await page.waitForFunction(() => document.body.innerText.includes("不应当作采购报价"));
  await page.select("#billing-filter", "credit");
  await page.waitForFunction(() => document.querySelectorAll("tbody tr").length > 0);
  assert.match(await page.$eval("tbody", (el) => el.innerText), /积分 \/ 额度/);
  console.log("PASS models search/filter");

  await page.goto(`${base}/calculator`, { waitUntil: "networkidle0" });
  await page.select("#calc-model", "glm-5-3-flash");
  await page.click("#calc-input", { clickCount: 3 });
  await page.type("#calc-input", "20000000");
  await page.waitForFunction(() => document.body.innerText.includes("GLM-5.3 Flash"));
  assert.match(await page.evaluate(() => document.body.innerText), /推荐路径/);
  console.log("PASS calculator");

  await page.goto(`${base}/share?model=gpt-5-6-sol&input=10000000&output=5000000&cache=0.2`, { waitUntil: "networkidle0" });
  await page.waitForSelector('img[alt*="分享卡片"]');
  const imageWidth = await page.$eval('img[alt*="分享卡片"]', (img) => img.naturalWidth);
  assert.ok(imageWidth > 0, `share image naturalWidth=${imageWidth}`);
  assert.match(await page.evaluate(() => document.body.innerText), /GPT-5.6 Sol/);
  console.log("PASS share card image and query state");

  await page.goto(`${base}/admin/prices`, { waitUntil: "networkidle0" });
  assert.match(await page.evaluate(() => document.body.innerText), /价格核验/);
  assert.ok(await page.$("#admin-token"));
  console.log("PASS admin review page");

  // 盈利入口端到端：广告位申请表单 → /api/leads → data/sponsor-leads.jsonl
  // 断言成功提示 + 文件真实落盘（finally 里会剔除本条测试数据）。
  // 注水竞态处理：点击若早于 React 事件绑定会触发原生提交刷新，此时整表单
  // 重新走一遍；最多重试 3 次，全部失败才判定用例失败。
  let leadSubmitted = false;
  for (let attempt = 1; attempt <= 3 && !leadSubmitted; attempt += 1) {
    await page.goto(`${base}/advertise`, { waitUntil: "networkidle0" });
    await page.waitForSelector("#lead-company");
    // 给 React 注水留时间：SSR 的 HTML 已在 DOM 里，但事件绑定需要等 hydrate 完成
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await page.type("#lead-company", `E2E 测试公司 ${leadMarker}`);
    await page.type("#lead-contact", "E2E 测试员");
    await page.type("#lead-email", "e2e@example.com");
    await page.select("#lead-placement", "models");
    await page.click("button[type=submit]");
    try {
      await page.waitForFunction(() => document.body.innerText.includes("申请已收到"), { timeout: 5000 });
      leadSubmitted = true;
    } catch {
      console.log(`  retry advertise form (attempt ${attempt})`);
    }
  }
  assert.ok(leadSubmitted, "advertise lead form did not submit successfully");
  const leadsAfter = existsSync(leadsPath) ? readFileSync(leadsPath, "utf8") : "";
  assert.ok(leadsAfter.includes(leadMarker), "lead was not persisted to sponsor-leads.jsonl");
  console.log("PASS advertise lead form end-to-end");

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(`${base}/models`, { waitUntil: "networkidle0" });
  const layout = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
  assert.ok(layout.scrollWidth <= layout.innerWidth + 1, `mobile overflow: ${JSON.stringify(layout)}`);
  console.log("PASS mobile layout");

  await page.close();
}

try {
  await main();
  console.log("E2E passed");
} finally {
  cleanupTestLead();
  await browser.close();
}
