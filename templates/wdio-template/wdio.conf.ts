// Central WebdriverIO configuration for specs, retries, reporters, and runtime env values.
import process from 'node:process';

import type { Capabilities, Options, Reporters } from '@wdio/types';

import { loadRuntimeConfig } from './config/runtime-config';
import structuredReporterImport from './reporters/structured-reporter';

const runtimeConfig = loadRuntimeConfig();
const structuredReporter =
  structuredReporterImport as unknown as Reporters.ReporterClass;
const chromeBinary = process.env.CHROME_BIN;

export const config: Options.Testrunner &
  Capabilities.WithRequestedTestrunnerCapabilities = {
  runner: 'local',
  specs: ['./tests/**/*.spec.ts'],
  maxInstances: 1,
  baseUrl: runtimeConfig.uiBaseUrl,
  framework: 'mocha',
  tsConfigPath: './tsconfig.json',
  mochaOpts: {
    ui: 'bdd',
    timeout: 60_000
  },
  logLevel: 'error',
  waitforTimeout: 10_000,
  connectionRetryTimeout: 120_000,
  connectionRetryCount: 1,
  reporters: [
    'spec',
    [
      'allure',
      {
        outputDir: 'allure-results',
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: false
      }
    ],
    [structuredReporter, { outputFile: 'reports/logs/wdio-events.jsonl' }]
  ],
  capabilities: [
    {
      browserName: 'chrome',
      'goog:chromeOptions': {
        args: ['--headless=new', '--disable-dev-shm-usage', '--no-sandbox'],
        ...(chromeBinary ? { binary: chromeBinary } : {})
      }
    }
  ],
  afterTest: async function (
    _test: unknown,
    _context: unknown,
    result: { passed: boolean; error?: unknown }
  ) {
    if (!result.passed) {
      await browser.saveScreenshot(
        `test-results/${Date.now()}-${result.error ? 'failed' : 'result'}.png`
      );
    }
  }
};
