#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const {
  CLI_PACKAGE_VERSION,
  DEFAULT_GITIGNORE,
  DEFAULT_TEMPLATE,
  MANAGED_FILE_PATTERNS,
  METADATA_FILENAME,
  MIN_NODE_VERSION,
  TEMPLATE_CATALOG
} = require('./lib/constants');
const { parseCliOptions, resolveNonInteractiveArgs } = require('./lib/args');
const {
  analyzeUpgrade,
  applySafeUpdates,
  detectTemplateFromProject,
  readProjectMetadata,
  renderTemplateFile,
  writeProjectMetadata
} = require('./lib/metadata');
const {
  createLocalCredentials,
  writeGeneratedLocalEnv
} = require('./lib/local-env');
const {
  askQuestion,
  askYesNo,
  selectTemplateInteractively
} = require('./lib/interactive');
const {
  assertSupportedNodeVersion,
  createColors,
  printHelp,
  printNextSteps,
  printPlaywrightInstallRecovery,
  printPrerequisiteWarnings,
  printSuccess,
  printSummary,
  printUpgradeReport
} = require('./lib/output');
const {
  collectPrerequisites,
  initializeGitRepository,
  runCommand
} = require('./lib/prereqs');
const { scaffoldProject } = require('./lib/scaffold');
const {
  createTemplateAliases,
  getTemplate,
  getTemplateDirectory,
  resolveTemplate,
  toPackageName
} = require('./lib/templates');

const colors = createColors();
const TEMPLATES = TEMPLATE_CATALOG.map((template) => {
  if (template.id !== 'playwright-template') {
    return template;
  }

  return {
    ...template,
    setup: {
      ...template.setup,
      run(targetDirectory) {
        return runCommand('npx', ['playwright', 'install'], targetDirectory);
      },
      recovery(targetDirectory) {
        printPlaywrightInstallRecovery(targetDirectory, colors);
      }
    }
  };
});

const TEMPLATE_ALIASES = createTemplateAliases(TEMPLATES);
const SUPPORTED_TEMPLATE_IDS = TEMPLATES.map((template) => template.id);

function createMetadataOptions() {
  return {
    cliPackageVersion: CLI_PACKAGE_VERSION,
    defaultGitignore: DEFAULT_GITIGNORE,
    getTemplateDirectory: (templateId) =>
      getTemplateDirectory(__dirname, templateId),
    managedPatterns: MANAGED_FILE_PATTERNS,
    metadataFilename: METADATA_FILENAME,
    toPackageName
  };
}

function createSummary(template, targetDirectory, generatedInCurrentDirectory) {
  return {
    template,
    targetDirectory,
    targetRelativePath: path.relative(process.cwd(), targetDirectory) || '.',
    generatedInCurrentDirectory,
    demoAppsManagedByTemplate: Boolean(template.demoAppsManagedByTemplate),
    localCredentials: null,
    gitInit: 'not-run',
    npmInstall: 'not-run',
    extraSetup: template.setup ? 'not-run' : null,
    testRun: 'not-run'
  };
}

async function resolveScaffoldArgs(args, options) {
  const explicitTemplate =
    args[0] && resolveTemplate(TEMPLATE_ALIASES, args[0]);
  const nonInteractiveOptions = {
    defaultTemplate: DEFAULT_TEMPLATE,
    resolveTemplate: (value) => resolveTemplate(TEMPLATE_ALIASES, value),
    supportedTemplateIds: SUPPORTED_TEMPLATE_IDS
  };

  if (explicitTemplate) {
    return resolveNonInteractiveArgs(args, nonInteractiveOptions);
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return resolveNonInteractiveArgs(args, nonInteractiveOptions);
  }

  const templateName = await selectTemplateInteractively(TEMPLATES);

  // Ask about API testing feature if not already specified via flags
  let withApi = options.withApi;
  if (withApi === null) {
    withApi = await askYesNo('Include REST API testing?', true);
  }

  const defaultTarget = args[0] ? args[0] : '.';
  const targetAnswer = await askQuestion(
    `Target directory (${defaultTarget}): `
  );
  const targetValue = targetAnswer || defaultTarget;
  const targetDirectory = path.resolve(process.cwd(), targetValue);

  return {
    templateName,
    targetDirectory,
    generatedInCurrentDirectory: targetDirectory === process.cwd(),
    withApi
  };
}

let lastProgressLineLength = 0;

function renderProgress(completed, total, label) {
  const width = 24;
  const filled = Math.round((completed / total) * width);
  const empty = width - filled;
  const bar = `${'='.repeat(filled)}${' '.repeat(empty)}`;
  const percentage = `${Math.round((completed / total) * 100)}`.padStart(
    3,
    ' '
  );
  const line = `[${bar}] ${percentage}% ${label}`;
  const paddingLength = Math.max(0, lastProgressLineLength - line.length);
  process.stdout.write(`\r${line}${' '.repeat(paddingLength)}`);
  lastProgressLineLength = line.length;
}

async function runPostGenerateActions(template, targetDirectory, summary) {
  const prerequisites = collectPrerequisites();
  const options = summary.options;
  const canPrompt = process.stdin.isTTY && process.stdout.isTTY;

  if (prerequisites.npm) {
    if (options.noInstall) {
      summary.npmInstall = 'skipped';
    } else {
      const shouldInstallDependencies = options.yes
        ? true
        : canPrompt
          ? await askYesNo('Run npm install now?', true)
          : false;

      if (shouldInstallDependencies) {
        await runCommand('npm', ['install'], targetDirectory);
        summary.npmInstall = 'completed';
      } else {
        summary.npmInstall = canPrompt ? 'skipped' : 'not-run';
      }
    }
  } else {
    process.stdout.write(
      `${colors.yellow('Skipping')} npm install prompt because npm is not available.\n`
    );
    summary.npmInstall = 'unavailable';
  }

  if (template.setup) {
    if (options.noSetup) {
      summary.extraSetup = 'skipped';
    } else if (prerequisites[template.setup.availability]) {
      const shouldRunExtraSetup = options.yes
        ? true
        : canPrompt
          ? await askYesNo(template.setup.prompt, true)
          : false;

      if (shouldRunExtraSetup) {
        try {
          await template.setup.run(targetDirectory);
          summary.extraSetup = 'completed';
        } catch (error) {
          summary.extraSetup = 'manual-recovery';
          if (typeof template.setup.recovery === 'function') {
            template.setup.recovery(targetDirectory);
          }

          const shouldContinue = await askYesNo(
            'Continue without completing setup?',
            true
          );

          if (!shouldContinue) {
            throw error;
          }
        }
      } else {
        summary.extraSetup = canPrompt ? 'skipped' : 'not-run';
      }
    } else {
      process.stdout.write(
        `${colors.yellow('Skipping')} ${template.setup.summaryLabel.toLowerCase()} prompt because ${template.setup.availability} is not available.\n`
      );
      summary.extraSetup = 'unavailable';
    }
  }

  if (prerequisites.npm) {
    if (options.noTest) {
      summary.testRun = 'skipped';
    } else {
      const shouldRunTests = options.yes
        ? true
        : canPrompt
          ? await askYesNo('Run npm test now?', false)
          : false;

      if (shouldRunTests) {
        await runCommand('npm', ['test'], targetDirectory);
        summary.testRun = 'completed';
      } else {
        summary.testRun = canPrompt ? 'skipped' : 'not-run';
      }
    }
  } else {
    process.stdout.write(
      `${colors.yellow('Skipping')} npm test prompt because npm is not available.\n`
    );
    summary.testRun = 'unavailable';
  }
}

function resolveUpgradeTarget(args) {
  if (args.length > 1) {
    throw new Error(
      'Too many arguments for upgrade. Use `create-qa-patterns upgrade check [target-directory]`.'
    );
  }

  return path.resolve(process.cwd(), args[0] || '.');
}

function runUpgradeCommand(rawArgs) {
  const [subcommand = 'check', ...rest] = rawArgs;
  const metadataOptions = createMetadataOptions();
  const options = parseCliOptions(rest, {
    resolveTemplate: (value) => resolveTemplate(TEMPLATE_ALIASES, value),
    supportedTemplateIds: SUPPORTED_TEMPLATE_IDS
  });
  const targetDirectory = resolveUpgradeTarget(options.positionalArgs);
  const metadata = readProjectMetadata(targetDirectory, METADATA_FILENAME);
  const templateId =
    metadata.template ||
    detectTemplateFromProject(targetDirectory, METADATA_FILENAME);
  const template = getTemplate(TEMPLATES, templateId);

  if (!template) {
    throw new Error(`Unsupported template "${templateId}".`);
  }

  const results = analyzeUpgrade(
    template,
    targetDirectory,
    metadata,
    metadataOptions
  );

  if (subcommand === 'check' || subcommand === 'report') {
    printUpgradeReport(
      targetDirectory,
      metadata,
      results,
      CLI_PACKAGE_VERSION,
      colors
    );
    return;
  }

  if (subcommand === 'apply') {
    if (!options.safe) {
      throw new Error(
        'Upgrade apply requires --safe. Only safe managed-file updates are supported.'
      );
    }

    printUpgradeReport(
      targetDirectory,
      metadata,
      results,
      CLI_PACKAGE_VERSION,
      colors
    );
    const outcome = applySafeUpdates(
      targetDirectory,
      metadata,
      results,
      metadataOptions
    );
    process.stdout.write(`\n${colors.bold('Upgrade apply')}\n`);
    process.stdout.write(`  Applied safe updates: ${outcome.appliedCount}\n`);
    process.stdout.write(
      `  Remaining conflicts: ${outcome.remainingConflicts}\n`
    );
    process.stdout.write('\n');
    return;
  }

  throw new Error(
    `Unsupported upgrade command "${subcommand}". Use check, report, or apply --safe.`
  );
}

async function main() {
  const rawArgs = process.argv.slice(2);

  assertSupportedNodeVersion();

  if (rawArgs[0] === 'upgrade') {
    runUpgradeCommand(rawArgs.slice(1));
    return;
  }

  if (rawArgs.includes('--help') || rawArgs.includes('-h')) {
    printHelp(TEMPLATES, colors, DEFAULT_TEMPLATE);
    return;
  }

  const metadataOptions = createMetadataOptions();
  const options = parseCliOptions(rawArgs, {
    resolveTemplate: (value) => resolveTemplate(TEMPLATE_ALIASES, value),
    supportedTemplateIds: SUPPORTED_TEMPLATE_IDS
  });
  const args = options.positionalArgs;
  const resolved = options.templateName
    ? resolveNonInteractiveArgs(args, {
        ...options,
        defaultTemplate: DEFAULT_TEMPLATE,
        resolveTemplate: (value) => resolveTemplate(TEMPLATE_ALIASES, value),
        supportedTemplateIds: SUPPORTED_TEMPLATE_IDS
      })
    : await resolveScaffoldArgs(args, options);
  const { templateName, targetDirectory, generatedInCurrentDirectory } = resolved;
  const withApi = resolved.withApi ?? options.withApi ?? true;
  const template = getTemplate(TEMPLATES, templateName);

  if (!template) {
    throw new Error(`Unsupported template "${templateName}".`);
  }

  const prerequisites = collectPrerequisites();
  const summary = createSummary(
    template,
    targetDirectory,
    generatedInCurrentDirectory
  );
  summary.options = options;
  printPrerequisiteWarnings(prerequisites, colors);
  const localEnv = await scaffoldProject(
    template,
    targetDirectory,
    prerequisites,
    {
      createLocalCredentials,
      defaultGitignore: DEFAULT_GITIGNORE,
      getTemplateDirectory: (templateId) =>
        getTemplateDirectory(__dirname, templateId),
      initializeGitRepository,
      renderProgress,
      toPackageName,
      withApi,
      writeGeneratedLocalEnv
    }
  );
  summary.localCredentials = localEnv.credentials;
  writeProjectMetadata(template, targetDirectory, undefined, metadataOptions);
  summary.gitInit = prerequisites.git ? 'completed' : 'unavailable';
  printSuccess(template, targetDirectory, generatedInCurrentDirectory, colors);
  await runPostGenerateActions(template, targetDirectory, summary);
  writeProjectMetadata(
    template,
    targetDirectory,
    readProjectMetadata(targetDirectory, METADATA_FILENAME),
    metadataOptions
  );
  printSummary(summary, colors);
  printNextSteps(summary, colors);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
