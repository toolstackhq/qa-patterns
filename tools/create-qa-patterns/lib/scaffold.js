const fs = require('node:fs');
const path = require('node:path');
const { renderTemplateFile } = require('./metadata');

// Files and directories removed when the user opts out of API testing.
const API_STRIP_DIRS = [
  'utils/api-client',
  'demo-apps/api-demo-server'
];

const API_STRIP_FILES = {
  'playwright-template': ['tests/api-people.spec.ts'],
  'cypress-template': [
    'cypress/e2e/api-people.cy.ts',
    'cypress/support/api-tasks.ts'
  ],
  'wdio-template': [
    'tests/api-people.spec.ts',
    'utils/api-helper.ts'
  ]
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureScaffoldTarget(targetDirectory) {
  if (!fs.existsSync(targetDirectory)) {
    fs.mkdirSync(targetDirectory, { recursive: true });
    return;
  }

  const entries = fs
    .readdirSync(targetDirectory)
    .filter((entry) => !['.git', '.DS_Store'].includes(entry));

  if (entries.length > 0) {
    throw new Error(`Target directory is not empty: ${targetDirectory}`);
  }
}

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

function stripApiFeature(targetDirectory, templateId) {
  // Remove API-specific directories
  for (const dir of API_STRIP_DIRS) {
    const dirPath = path.join(targetDirectory, dir);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  }

  // Remove API-specific files for this template
  const files = API_STRIP_FILES[templateId] || [];
  for (const file of files) {
    const filePath = path.join(targetDirectory, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // Remove demo:api script from package.json
  const pkgPath = path.join(targetDirectory, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const content = fs.readFileSync(pkgPath, 'utf8');
    const updated = content.replace(/^ *"demo:api":.*,?\n/m, '');
    fs.writeFileSync(pkgPath, updated, 'utf8');
  }

  // Strip apiBaseUrl from config files
  const configFiles = [
    'config/runtime-config.ts',
    'config/environments.ts'
  ];
  for (const configFile of configFiles) {
    const configPath = path.join(targetDirectory, configFile);
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      fs.writeFileSync(configPath, removeApiBaseUrl(content), 'utf8');
    }
  }

  // Template-specific config cleanup
  if (templateId === 'playwright-template') {
    // Remove apiBaseUrl references from playwright.config.ts
    const pwConfigPath = path.join(targetDirectory, 'playwright.config.ts');
    if (fs.existsSync(pwConfigPath)) {
      let content = fs.readFileSync(pwConfigPath, 'utf8');
      content = content.replace(/^.*apiBaseUrl.*\n/gm, '');
      // Replace webServer conditional with just UI server
      content = content.replace(
        /webServer: shouldAutoStartDemoApps[\s\S]*?\]\s*: undefined,/,
        `webServer: shouldAutoStartDemoApps
    ? {
        command: 'npm run demo:ui',
        url: \`\${runtimeConfig.uiBaseUrl}/health\`,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000
      }
    : undefined,`
      );
      fs.writeFileSync(pwConfigPath, content, 'utf8');
    }

    // Remove apiClient fixture and import
    const fixturePath = path.join(targetDirectory, 'fixtures', 'test-fixtures.ts');
    if (fs.existsSync(fixturePath)) {
      let content = fs.readFileSync(fixturePath, 'utf8');
      content = content.replace(
        /import { createRestClient, type RestClient } from '\.\.\/utils\/api-client';\n/,
        ''
      );
      content = content.replace(/^.*apiClient.*\n/gm, '');
      fs.writeFileSync(fixturePath, content, 'utf8');
    }

    // Remove demo:api from package.json
    const pkgJsonPath = path.join(targetDirectory, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      const content = fs.readFileSync(pkgJsonPath, 'utf8');
      const updated = content.replace(/^ *"demo:api":.*,?\n/m, '');
      fs.writeFileSync(pkgJsonPath, updated, 'utf8');
    }
  }

  if (templateId === 'cypress-template') {
    // Remove api-tasks import and registration from cypress.config.ts
    const cyConfigPath = path.join(targetDirectory, 'cypress.config.ts');
    if (fs.existsSync(cyConfigPath)) {
      let content = fs.readFileSync(cyConfigPath, 'utf8');
      content = content.replace(
        /import { registerApiTasks } from '\.\/cypress\/support\/api-tasks';\n/,
        ''
      );
      content = content.replace(/^ *registerApiTasks\(on\);\n\n/m, '');
      content = content.replace(/^ *apiBaseUrl:.*\n/m, '');
      fs.writeFileSync(cyConfigPath, content, 'utf8');
    }
  }
}

function customizeProject(targetDirectory, template, options) {
  const packageJsonPath = path.join(targetDirectory, 'package.json');
  const packageLockPath = path.join(targetDirectory, 'package-lock.json');
  const gitignorePath = path.join(targetDirectory, '.gitignore');

  if (fs.existsSync(packageJsonPath)) {
    fs.writeFileSync(
      packageJsonPath,
      renderTemplateFile(template, 'package.json', targetDirectory, options),
      'utf8'
    );
  }

  if (fs.existsSync(packageLockPath)) {
    fs.writeFileSync(
      packageLockPath,
      renderTemplateFile(
        template,
        'package-lock.json',
        targetDirectory,
        options
      ),
      'utf8'
    );
  }

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, options.defaultGitignore, 'utf8');
  }
}

async function scaffoldProject(
  template,
  targetDirectory,
  prerequisites,
  options
) {
  const {
    createLocalCredentials,
    defaultGitignore,
    getTemplateDirectory,
    initializeGitRepository,
    renderProgress,
    toPackageName,
    writeGeneratedLocalEnv
  } = options;
  const templateDirectory = getTemplateDirectory(template.id);

  if (!fs.existsSync(templateDirectory)) {
    throw new Error(`Template files are missing for "${template.id}".`);
  }

  const steps = [
    'Validating target directory',
    'Copying template files',
    'Customizing project files',
    'Finalizing scaffold'
  ];

  renderProgress(0, steps.length, 'Preparing scaffold');
  ensureScaffoldTarget(targetDirectory);
  await sleep(60);

  renderProgress(1, steps.length, steps[0]);
  await sleep(80);

  fs.cpSync(templateDirectory, targetDirectory, { recursive: true });
  renderProgress(2, steps.length, steps[1]);
  await sleep(80);

  customizeProject(targetDirectory, template, {
    defaultGitignore,
    getTemplateDirectory,
    toPackageName
  });

  if (options.withApi === false) {
    stripApiFeature(targetDirectory, template.id);
  }

  renderProgress(3, steps.length, steps[2]);
  await sleep(80);

  if (prerequisites.git) {
    initializeGitRepository(targetDirectory);
  }

  const localEnv = writeGeneratedLocalEnv(
    targetDirectory,
    template.id,
    createLocalCredentials(targetDirectory),
    { withApi: options.withApi }
  );

  renderProgress(4, steps.length, steps[3]);
  await sleep(60);
  process.stdout.write('\n');
  return localEnv;
}

module.exports = {
  scaffoldProject,
  stripApiFeature
};
