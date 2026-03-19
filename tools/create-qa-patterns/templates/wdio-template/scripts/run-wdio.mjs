#!/usr/bin/env node

// Starts the local demo app when needed, then launches the WebdriverIO runner.
import process from 'node:process';
import path from 'node:path';
import { spawn } from 'node:child_process';

import dotenv from 'dotenv';

const args = process.argv.slice(2);
const cwd = process.cwd();
const uiHealthUrl = 'http://127.0.0.1:3000/health';
const apiHealthUrl = 'http://127.0.0.1:3001/health';
const environment = process.env.TEST_ENV ?? 'dev';
const environmentDefaults = {
  dev: 'http://127.0.0.1:3000',
  staging: 'https://staging-ui.example.internal',
  prod: 'https://ui.example.internal'
};
const apiDefaults = {
  dev: 'http://127.0.0.1:3001',
  staging: 'https://staging-api.example.internal',
  prod: 'https://api.example.internal'
};

dotenv.config({ path: path.resolve(cwd, '.env') });
dotenv.config({
  path: path.resolve(cwd, `.env.${environment}`),
  override: true
});

const uiBaseUrl =
  process.env[`${environment.toUpperCase()}_UI_BASE_URL`] ??
  process.env.UI_BASE_URL ??
  environmentDefaults[environment] ??
  environmentDefaults.dev;

const apiBaseUrl =
  process.env[`${environment.toUpperCase()}_API_BASE_URL`] ??
  process.env.API_BASE_URL ??
  apiDefaults[environment] ??
  apiDefaults.dev;

const shouldAutoStartDemoApp =
  environment === 'dev' &&
  uiBaseUrl === environmentDefaults.dev &&
  process.env.WDIO_DISABLE_LOCAL_DEMO_APP !== 'true';

const shouldAutoStartApiServer =
  environment === 'dev' &&
  apiBaseUrl === apiDefaults.dev &&
  process.env.WDIO_DISABLE_LOCAL_DEMO_APP !== 'true';

function getCommandName(command) {
  return process.platform === 'win32' ? `${command}.cmd` : command;
}

function spawnCommand(command, commandArgs, options = {}) {
  return spawn(getCommandName(command), commandArgs, {
    cwd,
    stdio: 'inherit',
    ...options
  });
}

async function waitForHealthcheck(url, timeoutMs = 30_000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await globalThis.fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Service is not ready yet.
    }

    await new Promise((resolve) => globalThis.setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function killChild(child) {
  if (!child || child.killed) {
    return;
  }

  child.kill('SIGTERM');
}

async function run() {
  let demoAppProcess;
  let apiServerProcess;

  try {
    if (shouldAutoStartDemoApp) {
      demoAppProcess = spawnCommand('npm', ['run', 'demo:ui']);
      await waitForHealthcheck(uiHealthUrl);
    }

    if (shouldAutoStartApiServer) {
      apiServerProcess = spawnCommand('npm', ['run', 'demo:api']);
      await waitForHealthcheck(apiHealthUrl);
    }

    const wdioProcess = spawnCommand('npx', [
      'wdio',
      'run',
      './wdio.conf.ts',
      ...args
    ]);

    const exitCode = await new Promise((resolve) => {
      wdioProcess.on('close', resolve);
      wdioProcess.on('error', () => resolve(1));
    });

    if (exitCode !== 0) {
      process.exit(Number(exitCode) || 1);
    }
  } finally {
    killChild(apiServerProcess);
    killChild(demoAppProcess);
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => process.exit(1));
}

run().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exit(1);
});
