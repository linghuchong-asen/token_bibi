import { describe, expect, it } from "vitest";
import { feedbackSchema } from "@/lib/feedback";

describe("feedback validation", () => {
  it("accepts a valid correction", () => {
    // TC-13a
    const result = feedbackSchema.safeParse({
      modelId: "gpt-5-6-sol",
      providerId: "openrouter",
      issueType: "price",
      description: "输入价与公开页面不一致",
      sourceUrl: "https://openrouter.ai/pricing",
      contact: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty correction", () => {
    // TC-13b
    const result = feedbackSchema.safeParse({
      issueType: "other",
      description: "",
    });
    expect(result.success).toBe(false);
  });
});
