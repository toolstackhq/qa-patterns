const test = require('node:test');
const assert = require('node:assert/strict');

const { DEFAULT_TEMPLATE, TEMPLATE_CATALOG } = require('../lib/constants');
const { parseCliOptions, resolveNonInteractiveArgs } = require('../lib/args');
const { createTemplateAliases, resolveTemplate } = require('../lib/templates');

const templateAliases = createTemplateAliases(TEMPLATE_CATALOG);
const supportedTemplateIds = TEMPLATE_CATALOG.map((template) => template.id);

test('parseCliOptions resolves --template aliases', () => {
  const options = parseCliOptions(['--template', 'pw', 'demo'], {
    resolveTemplate: (value) => resolveTemplate(templateAliases, value),
    supportedTemplateIds
  });

  assert.equal(options.templateName, 'playwright-template');
  assert.deepEqual(options.positionalArgs, ['demo']);
});

test('resolveNonInteractiveArgs defaults to the default template for a directory name', () => {
  const result = resolveNonInteractiveArgs(['demo-project'], {
    defaultTemplate: DEFAULT_TEMPLATE,
    resolveTemplate: (value) => resolveTemplate(templateAliases, value),
    supportedTemplateIds
  });

  assert.equal(result.templateName, DEFAULT_TEMPLATE);
  assert.equal(result.generatedInCurrentDirectory, false);
  assert.match(result.targetDirectory, /demo-project$/);
});

test('resolveNonInteractiveArgs accepts explicit template and target directory', () => {
  const result = resolveNonInteractiveArgs(
    ['cypress-template', 'demo-project'],
    {
      defaultTemplate: DEFAULT_TEMPLATE,
      resolveTemplate: (value) => resolveTemplate(templateAliases, value),
      supportedTemplateIds
    }
  );

  assert.equal(result.templateName, 'cypress-template');
  assert.equal(result.generatedInCurrentDirectory, false);
  assert.match(result.targetDirectory, /demo-project$/);
});

test('resolveNonInteractiveArgs accepts a WebdriverIO alias and target directory', () => {
  const result = resolveNonInteractiveArgs(['wdio', 'demo-project'], {
    defaultTemplate: DEFAULT_TEMPLATE,
    resolveTemplate: (value) => resolveTemplate(templateAliases, value),
    supportedTemplateIds
  });

  assert.equal(result.templateName, 'wdio-template');
  assert.equal(result.generatedInCurrentDirectory, false);
  assert.match(result.targetDirectory, /demo-project$/);
});
