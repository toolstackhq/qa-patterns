import { test as base } from "@playwright/test";

import { loadRuntimeConfig, type RuntimeConfig } from "../config/runtime-config";
import { DataFactory } from "../data/factories/data-factory";
import { LoginPage } from "../pages/login-page";
import { PeoplePage } from "../pages/people-page";
import { createLogger, type Logger } from "../utils/logger";
import { StepLogger } from "../utils/test-step";

type FrameworkFixtures = {
  appConfig: RuntimeConfig;
  logger: Logger;
  stepLogger: StepLogger;
  dataFactory: DataFactory;
  loginPage: LoginPage;
  peoplePage: PeoplePage;
};

export const test = base.extend<FrameworkFixtures>({
  appConfig: async ({}, use) => {
    await use(loadRuntimeConfig());
  },
  logger: async ({}, use, testInfo) => {
    const logger = createLogger({
      test: testInfo.titlePath.join(" > ")
    });
    await use(logger);
  },
  stepLogger: async ({ logger }, use) => {
    await use(new StepLogger(logger.child({ scope: "steps" })));
  },
  dataFactory: async ({ appConfig }, use) => {
    await use(new DataFactory(appConfig.testRunId));
  },
  loginPage: async ({ page, appConfig, logger }, use) => {
    await use(new LoginPage(page, appConfig.uiBaseUrl, logger.child({ pageObject: "LoginPage" })));
  },
  peoplePage: async ({ page, appConfig, logger }, use) => {
    await use(new PeoplePage(page, appConfig.uiBaseUrl, logger.child({ pageObject: "PeoplePage" })));
  }
});

export { expect } from "@playwright/test";
