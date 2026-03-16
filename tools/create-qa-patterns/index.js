#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");
const { spawn, spawnSync } = require("node:child_process");

const DEFAULT_TEMPLATE = "playwright-template";
const MIN_NODE_VERSION = {
  major: 18,
  minor: 18,
  patch: 0
};
const COLOR_ENABLED = Boolean(process.stdout.isTTY) && !("NO_COLOR" in process.env);
const DEFAULT_GITIGNORE = `node_modules/

.env
.env.*
!.env.example

reports/
allure-results/
allure-report/
test-results/
playwright-report/
`;

const TEMPLATES = [
  {
    id: DEFAULT_TEMPLATE,
    aliases: ["playwright", "pw"],
    label: "Playwright Template",
    description: "TypeScript starter with page objects, fixtures, multi-environment config, reporting, linting, CI and Docker."
  }
];

const TEMPLATE_ALIASES = new Map(
  TEMPLATES.flatMap((template) => [
    [template.id, template.id],
    ...template.aliases.map((alias) => [alias, template.id])
  ])
);

function style(text, ...codes) {
  if (!COLOR_ENABLED) {
    return text;
  }

  return `\u001b[${codes.join(";")}m${text}\u001b[0m`;
}

const colors = {
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

function printHelp() {
  process.stdout.write(`${colors.bold("create-qa-patterns")}

Usage:
  create-qa-patterns
  create-qa-patterns <target-directory>
  create-qa-patterns <template> [target-directory]

Interactive mode:
  When run without an explicit template, the CLI shows an interactive template picker.

Supported templates:
  playwright-template
  playwright
  pw
`);
}

function parseNodeVersion(version) {
  const normalized = version.replace(/^v/, "");
  const [major = "0", minor = "0", patch = "0"] = normalized.split(".");

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

function assertSupportedNodeVersion() {
  const currentVersion = parseNodeVersion(process.version);

  if (!isNodeVersionSupported(currentVersion)) {
    throw new Error(
      `Node ${MIN_NODE_VERSION.major}.${MIN_NODE_VERSION.minor}.${MIN_NODE_VERSION.patch}+ is required. Current version: ${process.version}`
    );
  }
}

function resolveTemplate(value) {
  return TEMPLATE_ALIASES.get(value);
}

function getTemplate(templateId) {
  return TEMPLATES.find((template) => template.id === templateId);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function commandExists(command) {
  const result = spawnSync(getCommandName(command), ["--version"], {
    stdio: "ignore"
  });

  return !result.error && result.status === 0;
}

function collectPrerequisites() {
  return {
    npm: commandExists("npm"),
    npx: commandExists("npx"),
    docker: commandExists("docker")
  };
}

function printPrerequisiteWarnings(prerequisites) {
  if (!prerequisites.npm) {
    process.stdout.write(`${colors.yellow("Warning:")} npm was not found. Automated install and test steps will be unavailable.\n`);
  }

  if (!prerequisites.npx) {
    process.stdout.write(`${colors.yellow("Warning:")} npx was not found. Playwright browser installation will be unavailable.\n`);
  }

  if (!prerequisites.docker) {
    process.stdout.write(`${colors.yellow("Warning:")} docker was not found. Docker-based template flows will not run until Docker is installed.\n`);
  }

  if (!prerequisites.npm || !prerequisites.npx || !prerequisites.docker) {
    process.stdout.write("\n");
  }
}

function createLineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function createSummary(templateName, targetDirectory, generatedInCurrentDirectory, demoAppsManagedByTemplate) {
  return {
    templateName,
    targetDirectory,
    generatedInCurrentDirectory,
    demoAppsManagedByTemplate,
    npmInstall: "not-run",
    playwrightInstall: "not-run",
    testRun: "not-run"
  };
}

function askQuestion(prompt) {
  const lineInterface = createLineInterface();

  return new Promise((resolve) => {
    lineInterface.question(prompt, (answer) => {
      lineInterface.close();
      resolve(answer.trim());
    });
  });
}

async function askYesNo(prompt, defaultValue = true) {
  const suffix = defaultValue ? " [Y/n] " : " [y/N] ";

  while (true) {
    const answer = (await askQuestion(`${prompt}${suffix}`)).toLowerCase();

    if (!answer) {
      return defaultValue;
    }

    if (["y", "yes"].includes(answer)) {
      return true;
    }

    if (["n", "no"].includes(answer)) {
      return false;
    }

    process.stdout.write("Please answer yes or no.\n");
  }
}

async function selectTemplateInteractively() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return DEFAULT_TEMPLATE;
  }

  readline.emitKeypressEvents(process.stdin);

  if (typeof process.stdin.setRawMode === "function") {
    process.stdin.setRawMode(true);
  }

  let selectedIndex = 0;
  let renderedLines = 0;

  const render = () => {
    if (renderedLines > 0) {
      readline.moveCursor(process.stdout, 0, -renderedLines);
      readline.clearScreenDown(process.stdout);
    }

    const lines = [
      "Select a template",
      "Use ↑/↓ to choose and press Enter to continue.",
      ""
    ];

    for (let index = 0; index < TEMPLATES.length; index += 1) {
      const template = TEMPLATES[index];
      const marker = index === selectedIndex ? ">" : " ";
      lines.push(`${marker} ${template.label}`);
      lines.push(`  ${template.description}`);
      lines.push("");
    }

    renderedLines = lines.length;
    process.stdout.write(`${lines.join("\n")}\n`);
  };

  render();

  return new Promise((resolve) => {
    const handleKeypress = (_, key) => {
      if (!key) {
        return;
      }

      if (key.name === "up") {
        selectedIndex = (selectedIndex - 1 + TEMPLATES.length) % TEMPLATES.length;
        render();
        return;
      }

      if (key.name === "down") {
        selectedIndex = (selectedIndex + 1) % TEMPLATES.length;
        render();
        return;
      }

      if (key.name === "return") {
        process.stdin.off("keypress", handleKeypress);
        if (typeof process.stdin.setRawMode === "function") {
          process.stdin.setRawMode(false);
        }
        readline.clearScreenDown(process.stdout);
        process.stdout.write(`Selected: ${TEMPLATES[selectedIndex].label}\n\n`);
        resolve(TEMPLATES[selectedIndex].id);
        return;
      }

      if (key.ctrl && key.name === "c") {
        process.stdin.off("keypress", handleKeypress);
        if (typeof process.stdin.setRawMode === "function") {
          process.stdin.setRawMode(false);
        }
        process.stdout.write("\n");
        process.exit(1);
      }
    };

    process.stdin.on("keypress", handleKeypress);
  });
}

function resolveNonInteractiveArgs(args) {
  if (args.length === 0) {
    return {
      templateName: DEFAULT_TEMPLATE,
      targetDirectory: process.cwd(),
      generatedInCurrentDirectory: true
    };
  }

  if (args.length === 1) {
    const templateName = resolveTemplate(args[0]);

    if (templateName) {
      return {
        templateName,
        targetDirectory: process.cwd(),
        generatedInCurrentDirectory: true
      };
    }

    return {
      templateName: DEFAULT_TEMPLATE,
      targetDirectory: path.resolve(process.cwd(), args[0]),
      generatedInCurrentDirectory: false
    };
  }

  if (args.length === 2) {
    const templateName = resolveTemplate(args[0]);

    if (!templateName) {
      throw new Error(`Unsupported template "${args[0]}". Use "playwright-template".`);
    }

    return {
      templateName,
      targetDirectory: path.resolve(process.cwd(), args[1]),
      generatedInCurrentDirectory: false
    };
  }

  throw new Error("Too many arguments. Run `create-qa-patterns --help` for usage.");
}

async function resolveScaffoldArgs(args) {
  const explicitTemplate = args[0] && resolveTemplate(args[0]);

  if (explicitTemplate) {
    return resolveNonInteractiveArgs(args);
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return resolveNonInteractiveArgs(args);
  }

  const templateName = await selectTemplateInteractively();
  const defaultTarget = args[0] ? args[0] : ".";
  const targetAnswer = await askQuestion(`Target directory (${defaultTarget}): `);
  const targetValue = targetAnswer || defaultTarget;
  const targetDirectory = path.resolve(process.cwd(), targetValue);

  return {
    templateName,
    targetDirectory,
    generatedInCurrentDirectory: targetDirectory === process.cwd()
  };
}

function ensureScaffoldTarget(targetDirectory) {
  if (!fs.existsSync(targetDirectory)) {
    fs.mkdirSync(targetDirectory, { recursive: true });
    return;
  }

  const entries = fs
    .readdirSync(targetDirectory)
    .filter((entry) => ![".git", ".DS_Store"].includes(entry));

  if (entries.length > 0) {
    throw new Error(`Target directory is not empty: ${targetDirectory}`);
  }
}

function toPackageName(targetDirectory) {
  const baseName = path.basename(targetDirectory).toLowerCase();
  const normalized = baseName
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return normalized || "playwright-template";
}

function updateJsonFile(filePath, update) {
  const current = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const next = update(current);
  fs.writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
}

function customizeProject(targetDirectory) {
  const packageName = toPackageName(targetDirectory);
  const packageJsonPath = path.join(targetDirectory, "package.json");
  const packageLockPath = path.join(targetDirectory, "package-lock.json");
  const gitignorePath = path.join(targetDirectory, ".gitignore");

  if (fs.existsSync(packageJsonPath)) {
    updateJsonFile(packageJsonPath, (pkg) => ({
      ...pkg,
      name: packageName
    }));
  }

  if (fs.existsSync(packageLockPath)) {
    updateJsonFile(packageLockPath, (lock) => ({
      ...lock,
      name: packageName,
      packages: lock.packages
        ? {
            ...lock.packages,
            "": {
              ...lock.packages[""],
              name: packageName
            }
          }
        : lock.packages
    }));
  }

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, DEFAULT_GITIGNORE, "utf8");
  }
}

function renderProgress(completed, total, label) {
  const width = 24;
  const filled = Math.round((completed / total) * width);
  const empty = width - filled;
  const bar = `${"=".repeat(filled)}${" ".repeat(empty)}`;
  const percentage = `${Math.round((completed / total) * 100)}`.padStart(3, " ");
  process.stdout.write(`\r[${bar}] ${percentage}% ${label}`);
}

async function scaffoldProject(templateName, targetDirectory) {
  const templateDirectory = path.resolve(__dirname, "templates", templateName);

  if (!fs.existsSync(templateDirectory)) {
    throw new Error(`Template files are missing for "${templateName}".`);
  }

  const steps = [
    "Validating target directory",
    "Copying template files",
    "Customizing project files",
    "Finalizing scaffold"
  ];

  renderProgress(0, steps.length, "Preparing scaffold");
  ensureScaffoldTarget(targetDirectory);
  await sleep(60);

  renderProgress(1, steps.length, steps[0]);
  await sleep(80);

  fs.cpSync(templateDirectory, targetDirectory, { recursive: true });
  renderProgress(2, steps.length, steps[1]);
  await sleep(80);

  customizeProject(targetDirectory);
  renderProgress(3, steps.length, steps[2]);
  await sleep(80);

  renderProgress(4, steps.length, steps[3]);
  await sleep(60);
  process.stdout.write("\n");
}

function getCommandName(base) {
  if (process.platform === "win32") {
    return `${base}.cmd`;
  }

  return base;
}

function printPlaywrightInstallRecovery(targetDirectory) {
  process.stdout.write(`
${colors.yellow("Playwright browser installation did not complete.")}

Common cause:
  Missing OS packages required to run Playwright browsers.

Recommended next steps:
  cd ${path.relative(process.cwd(), targetDirectory) || "."}
  sudo npx playwright install-deps
  npx playwright install

If you already know the missing package name, install it with your system package manager and then rerun:
  npx playwright install

The template was generated successfully. You can complete browser setup later.

`);
}

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(getCommandName(command), args, {
      cwd,
      stdio: "inherit"
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });

    child.on("error", reject);
  });
}

function printSuccess(templateName, targetDirectory, generatedInCurrentDirectory) {
  const template = getTemplate(templateName);

  process.stdout.write(`\n${colors.green(colors.bold("Success"))}
Generated ${template ? template.label : templateName} in ${targetDirectory}
\n`);

  if (!generatedInCurrentDirectory) {
    process.stdout.write(`${colors.cyan("Change directory first:")}\n  cd ${path.relative(process.cwd(), targetDirectory) || "."}\n\n`);
  }
}

function printNextSteps(summary) {
  const steps = [];

  if (!summary.generatedInCurrentDirectory) {
    steps.push(`cd ${path.relative(process.cwd(), summary.targetDirectory) || "."}`);
  }

  if (summary.npmInstall !== "completed") {
    steps.push("npm install");
  }

  if (summary.playwrightInstall !== "completed") {
    steps.push("npx playwright install");
  }

  if (summary.testRun !== "completed") {
    steps.push("npm test");
  }

  if (steps.length > 0) {
    process.stdout.write(`${colors.cyan("Next steps:")}\n`);
    for (const step of steps) {
      process.stdout.write(`  ${step}\n`);
    }
    process.stdout.write("\n");
  }

  if (summary.demoAppsManagedByTemplate) {
    process.stdout.write(
      `${colors.yellow(colors.bold("Demo apps included:"))} sample tests run against bundled demo apps in local ${colors.bold("dev")}. Delete or replace ${colors.bold("demo-apps/")} if you do not want them.\n`
    );
  }

  process.stdout.write(`${colors.green(colors.bold("Happy testing."))}\n`);
}

function formatStatus(status) {
  switch (status) {
    case "completed":
      return colors.green("completed");
    case "skipped":
      return colors.dim("skipped");
    case "unavailable":
      return colors.yellow("unavailable");
    case "manual-recovery":
      return colors.yellow("manual recovery required");
    default:
      return colors.dim("not run");
  }
}

function printSummary(summary) {
  process.stdout.write(`\n${colors.bold("Summary")}\n`);
  process.stdout.write(`  Template: ${summary.templateName}\n`);
  process.stdout.write(`  Target: ${summary.targetDirectory}\n`);
  process.stdout.write(
    `  Demo apps: ${summary.demoAppsManagedByTemplate ? "bundled and auto-started in dev when using default local URLs" : "external application required"}\n`
  );
  process.stdout.write(`  npm install: ${formatStatus(summary.npmInstall)}\n`);
  process.stdout.write(`  Playwright browser install: ${formatStatus(summary.playwrightInstall)}\n`);
  process.stdout.write(`  npm test: ${formatStatus(summary.testRun)}\n`);
}

async function runPostGenerateActions(targetDirectory, summary) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return;
  }

  const prerequisites = collectPrerequisites();

  if (prerequisites.npm) {
    const shouldInstallDependencies = await askYesNo("Run npm install now?", true);

    if (shouldInstallDependencies) {
      await runCommand("npm", ["install"], targetDirectory);
      summary.npmInstall = "completed";
    } else {
      summary.npmInstall = "skipped";
    }
  } else {
    process.stdout.write(`${colors.yellow("Skipping")} npm install prompt because npm is not available.\n`);
    summary.npmInstall = "unavailable";
  }

  if (prerequisites.npx) {
    const shouldInstallPlaywright = await askYesNo("Run npx playwright install now?", true);

    if (shouldInstallPlaywright) {
      try {
        await runCommand("npx", ["playwright", "install"], targetDirectory);
        summary.playwrightInstall = "completed";
      } catch (error) {
        summary.playwrightInstall = "manual-recovery";
        printPlaywrightInstallRecovery(targetDirectory);

        const shouldContinue = await askYesNo("Continue without completing Playwright browser install?", true);

        if (!shouldContinue) {
          throw error;
        }
      }
    } else {
      summary.playwrightInstall = "skipped";
    }
  } else {
    process.stdout.write(`${colors.yellow("Skipping")} Playwright browser install prompt because npx is not available.\n`);
    summary.playwrightInstall = "unavailable";
  }

  if (prerequisites.npm) {
    const shouldRunTests = await askYesNo("Run npm test now?", false);

    if (shouldRunTests) {
      await runCommand("npm", ["test"], targetDirectory);
      summary.testRun = "completed";
    } else {
      summary.testRun = "skipped";
    }
  } else {
    process.stdout.write(`${colors.yellow("Skipping")} npm test prompt because npm is not available.\n`);
    summary.testRun = "unavailable";
  }
}

async function main() {
  const args = process.argv.slice(2);

  assertSupportedNodeVersion();

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const { templateName, targetDirectory, generatedInCurrentDirectory } = await resolveScaffoldArgs(args);
  const summary = createSummary(templateName, targetDirectory, generatedInCurrentDirectory, true);
  printPrerequisiteWarnings(collectPrerequisites());
  await scaffoldProject(templateName, targetDirectory);
  printSuccess(templateName, targetDirectory, generatedInCurrentDirectory);
  await runPostGenerateActions(targetDirectory, summary);
  printSummary(summary);
  printNextSteps(summary);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
