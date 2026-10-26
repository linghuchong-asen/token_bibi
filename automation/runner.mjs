import { execFileSync, spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, open, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildTaskPrompt, detectRateLimit, extractThreadId, nextRetryDelayMs, normalizeTaskState, shouldRunTask, validateResultMarkdown } from "./lib.mjs";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const automationDir = path.join(root, "automation");
const tasksDir = path.join(automationDir, "tasks");
const resultsDir = path.join(automationDir, "results");
const logsDir = path.join(automationDir, "logs");
const statePath = path.join(automationDir, "state.json");
const lockPath = path.join(automationDir, "run.lock");

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const valueOf = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const dryRun = has("--dry-run");
const rerun = has("--rerun");
const waitOnRateLimit = has("--wait");
const onlyTask = valueOf("--task");
const maxTasks = Number(valueOf("--max-tasks") || process.env.AUTOMATION_MAX_TASKS || 3);

let config = {};
try { config = JSON.parse(await readFile(path.join(automationDir, "config.json"), "utf8")); } catch {}
const model = valueOf("--model") || process.env.AUTOMATION_MODEL || config.model || "";
const timeoutMinutes = Number(process.env.AUTOMATION_TIMEOUT_MINUTES || config.timeoutMinutes || 20);
const maxAttempts = Number(process.env.AUTOMATION_MAX_ATTEMPTS || config.maxAttempts || 3);
const sandbox = config.sandbox || "workspace-write";
const approveForMe = config.approveForMe !== false && !has("--no-approve");
const codexBin = process.env.CODEX_BIN || "codex";

await mkdir(resultsDir, { recursive: true });
await mkdir(logsDir, { recursive: true });

const taskFiles = (await readdir(tasksDir)).filter((name) => name.endsWith(".md")).sort();
const tasks = taskFiles.map((file) => ({ file, id: file.replace(/\.md$/, "") })).filter((task) => !onlyTask || task.id === onlyTask);
if (tasks.length === 0) {
  console.error("no matching tasks");
  process.exit(1);
}

let state = { version: 1, tasks: {} };
try { state = JSON.parse(await readFile(statePath, "utf8")); } catch {}
state = normalizeTaskState(state, taskFiles.map((file) => file.replace(/\.md$/, "")));

if (dryRun) {
  for (const task of tasks) {
    const content = await readFile(path.join(tasksDir, task.file), "utf8");
    console.log(`\n=== ${task.id} ===`);
    console.log(buildTaskPrompt({ projectRoot: root, taskId: task.id, taskFile: task.file, taskContent: content }));
  }
  process.exit(0);
}

let lock;
try {
  lock = await open(lockPath, "wx");
} catch {
  console.error(`another automation run is active: ${lockPath}`);
  process.exit(2);
}

async function saveState() {
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function runCodex(prompt, taskId, attempt) {
  return new Promise((resolve) => {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const logPath = path.join(logsDir, `${taskId}-${stamp}-attempt${attempt}.jsonl`);
    const resultPath = path.join(resultsDir, `${taskId}.md`);
    const log = createWriteStream(logPath, { flags: "a" });
    const codexArgs = ["exec", "--ephemeral", "--skip-git-repo-check", "--json", "--output-last-message", resultPath, "-C", root];
    if (approveForMe) codexArgs.push("--approve-for-me");
    else codexArgs.push("--sandbox", sandbox);
    if (model) codexArgs.push("-m", model);
    codexArgs.push(prompt);
    const child = spawn(codexBin, codexArgs, { cwd: root, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    const collect = (chunk, target) => { const text = chunk.toString(); output += text; target.write(text); };
    child.stdout.on("data", (chunk) => collect(chunk, log));
    child.stderr.on("data", (chunk) => collect(chunk, log));
    const timer = setTimeout(() => { child.kill("SIGTERM"); setTimeout(() => child.kill("SIGKILL"), 5000); }, timeoutMinutes * 60 * 1000);
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      log.end();
      resolve({ code, signal, output, logPath, resultPath });
    });
  });
}

let failed = 0;
let ran = 0;
try {
  for (const task of tasks) {
    const current = state.tasks[task.id];
    if (!shouldRunTask(current, { rerun })) continue;
    if (ran >= maxTasks) break;
    ran += 1;
    const content = await readFile(path.join(tasksDir, task.file), "utf8");
    const prompt = buildTaskPrompt({ projectRoot: root, taskId: task.id, taskFile: task.file, taskContent: content });
    let attempt = 0;
    while (attempt < maxAttempts) {
      attempt += 1;
      current.status = "running";
      current.attempts += 1;
      current.updatedAt = new Date().toISOString();
      await saveState();
      console.log(`[${task.id}] attempt ${attempt}: starting`);
      const result = await runCodex(prompt, task.id, attempt);
      current.lastExitCode = result.code;
      current.resultPath = path.relative(root, result.resultPath);
      current.logPath = path.relative(root, result.logPath);
      current.updatedAt = new Date().toISOString();
      current.threadId = extractThreadId(result.output);
      if (detectRateLimit(result.output)) {
        current.status = "rate_limited";
        current.error = "429 / rate limit detected";
        const delay = nextRetryDelayMs(attempt, Number(config.backoffBaseSeconds || 60), Number(config.backoffMaxSeconds || 900));
        current.nextRetryAt = new Date(Date.now() + delay).toISOString();
        await saveState();
        console.log(`[${task.id}] rate limited in thread ${current.threadId ?? "unknown"}; next retry after ${current.nextRetryAt}`);
        if (waitOnRateLimit && attempt < maxAttempts) {
          console.log(`[${task.id}] waiting ${delay}ms before retry`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        break;
      }
      if (result.code === 0) {
        let resultMarkdown = "";
        try { resultMarkdown = await readFile(result.resultPath, "utf8"); } catch {}
        const validation = validateResultMarkdown(resultMarkdown);
        if (!validation.valid) {
          current.status = "invalid_result";
          current.error = `result missing headings: ${validation.missing.join(", ")}`;
          await saveState();
          console.log(`[${task.id}] invalid result: ${current.error}`);
          break;
        }
        current.status = "completed";
        current.completedAt = new Date().toISOString();
        current.error = null;
        current.nextRetryAt = null;
        await saveState();
        console.log(`[${task.id}] completed`);
        break;
      }
      current.status = "failed";
      current.error = `exit code ${result.code}${result.signal ? ` signal ${result.signal}` : ""}`;
      await saveState();
      console.log(`[${task.id}] failed: ${current.error}`);
      if (attempt < maxAttempts) {
        const delay = nextRetryDelayMs(attempt, Number(config.backoffBaseSeconds || 60), Number(config.backoffMaxSeconds || 900));
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    if (state.tasks[task.id].status === "rate_limited" && !waitOnRateLimit) break;
    if (state.tasks[task.id].status !== "completed") failed += 1;
  }
} finally {
  await saveState();
  await lock.close();
  await rm(lockPath, { force: true });
}

const summary = Object.entries(state.tasks).map(([id, value]) => `${id}: ${value.status}`).join("\n");
console.log(`\nautomation summary:\n${summary}`);
const rateLimited = Object.values(state.tasks).some((task) => task.status === "rate_limited");
process.exit(rateLimited ? 3 : failed > 0 ? 1 : 0);
