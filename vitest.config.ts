import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // 2 核机器：测试串行，避免 CPU 争抢导致超时误判
    fileParallelism: false,
    maxWorkers: 1,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
