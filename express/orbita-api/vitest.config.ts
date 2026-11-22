import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    isolate: false,
    fileParallelism: false,
    setupFiles: ["./vitest.setup.ts"],
  },
});
