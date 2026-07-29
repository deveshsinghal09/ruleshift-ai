import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "src"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    hookTimeout: 30_000,
    include: ["tests/database/**/*.database.ts"],
    testTimeout: 30_000,
  },
});
