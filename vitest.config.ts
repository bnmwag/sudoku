import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 20_000,
    reporters: "default",
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
