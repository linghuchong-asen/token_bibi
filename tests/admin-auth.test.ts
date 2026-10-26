import { afterEach, describe, expect, it } from "vitest";
import { isAdminTokenValid } from "@/lib/admin-auth";

const original = process.env.ADMIN_TOKEN;
afterEach(() => {
  if (original === undefined) delete process.env.ADMIN_TOKEN;
  else process.env.ADMIN_TOKEN = original;
});

describe("admin auth", () => {
  it("accepts the configured token and rejects others", () => {
    process.env.ADMIN_TOKEN = "secret-token";
    expect(isAdminTokenValid("secret-token")).toBe(true);
    expect(isAdminTokenValid("wrong-token")).toBe(false);
    expect(isAdminTokenValid(null)).toBe(false);
  });
});
