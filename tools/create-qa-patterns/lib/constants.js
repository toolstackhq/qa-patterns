const DEFAULT_TEMPLATE = 'playwright-template';
const CLI_PACKAGE_VERSION = require('../package.json').version;
const METADATA_FILENAME = '.qa-patterns.json';
const MIN_NODE_VERSION = {
  major: 18,
  minor: 18,
  patch: 0
};

const DEFAULT_GITIGNORE = `node_modules/

.env
.env.*
!.env.example

.DS_Store
*.log
*.tgz
.idea/
.vscode/
.nyc_output/
coverage/
dist/
build/
tmp/
temp/
downloads/
cypress.env.json
reports/
cypress/screenshots/
cypress/videos/
reports/screenshots/
reports/videos/
allure-results/
allure-report/
test-results/
playwright-report/
`;

const MANAGED_FILE_PATTERNS = {
  common: [
    '.env.example',
    '.gitignore',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'eslint.config.mjs',
    'allurerc.mjs',
    'config/**',
    'scripts/**',
    '.github/**'
  ],
  'playwright-template': [
    'playwright.config.ts',
    'docker/**',
    'lint/**',
    'reporters/**',
    'utils/logger.ts',
    'utils/test-step.ts'
  ],
  'cypress-template': ['cypress.config.ts'],
  'wdio-template': [
    'wdio.conf.ts',
    'lint/**',
    'reporters/**',
    'utils/logger.ts',
    'utils/test-step.ts'
  ]
};

const TEMPLATE_CATALOG = [
  {
    id: DEFAULT_TEMPLATE,
    aliases: ['playwright', 'pw'],
    label: 'Playwright Template',
    description:
      'TypeScript starter with page objects, fixtures, multi-environment config, reporting, linting, CI and Docker.',
    defaultPackageName: 'playwright-template',
    demoAppsManagedByTemplate: true,
    setup: {
      availability: 'npx',
      prompt: 'Run npx playwright install now?',
      summaryLabel: 'Playwright browser install',
      nextStep: 'npx playwright install'
    }
  },
  {
    id: 'cypress-template',
    aliases: ['cypress', 'cy'],
    label: 'Cypress Template',
    description:
      'TypeScript starter with Cypress e2e specs, custom commands, page modules, env-based config, CI, and a bundled demo app.',
    defaultPackageName: 'cypress-template',
    demoAppsManagedByTemplate: true
  },
  {
    id: 'wdio-template',
    aliases: ['webdriverio', 'wdio'],
    label: 'WebdriverIO Template',
    description:
      'TypeScript starter with WebdriverIO + Mocha, page objects, env-based config, CI, and a bundled demo app.',
    defaultPackageName: 'wdio-template',
    demoAppsManagedByTemplate: true
  }
];

module.exports = {
  CLI_PACKAGE_VERSION,
  DEFAULT_GITIGNORE,
  DEFAULT_TEMPLATE,
  MANAGED_FILE_PATTERNS,
  METADATA_FILENAME,
  MIN_NODE_VERSION,
  TEMPLATE_CATALOG
};
