// Central Cypress configuration for specs, retries, artifacts, and runtime env values.
import * as os from "node:os";

import { allureCypress } from "allure-cypress/reporter";
import { defineConfig } from "cypress";

import { loadRuntimeConfig } from "./config/runtime-config";

const runtimeConfig = loadRuntimeConfig();

export default defineConfig({
  e2e: {
    baseUrl: runtimeConfig.uiBaseUrl,
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    setupNodeEvents(on, config) {
      // Keep Cypress terminal output as the default path most users expect.
      // Remove the Allure line below if you prefer to stay with Cypress output only.
      allureCypress(on, config, {
        resultsDir: "allure-results",
        environmentInfo: {
          os_platform: os.platform(),
          os_release: os.release(),
          os_version: os.version(),
          node_version: process.version
        }
      });

      config.env = {
        ...config.env,
        testEnv: runtimeConfig.testEnv,
        testRunId: runtimeConfig.testRunId,
        credentials: runtimeConfig.credentials
      };

      return config;
    }
  },
  fixturesFolder: false,
  retries: {
    runMode: 1,
    openMode: 0
  },
  screenshotOnRunFailure: true,
  video: true,
  videosFolder: "reports/videos",
  screenshotsFolder: "reports/screenshots"
});
