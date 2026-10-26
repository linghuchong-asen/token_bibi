import { describe, expect, it } from "vitest";
// @ts-expect-error JavaScript utility module
import { buildTaskPrompt, detectRateLimit, extractThreadId, nextRetryDelayMs, normalizeTaskState, shouldRunTask, validateResultMarkdown } from "../automation/lib.mjs";

describe("automation runner", () => {
  it("builds a bounded task prompt", () => {
    const prompt = buildTaskPrompt({ projectRoot: "/repo", taskId: "001", taskFile: "001.md", taskContent: "do work" });
    expect(prompt).toContain("/repo/HANDOFF.md");
    expect(prompt).toContain("只读取与本任务直接相关的文件");
    expect(prompt).toContain("/repo/automation/results/001.md");
    expect(prompt).toContain("do work");
  });

  it("detects 429 and rate-limit output", () => {
    expect(detectRateLimit("429 Too Many Requests")).toBe(true);
    expect(detectRateLimit("exceeded retry limit")).toBe(true);
    expect(detectRateLimit("all tests passed")).toBe(false);
  });

  it("uses capped exponential backoff in milliseconds", () => {
    const first = nextRetryDelayMs(1, 60, 900);
    const capped = nextRetryDelayMs(5, 60, 900);
    expect(first).toBeGreaterThanOrEqual(60_000);
    expect(first).toBeLessThanOrEqual(72_000);
    expect(capped).toBeGreaterThanOrEqual(900_000);
    expect(capped).toBeLessThanOrEqual(1_080_000);
  });

  it("extracts the new thread id from codex json output", () => {
    expect(extractThreadId('{"type":"thread.started","thread_id":"01a16460-58d4-7ae0-a242-d9ddea28d880"}')).toBe("01a16460-58d4-7ae0-a242-d9ddea28d880");
  });

  it("initializes task state and skips completed or blocked tasks", () => {
    const state = normalizeTaskState({ tasks: { a: { status: "completed" }, c: { status: "blocked" } } }, ["a", "b", "c"]);
    expect(state.tasks.a.status).toBe("completed");
    expect(state.tasks.b.status).toBe("pending");
    expect(state.tasks.c.status).toBe("blocked");
    expect(shouldRunTask(state.tasks.a)).toBe(false);
    expect(shouldRunTask(state.tasks.b)).toBe(true);
    expect(shouldRunTask(state.tasks.c)).toBe(false);
  });

  it("validates the required result file headings", () => {
    const markdown = ["## 完成内容", "## 修改文件", "## 验证命令", "## 验证结果", "## 剩余问题"].join("\n");
    expect(validateResultMarkdown(markdown).valid).toBe(true);
    expect(validateResultMarkdown("## 完成内容").missing).toContain("修改文件");
  });
});
