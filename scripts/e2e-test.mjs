import assert from "node:assert/strict";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

const base = process.env.E2E_BASE_URL || "http://127.0.0.1:8090";
const executablePath = await chromium.executablePath();
const args = chromium.args.filter((arg) => !arg.startsWith("--headless") && arg !== "--single-process" && arg !== "--no-zygote");
const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: [...args, "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
});

async function main() {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  await page.goto(`${base}/`, { waitUntil: "networkidle0" });
  assert.match(await page.title(), /token比比/);
  assert.match(await page.locator("h1").map((el) => el.textContent).wait(), /不要只看 token 单价/);
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
  await browser.close();
}
