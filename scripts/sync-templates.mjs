#!/usr/bin/env node

/**
 * Copies canonical source files from packages/qa-patterns-core into both
 * framework templates and the CLI tool's bundled template copies.
 *
 * Playwright receives files as-is. Cypress receives files with targeted
 * transforms (remove apiBaseUrl, adjust import paths). WebdriverIO uses the
 * same shared config/data layer with a Cypress-like config transform.
 *
 * Run:  node scripts/sync-templates.mjs
 * Check: node scripts/sync-templates.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CORE = path.join(ROOT, 'packages', 'qa-patterns-core', 'src');
const CHECK_MODE = process.argv.includes('--check');

// ---------------------------------------------------------------------------
// Transforms — small, auditable functions that adapt canonical files for Cypress
// ---------------------------------------------------------------------------

function removeApiBaseUrl(content) {
  return content
    .replace(/^.*apiBaseUrl: z\.string\(\)\.url\(\),\n/m, '')
    .replace(/^.*apiBaseUrl: string;\n/m, '')
    .replace(/^.*apiBaseUrl: ['"][^'"]*['"],\n/gm, '')
    .replace(
      /^ *const apiBaseUrl =\n.*_API_BASE_URL.*\n.*API_BASE_URL.*\n.*defaults\.apiBaseUrl;\n/m,
      ''
    )
    .replace(/^.*apiBaseUrl,\n/m, '');
}

function rewriteDataImports(content) {
  return content
    .replace(
      /from ['"]\.\.\/generators\/seeded-faker['"]/g,
      "from './seeded-faker'"
    )
    .replace(
      /from ['"]\.\.\/generators\/id-generator['"]/g,
      "from './id-generator'"
    );
}

// ---------------------------------------------------------------------------
// Mapping: canonical source -> template destinations + optional transforms
// ---------------------------------------------------------------------------

const SYNC_MAP = [
  // --- config files ---
  {
    source: 'config/test-env.ts',
    targets: [
      { dest: 'templates/playwright-template/config/test-env.ts' },
      { dest: 'templates/cypress-template/config/test-env.ts' },
      { dest: 'templates/wdio-template/config/test-env.ts' }
    ]
  },
  {
    source: 'config/secret-manager.ts',
    targets: [
      { dest: 'templates/playwright-template/config/secret-manager.ts' },
      { dest: 'templates/cypress-template/config/secret-manager.ts' },
      { dest: 'templates/wdio-template/config/secret-manager.ts' }
    ]
  },
  {
    source: 'config/environments.ts',
    targets: [
      { dest: 'templates/playwright-template/config/environments.ts' },
      { dest: 'templates/cypress-template/config/environments.ts' },
      { dest: 'templates/wdio-template/config/environments.ts' }
    ]
  },
  {
    source: 'config/runtime-config.ts',
    targets: [
      { dest: 'templates/playwright-template/config/runtime-config.ts' },
      { dest: 'templates/cypress-template/config/runtime-config.ts' },
      { dest: 'templates/wdio-template/config/runtime-config.ts' }
    ]
  },
  // --- data files ---
  {
    source: 'data/generators/id-generator.ts',
    targets: [
      { dest: 'templates/playwright-template/data/generators/id-generator.ts' },
      {
        dest: 'templates/cypress-template/cypress/support/data/id-generator.ts'
      },
      {
        dest: 'templates/wdio-template/data/generators/id-generator.ts'
      }
    ]
  },
  {
    source: 'data/generators/seeded-faker.ts',
    targets: [
      { dest: 'templates/playwright-template/data/generators/seeded-faker.ts' },
      {
        dest: 'templates/cypress-template/cypress/support/data/seeded-faker.ts'
      },
      {
        dest: 'templates/wdio-template/data/generators/seeded-faker.ts'
      }
    ]
  },
  {
    source: 'data/factories/data-factory.ts',
    targets: [
      { dest: 'templates/playwright-template/data/factories/data-factory.ts' },
      {
        dest: 'templates/cypress-template/cypress/support/data/data-factory.ts',
        transforms: [rewriteDataImports]
      },
      {
        dest: 'templates/wdio-template/data/factories/data-factory.ts'
      }
    ]
  },
  // --- REST client files ---
  ...['client', 'types', 'interpolate', 'mask', 'mask-rules', 'transport', 'retry', 'logger', 'response', 'index'].map(
    (name) => ({
      source: `api/rest-client/${name}.ts`,
      targets: [
        { dest: `templates/playwright-template/utils/api-client/${name}.ts` },
        { dest: `templates/cypress-template/utils/api-client/${name}.ts` },
        { dest: `templates/wdio-template/utils/api-client/${name}.ts` }
      ]
    })
  )
];

// Files and directories to exclude when syncing templates to the CLI tool
const CLI_SYNC_EXCLUDE = new Set([
  'node_modules',
  'test-results',
  'playwright-report',
  'allure-results',
  'allure-report',
  'reports',
  '.env'
]);

// ---------------------------------------------------------------------------
// Sync logic
// ---------------------------------------------------------------------------

let driftCount = 0;

function readCanonical(relativePath) {
  return fs.readFileSync(path.join(CORE, relativePath), 'utf8');
}

function applyTransforms(content, transforms) {
  if (!transforms || transforms.length === 0) {
    return content;
  }
  return transforms.reduce((result, transform) => transform(result), content);
}

function syncFile(source, target) {
  const canonical = readCanonical(source.source);

  for (const mapping of source.targets) {
    const expected = applyTransforms(canonical, mapping.transforms);
    const destPath = path.join(ROOT, mapping.dest);

    if (CHECK_MODE) {
      const current = fs.existsSync(destPath)
        ? fs.readFileSync(destPath, 'utf8')
        : null;
      if (current !== expected) {
        driftCount += 1;
        console.error(`DRIFT: ${mapping.dest}`);
        if (current === null) {
          console.error('  File does not exist');
        }
      }
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, expected, 'utf8');
      console.log(`synced: ${mapping.dest}`);
    }
  }
}

function syncCliTemplates() {
  const templateNames = [
    'playwright-template',
    'cypress-template',
    'wdio-template'
  ];

  for (const name of templateNames) {
    const src = path.join(ROOT, 'templates', name);
    const dest = path.join(
      ROOT,
      'tools',
      'create-qa-patterns',
      'templates',
      name
    );

    if (!fs.existsSync(src)) {
      console.error(`WARNING: template source not found: ${src}`);
      continue;
    }

    if (CHECK_MODE) {
      checkCliTemplateSync(src, dest, name);
    } else {
      fs.rmSync(dest, { recursive: true, force: true });
      copyDirFiltered(src, dest);
      console.log(`synced CLI template: ${name}`);
    }
  }
}

function copyDirFiltered(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    if (CLI_SYNC_EXCLUDE.has(entry.name)) {
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirFiltered(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function checkCliTemplateSync(src, dest, name) {
  if (!fs.existsSync(dest)) {
    driftCount += 1;
    console.error(
      `DRIFT: CLI template missing: tools/create-qa-patterns/templates/${name}`
    );
    return;
  }

  const srcFiles = collectFiles(src).filter(
    (f) => !CLI_SYNC_EXCLUDE.has(f.split(path.sep)[0])
  );
  const destFiles = collectFiles(dest);

  const srcSet = new Set(srcFiles);
  const destSet = new Set(destFiles);

  for (const file of srcFiles) {
    if (!destSet.has(file)) {
      driftCount += 1;
      console.error(
        `DRIFT: CLI template missing file: tools/create-qa-patterns/templates/${name}/${file}`
      );
      continue;
    }

    const srcContent = fs.readFileSync(path.join(src, file), 'utf8');
    const destContent = fs.readFileSync(path.join(dest, file), 'utf8');
    if (srcContent !== destContent) {
      driftCount += 1;
      console.error(
        `DRIFT: CLI template differs: tools/create-qa-patterns/templates/${name}/${file}`
      );
    }
  }

  for (const file of destFiles) {
    if (!srcSet.has(file)) {
      driftCount += 1;
      console.error(
        `DRIFT: CLI template has extra file: tools/create-qa-patterns/templates/${name}/${file}`
      );
    }
  }
}

function collectFiles(dir, prefix = '') {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (CLI_SYNC_EXCLUDE.has(entry.name)) {
      continue;
    }

    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...collectFiles(path.join(dir, entry.name), relative));
    } else {
      results.push(relative);
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log(
  CHECK_MODE
    ? 'Checking template sync...'
    : 'Syncing templates from qa-patterns-core...'
);
console.log('');

for (const mapping of SYNC_MAP) {
  syncFile(mapping);
}

console.log('');
syncCliTemplates();

if (CHECK_MODE) {
  console.log('');
  if (driftCount > 0) {
    console.error(
      `Found ${driftCount} file(s) out of sync. Run: node scripts/sync-templates.mjs`
    );
    process.exit(1);
  } else {
    console.log('All templates are in sync.');
  }
} else {
  console.log('');
  console.log('Done. All templates synced.');
}
