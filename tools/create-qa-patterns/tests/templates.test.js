const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createTemplateAliases,
  resolveTemplate,
  toPackageName
} = require('../lib/templates');

test('toPackageName normalizes directory names for generated packages', () => {
  assert.equal(
    toPackageName('/tmp/My QA Project', {
      defaultPackageName: 'fallback-template'
    }),
    'my-qa-project'
  );
  assert.equal(
    toPackageName('/tmp/---', { defaultPackageName: 'fallback-template' }),
    'fallback-template'
  );
});

test('createTemplateAliases resolves template ids and aliases', () => {
  const aliases = createTemplateAliases([
    {
      id: 'playwright-template',
      aliases: ['playwright', 'pw']
    },
    {
      id: 'wdio-template',
      aliases: ['webdriverio', 'wdio']
    }
  ]);

  assert.equal(
    resolveTemplate(aliases, 'playwright-template'),
    'playwright-template'
  );
  assert.equal(resolveTemplate(aliases, 'playwright'), 'playwright-template');
  assert.equal(resolveTemplate(aliases, 'pw'), 'playwright-template');
  assert.equal(resolveTemplate(aliases, 'wdio-template'), 'wdio-template');
  assert.equal(resolveTemplate(aliases, 'webdriverio'), 'wdio-template');
  assert.equal(resolveTemplate(aliases, 'wdio'), 'wdio-template');
});
