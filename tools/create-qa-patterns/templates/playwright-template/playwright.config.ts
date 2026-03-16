import { defineConfig, devices } from "@playwright/test";

import { loadRuntimeConfig } from "./config/runtime-config";

const runtimeConfig = loadRuntimeConfig();

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 45_000,
  expect: {
    timeout: 10_000
  },
  outputDir: "test-results",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "reports/html" }],
    // Keep the HTML reporter as the default path most users expect.
    // Remove the Allure line below if you prefer to stay with Playwright's built-in reporters only.
    ["allure-playwright", { resultsDir: "allure-results" }],
    ["./reporters/structured-reporter.ts", { outputFile: "reports/logs/playwright-events.jsonl" }]
  ],
  use: {
    baseURL: runtimeConfig.uiBaseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless: !process.env.PWDEBUG
  },
  metadata: {
    environment: runtimeConfig.testEnv,
    testRunId: runtimeConfig.testRunId,
    apiBaseUrl: runtimeConfig.apiBaseUrl
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ]
});
