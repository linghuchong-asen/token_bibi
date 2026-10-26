import { describe, expect, it } from "vitest";
// @ts-expect-error JavaScript utility module
import { parseCsv, rowsToObjects } from "../scripts/lib/csv.mjs";

describe("CSV import parsing", () => {
  it("parses quoted commas and newlines", () => {
    // TC-13a / data import smoke
    const rows = parseCsv('id,description\n1,"hello, world"\n2,"line1\nline2"\n');
    expect(rows).toHaveLength(3);
    expect(rows[1][1]).toBe("hello, world");
    expect(rows[2][1]).toBe("line1\nline2");
  });

  it("maps rows to header objects", () => {
    const objects = rowsToObjects([
      ["providerId", "modelId"],
      ["openrouter", "gpt-5-6-sol"],
    ]);
    expect(objects[0].providerId).toBe("openrouter");
    expect(objects[0].modelId).toBe("gpt-5-6-sol");
  });
});
