#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const currentProcess = globalThis.process;
const envPath = path.resolve(currentProcess.cwd(), '.env');

if (fs.existsSync(envPath)) {
  currentProcess.exit(0);
}

const projectSlug = path
  .basename(currentProcess.cwd())
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 12);
const username = `${projectSlug || 'local'}-${crypto.randomBytes(3).toString('hex')}`;
const password = `${crypto.randomBytes(9).toString('base64url')}A1!`;

const envContents = [
  'TEST_ENV=dev',
  'TEST_RUN_ID=local',
  'DEV_UI_BASE_URL=http://127.0.0.1:3000',
  `DEV_APP_USERNAME=${username}`,
  `DEV_APP_PASSWORD=${password}`,
  `UI_DEMO_USERNAME=${username}`,
  `UI_DEMO_PASSWORD=${password}`
].join('\n');

fs.writeFileSync(envPath, `${envContents}\n`, 'utf8');
currentProcess.stdout.write(
  `Generated local .env with demo credentials for ${username}\n` +
    `Credentials were written to ${envPath}\n`
);
