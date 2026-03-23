const { MIN_NODE_VERSION } = require('./constants');

function createColors(processObject = process) {
  const colorEnabled =
    Boolean(processObject.stdout?.isTTY) && !('NO_COLOR' in processObject.env);

  function style(text, ...codes) {
    if (!colorEnabled) {
      return text;
    }

    return `\u001b[${codes.join(';')}m${text}\u001b[0m`;
  }

  return {
    bold(text) {
      return style(text, 1);
    },
    dim(text) {
      return style(text, 2);
    },
    cyan(text) {
      return style(text, 36);
    },
    green(text) {
      return style(text, 32);
    },
    yellow(text) {
      return style(text, 33);
    },
    red(text) {
      return style(text, 31);
    }
  };
}

function parseNodeVersion(version) {
  const normalized = version.replace(/^v/, '');
  const [major = '0', minor = '0', patch = '0'] = normalized.split('.');

  return {
    major: Number.parseInt(major, 10),
    minor: Number.parseInt(minor, 10),
    patch: Number.parseInt(patch, 10)
  };
}

function isNodeVersionSupported(version) {
  if (version.major !== MIN_NODE_VERSION.major) {
    return version.major > MIN_NODE_VERSION.major;
  }

  if (version.minor !== MIN_NODE_VERSION.minor) {
    return version.minor > MIN_NODE_VERSION.minor;
  }

  return version.patch >= MIN_NODE_VERSION.patch;
}

function assertSupportedNodeVersion(processVersion = process.version) {
  const currentVersion = parseNodeVersion(processVersion);

  if (!isNodeVersionSupported(currentVersion)) {
    throw new Error(
      `Node ${MIN_NODE_VERSION.major}.${MIN_NODE_VERSION.minor}.${MIN_NODE_VERSION.patch}+ is required. Current version: ${processVersion}`
    );
  }
}

function printHelp(templates, colors, defaultTemplate) {
  const supportedTemplates = templates
    .map(
      (template) =>
        `  ${template.id}${template.aliases.length > 0 ? ` (${template.aliases.join(', ')})` : ''}`
    )
    .join('\n');

  process.stdout.write(`${colors.bold('create-testkit')}

Usage:
  create-testkit
  create-testkit <target-directory>
  create-testkit <template> [target-directory]
  create-testkit --template <template> [target-directory]
  create-testkit upgrade check [target-directory]
  create-testkit upgrade apply --safe [target-directory]

Options:
  --yes          Accept all post-generate prompts
  --no-install   Skip npm install
  --no-setup     Skip template-specific setup such as Playwright browser install
  --no-test      Skip npm test
  --template     Explicitly choose a template without using positional arguments
  --with-api     Include API tests (default)
  --no-api       Skip API tests feature
  --safe         Required with upgrade apply; only updates unchanged managed files

Interactive mode:
  When run without an explicit template, the CLI shows an interactive template picker.
  Default template in non-interactive mode: ${defaultTemplate}

Supported templates:
${supportedTemplates}
`);
}

function printPrerequisiteWarnings(prerequisites, colors) {
  if (!prerequisites.npm) {
    process.stdout.write(
      `${colors.yellow('Warning:')} npm was not found. Automated install and test steps will be unavailable.\n`
    );
  }

  if (!prerequisites.npx) {
    process.stdout.write(
      `${colors.yellow('Warning:')} npx was not found. Template setup steps that depend on npx will be unavailable.\n`
    );
  }

  if (!prerequisites.docker) {
    process.stdout.write(
      `${colors.yellow('Warning:')} docker was not found. Docker-based template flows will not run until Docker is installed.\n`
    );
  }

  if (!prerequisites.git) {
    process.stdout.write(
      `${colors.yellow('Warning:')} git was not found. The generated project cannot be initialized as a repository automatically.\n`
    );
  }

  if (
    !prerequisites.npm ||
    !prerequisites.npx ||
    !prerequisites.docker ||
    !prerequisites.git
  ) {
    process.stdout.write('\n');
  }
}

function printPlaywrightInstallRecovery(targetDirectory, colors) {
  process.stdout.write(`
${colors.yellow('Playwright browser installation did not complete.')}

Common cause:
  Missing OS packages required to run Playwright browsers.

Recommended next steps:
  cd ${targetDirectory}
  sudo npx playwright install-deps
  npx playwright install

If you already know the missing package name, install it with your system package manager and then rerun:
  npx playwright install

The template was generated successfully. You can complete browser setup later.

`);
}

function printSuccess(
  template,
  targetDirectory,
  generatedInCurrentDirectory,
  colors
) {
  process.stdout.write(`\n${colors.green(colors.bold('Success'))}
Generated ${template.label} in ${targetDirectory}
\n`);

  if (!generatedInCurrentDirectory) {
    process.stdout.write(
      `${colors.cyan('Your shell stays in the original directory. To work in the generated project, run:')}\n  cd ${targetDirectory}\n\n`
    );
  }
}

function formatStatus(status, colors) {
  switch (status) {
    case 'completed':
      return colors.green('completed');
    case 'skipped':
      return colors.dim('skipped');
    case 'unavailable':
      return colors.yellow('unavailable');
    case 'manual-recovery':
      return colors.yellow('manual recovery required');
    default:
      return colors.dim('not run');
  }
}

function formatUpgradeStatus(status, colors) {
  switch (status) {
    case 'safe-update':
      return colors.green('safe update available');
    case 'new-file':
      return colors.green('new managed file available');
    case 'conflict':
      return colors.yellow('manual review required');
    default:
      return colors.dim('up to date');
  }
}

function printUpgradeReport(
  targetDirectory,
  metadata,
  results,
  cliPackageVersion,
  colors
) {
  const safeCount = results.filter(
    (entry) => entry.status === 'safe-update'
  ).length;
  const newCount = results.filter(
    (entry) => entry.status === 'new-file'
  ).length;
  const conflictCount = results.filter(
    (entry) => entry.status === 'conflict'
  ).length;

  process.stdout.write(`\n${colors.bold('Upgrade check')}\n`);
  process.stdout.write(`  Target: ${targetDirectory}\n`);
  process.stdout.write(`  Template: ${metadata.template}\n`);
  process.stdout.write(
    `  Current baseline version: ${metadata.templateVersion}\n`
  );
  process.stdout.write(`  CLI template version: ${cliPackageVersion}\n`);
  process.stdout.write(`  Safe updates: ${safeCount}\n`);
  process.stdout.write(`  New managed files: ${newCount}\n`);
  process.stdout.write(`  Conflicts: ${conflictCount}\n\n`);

  for (const entry of results) {
    if (entry.status === 'up-to-date') {
      continue;
    }

    process.stdout.write(
      `  ${entry.relativePath}: ${formatUpgradeStatus(entry.status, colors)}\n`
    );
  }

  if (safeCount === 0 && newCount === 0 && conflictCount === 0) {
    process.stdout.write(
      `${colors.green('Everything already matches the current managed template files.')}\n`
    );
  }

  process.stdout.write('\n');
}

function printSummary(summary, colors) {
  process.stdout.write(`\n${colors.bold('Summary')}\n`);
  process.stdout.write(`  Template: ${summary.template.id}\n`);
  process.stdout.write(`  Target: ${summary.targetDirectory}\n`);
  process.stdout.write(
    `  Git repository: ${formatStatus(summary.gitInit, colors)}\n`
  );
  process.stdout.write(
    `  Demo apps: ${summary.demoAppsManagedByTemplate ? 'bundled and auto-started in dev when using default local URLs' : 'external application required'}\n`
  );
  if (summary.localCredentials) {
    process.stdout.write(
      `  Local credentials: ${summary.localCredentials.username} / ${summary.localCredentials.password}\n`
    );
    process.stdout.write(
      `  Local credentials file: ${summary.targetDirectory}/.env\n`
    );
  }
  process.stdout.write(
    `  npm install: ${formatStatus(summary.npmInstall, colors)}\n`
  );
  if (summary.template.setup) {
    process.stdout.write(
      `  ${summary.template.setup.summaryLabel}: ${formatStatus(summary.extraSetup, colors)}\n`
    );
  }
  process.stdout.write(
    `  npm test: ${formatStatus(summary.testRun, colors)}\n`
  );
}

function printNextSteps(summary, colors) {
  const steps = [];

  if (!summary.generatedInCurrentDirectory) {
    steps.push(`cd ${summary.targetRelativePath}`);
  }

  if (summary.npmInstall !== 'completed') {
    steps.push('npm install');
  }

  if (summary.template.setup && summary.extraSetup !== 'completed') {
    steps.push(summary.template.setup.nextStep);
  }

  if (summary.testRun !== 'completed') {
    steps.push('npm test');
  }

  if (steps.length > 0) {
    process.stdout.write(`${colors.cyan('Next steps:')}\n`);
    for (const step of steps) {
      process.stdout.write(`  ${step}\n`);
    }
    process.stdout.write('\n');
  }

  if (summary.demoAppsManagedByTemplate) {
    process.stdout.write(
      `${colors.yellow(colors.bold('Demo apps included:'))} sample tests run against bundled demo apps in local ${colors.bold('dev')}. Delete or replace ${colors.bold('demo-apps/')} if you do not want them.\n`
    );
  }

  process.stdout.write(`${colors.green(colors.bold('Happy testing.'))}\n`);
}

module.exports = {
  assertSupportedNodeVersion,
  createColors,
  printHelp,
  printNextSteps,
  printPlaywrightInstallRecovery,
  printPrerequisiteWarnings,
  printSuccess,
  printSummary,
  printUpgradeReport
};
