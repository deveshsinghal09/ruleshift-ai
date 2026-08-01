import { loadEnvConfig } from "@next/env";
import { defineConfig } from "@playwright/test";

loadEnvConfig(process.cwd(), true);

export default defineConfig({
  expect: { timeout: 8_000 },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  outputDir: "test-results",
  reporter: process.env.CI
    ? [["line"], ["html", { open: "never", outputFolder: "playwright-report" }]]
    : "list",
  retries: 0,
  testDir: "./tests/e2e",
  timeout: 45_000,
  use: {
    actionTimeout: 10_000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_MANAGED_SERVERS === "1" ? undefined : [
    {
      command: "node scripts/run-e2e-server.mjs fallback 3100",
      reuseExistingServer: false,
      timeout: 120_000,
      url: "http://127.0.0.1:3100",
    },
    {
      command: "node scripts/run-e2e-server.mjs mock 3101",
      reuseExistingServer: false,
      timeout: 120_000,
      url: "http://127.0.0.1:3101",
    },
  ],
  workers: 1,
  projects: [
    {
      name: "fallback-chromium",
      testMatch: /fallback\/.*\.spec\.ts/u,
      use: { baseURL: "http://localhost:3100", browserName: "chromium" },
    },
    {
      name: "mock-chromium",
      testMatch: /mock\/.*\.spec\.ts/u,
      use: { baseURL: "http://localhost:3101", browserName: "chromium" },
    },
    {
      name: "mobile-chromium",
      testMatch: /mobile\/.*\.spec\.ts/u,
      use: {
        baseURL: "http://localhost:3100",
        browserName: "chromium",
        hasTouch: true,
        isMobile: true,
        viewport: { height: 812, width: 375 },
      },
    },
    {
      name: "keyboard-chromium",
      testMatch: /keyboard\/.*\.spec\.ts/u,
      use: { baseURL: "http://localhost:3100", browserName: "chromium" },
    },
  ],
});
