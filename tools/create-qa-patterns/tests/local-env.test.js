const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  createLocalCredentials,
  renderLocalEnv,
  writeGeneratedLocalEnv
} = require('../lib/local-env');

test('createLocalCredentials generates non-empty username and password', () => {
  const credentials = createLocalCredentials('/tmp/my-project');

  assert.match(credentials.username, /^my-project-/);
  assert.ok(credentials.password.length > 10);
});

test('renderLocalEnv includes api base url only for playwright', () => {
  const credentials = {
    username: 'local-user',
    password: 'local-password'
  };

  const playwrightEnv = renderLocalEnv('playwright-template', credentials);
  const cypressEnv = renderLocalEnv('cypress-template', credentials);
  const wdioEnv = renderLocalEnv('wdio-template', credentials);

  assert.match(playwrightEnv, /DEV_API_BASE_URL=http:\/\/127.0.0.1:3001/);
  assert.doesNotMatch(cypressEnv, /DEV_API_BASE_URL/);
  assert.doesNotMatch(wdioEnv, /DEV_API_BASE_URL/);
  assert.match(playwrightEnv, /DEV_APP_USERNAME=local-user/);
  assert.match(cypressEnv, /UI_DEMO_PASSWORD=local-password/);
  assert.match(wdioEnv, /UI_DEMO_PASSWORD=local-password/);
});

test('writeGeneratedLocalEnv creates .env only once', () => {
  const targetDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'qa-patterns-env-')
  );
  const credentials = {
    username: 'first-user',
    password: 'first-password'
  };

  const firstWrite = writeGeneratedLocalEnv(
    targetDirectory,
    'cypress-template',
    credentials
  );
  const secondWrite = writeGeneratedLocalEnv(
    targetDirectory,
    'cypress-template',
    {
      username: 'second-user',
      password: 'second-password'
    }
  );

  const envContents = fs.readFileSync(
    path.join(targetDirectory, '.env'),
    'utf8'
  );

  assert.equal(firstWrite.created, true);
  assert.equal(secondWrite.created, false);
  assert.match(envContents, /first-user/);
  assert.doesNotMatch(envContents, /second-user/);
});
