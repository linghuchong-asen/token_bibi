import { afterEach, describe, expect, it } from "vitest";
import { existsSync, rmSync } from "node:fs";
import { GET } from "@/app/api/admin/leads/route";

// 线索是商业敏感数据：路由必须在令牌层面严格把关。
// 测试期间临时设置/还原 ADMIN_TOKEN，并确保不依赖已存在的线索文件。
describe("admin leads api", () => {
  const originalToken = process.env.ADMIN_TOKEN;

  afterEach(() => {
    if (originalToken === undefined) delete process.env.ADMIN_TOKEN;
    else process.env.ADMIN_TOKEN = originalToken;
  });

  function makeRequest(token?: string) {
    return new Request("http://localhost/api/admin/leads", {
      headers: token ? { "x-admin-token": token } : {},
    });
  }

  it("returns 503 when ADMIN_TOKEN is not configured", async () => {
    delete process.env.ADMIN_TOKEN;
    const response = await GET(makeRequest("any"));
    expect(response.status).toBe(503);
  });

  it("returns 401 for a wrong token", async () => {
    process.env.ADMIN_TOKEN = "test-secret";
    const response = await GET(makeRequest("wrong"));
    expect(response.status).toBe(401);
  });

  it("returns an empty list for a valid token when no leads exist", async () => {
    process.env.ADMIN_TOKEN = "test-secret";
    // 测试环境不应有真实线索文件；如果存在（前序测试残留），清掉保证确定性
    const leadsPath = "data/sponsor-leads.jsonl";
    if (existsSync(leadsPath)) rmSync(leadsPath);
    const response = await GET(makeRequest("test-secret"));
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.ok).toBe(true);
    expect(result.count).toBe(0);
    expect(result.leads).toEqual([]);
  });
});
