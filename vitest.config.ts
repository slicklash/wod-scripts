import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
    },
  },
  resolve: {
    alias: {
      "@common": new URL("./src/common/", import.meta.url).pathname,
    },
  },
});
