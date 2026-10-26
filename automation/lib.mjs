export function buildTaskPrompt({ projectRoot, taskId, taskFile, taskContent }) {
  return `你是 token比比的自动化任务执行器。\n\n工作目录：${projectRoot}\n当前任务：${taskFile}\n\n执行规则：\n1. 先读取 ${projectRoot}/HANDOFF.md 和当前任务文件。\n2. 只读取与本任务直接相关的文件，不要扫描整个仓库，不要重新读取历史会话。\n3. 只修改任务允许范围内的文件。\n4. 运行任务要求的最小验证命令；不要启动长期服务。\n5. 无论成功或失败，都把结果写到 ${projectRoot}/automation/results/${taskId}.md。\n6. 结果必须包含：完成内容、修改文件、验证命令、验证结果、剩余问题。\n7. 不要等待人工确认。遇到无法完成的外部阻塞时，写入明确阻塞原因后结束。\n\n任务内容：\n---\n${taskContent}\n---\n`;
}

export function detectRateLimit(text) {
  return /429|Too Many Requests|exceeded retry limit|rate.?limit/i.test(text);
}

export function nextRetryDelayMs(attempt, baseSeconds = 60, maxSeconds = 900) {
  const exponentialSeconds = Math.min(maxSeconds, baseSeconds * 2 ** Math.max(0, attempt - 1));
  return Math.round(exponentialSeconds * 1000 * (1 + Math.random() * 0.2));
}

export function extractThreadId(text) {
  const match = text.match(/"thread_id"\s*:\s*"([^"]+)"/);
  return match?.[1] ?? null;
}

export function normalizeTaskState(state, taskIds) {
  const next = { version: 1, tasks: { ...(state?.tasks ?? {}) } };
  for (const id of taskIds) {
    if (!next.tasks[id]) {
      next.tasks[id] = { status: "pending", attempts: 0, updatedAt: null, resultPath: null, logPath: null };
    }
  }
  return next;
}

export function shouldRunTask(taskState, { rerun = false } = {}) {
  if (rerun) return true;
  return !["completed", "blocked"].includes(taskState?.status);
}

export const RESULT_HEADINGS = ["完成内容", "修改文件", "验证命令", "验证结果", "剩余问题"];

export function validateResultMarkdown(markdown) {
  const missing = RESULT_HEADINGS.filter((heading) => !markdown.includes(`## ${heading}`) && !markdown.includes(`# ${heading}`));
  return { valid: missing.length === 0, missing };
}
