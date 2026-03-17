#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");
const crypto = require("node:crypto");
const { spawn, spawnSync } = require("node:child_process");

const DEFAULT_TEMPLATE = "playwright-template";
const CLI_PACKAGE = require("./package.json");
const METADATA_FILENAME = ".qa-patterns.json";
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
    ".env.example",
    ".gitignore",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "eslint.config.mjs",
    "allurerc.mjs",
    "config/**",
    "scripts/**",
    ".github/**"
  ],
  "playwright-template": [
    "playwright.config.ts",
    "docker/**",
    "lint/**",
    "reporters/**",
    "utils/logger.ts",
    "utils/test-step.ts"
  ],
  "cypress-template": ["cypress.config.ts"]
};

const TEMPLATES = [
  {
    id: DEFAULT_TEMPLATE,
    aliases: ["playwright", "pw"],
    label: "Playwright Template",
    description: "TypeScript starter with page objects, fixtures, multi-environment config, reporting, linting, CI and Docker.",
    defaultPackageName: "playwright-template",
    demoAppsManagedByTemplate: true,
    setup: {
      availability: "npx",
      prompt: "Run npx playwright install now?",
      summaryLabel: "Playwright browser install",
      nextStep: "npx playwright install",
      run(targetDirectory) {
        return runCommand("npx", ["playwright", "install"], targetDirectory);
      },
      recovery(targetDirectory) {
        printPlaywrightInstallRecovery(targetDirectory);
      }
    }
  },
  {
    id: "cypress-template",
    aliases: ["cypress", "cy"],
    label: "Cypress Template",
    description: "TypeScript starter with Cypress e2e specs, custom commands, page modules, env-based config, CI, and a bundled demo app.",
    defaultPackageName: "cypress-template",
    demoAppsManagedByTemplate: true
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

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function normalizePath(value) {
  return value.split(path.sep).join("/");
}

function getTemplateDirectory(templateId) {
  return path.resolve(__dirname, "templates", templateId);
}

function pathMatchesPattern(relativePath, pattern) {
  if (pattern.endsWith("/**")) {
    const prefix = pattern.slice(0, -3);
    return relativePath === prefix || relativePath.startsWith(`${prefix}/`);
  }

  return relativePath === pattern;
}

function isManagedFile(template, relativePath) {
  const patterns = [...MANAGED_FILE_PATTERNS.common, ...(MANAGED_FILE_PATTERNS[template.id] || [])];
  return patterns.some((pattern) => pathMatchesPattern(relativePath, pattern));
}

function collectRelativeFiles(rootDirectory) {
  const results = [];

  function visit(currentDirectory) {
    const entries = fs.readdirSync(currentDirectory, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(currentDirectory, entry.name);
      const relativePath = normalizePath(path.relative(rootDirectory, absolutePath));

      if (entry.isDirectory()) {
        visit(absolutePath);
      } else {
        results.push(relativePath);
      }
    }
  }

  visit(rootDirectory);

  return results.sort();
}

function transformTemplateFile(relativePath, content, targetDirectory, template) {
  const packageName = toPackageName(targetDirectory, template);

  if (relativePath === "package.json") {
    const pkg = JSON.parse(content);
    return `${JSON.stringify({ ...pkg, name: packageName }, null, 2)}\n`;
  }

  if (relativePath === "package-lock.json") {
    const lock = JSON.parse(content);
    return `${JSON.stringify(
      {
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
      },
      null,
      2
    )}\n`;
  }

  return content;
}

function renderTemplateFile(template, relativePath, targetDirectory) {
  if (relativePath === ".gitignore") {
    const gitignorePath = path.join(getTemplateDirectory(template.id), ".gitignore");
    const gitignoreContent = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, "utf8") : DEFAULT_GITIGNORE;
    return transformTemplateFile(relativePath, gitignoreContent, targetDirectory, template);
  }

  const sourcePath = path.join(getTemplateDirectory(template.id), relativePath);
  const content = fs.readFileSync(sourcePath, "utf8");
  return transformTemplateFile(relativePath, content, targetDirectory, template);
}

function getManagedRelativePaths(template) {
  const templateDirectory = getTemplateDirectory(template.id);
  const templateFiles = collectRelativeFiles(templateDirectory).filter((relativePath) => isManagedFile(template, relativePath));
  const managedFiles = new Set(templateFiles);
  managedFiles.add(".gitignore");
  managedFiles.delete(METADATA_FILENAME);
  return [...managedFiles].sort();
}

function getMetadataPath(targetDirectory) {
  return path.join(targetDirectory, METADATA_FILENAME);
}

function buildProjectMetadata(template, targetDirectory) {
  const managedFiles = {};

  for (const relativePath of getManagedRelativePaths(template)) {
    const absolutePath = path.join(targetDirectory, relativePath);
    if (!fs.existsSync(absolutePath)) {
      continue;
    }

    managedFiles[relativePath] = {
      baselineHash: sha256(fs.readFileSync(absolutePath, "utf8"))
    };
  }

  return {
    schemaVersion: 1,
    template: template.id,
    templateVersion: CLI_PACKAGE.version,
    packageName: toPackageName(targetDirectory, template),
    generatedAt: new Date().toISOString(),
    managedFiles
  };
}

function writeProjectMetadata(template, targetDirectory, existingMetadata) {
  const nextMetadata = buildProjectMetadata(template, targetDirectory);

  if (existingMetadata) {
    nextMetadata.generatedAt = existingMetadata.generatedAt || nextMetadata.generatedAt;
    nextMetadata.templateVersion = existingMetadata.templateVersion || nextMetadata.templateVersion;
  }

  fs.writeFileSync(getMetadataPath(targetDirectory), `${JSON.stringify(nextMetadata, null, 2)}\n`, "utf8");
  return nextMetadata;
}

function readProjectMetadata(targetDirectory) {
  const metadataPath = getMetadataPath(targetDirectory);

  if (!fs.existsSync(metadataPath)) {
    throw new Error(`No ${METADATA_FILENAME} file found in ${targetDirectory}.`);
  }

  return JSON.parse(fs.readFileSync(metadataPath, "utf8"));
}

function detectTemplateFromProject(targetDirectory) {
  const metadataPath = getMetadataPath(targetDirectory);
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    return metadata.template;
  }

  if (fs.existsSync(path.join(targetDirectory, "playwright.config.ts"))) {
    return "playwright-template";
  }

  if (fs.existsSync(path.join(targetDirectory, "cypress.config.ts"))) {
    return "cypress-template";
  }

  throw new Error(`Could not detect the template used for ${targetDirectory}.`);
}

function analyzeUpgrade(template, targetDirectory, metadata) {
  const managedPaths = getManagedRelativePaths(template);
  const results = [];

  for (const relativePath of managedPaths) {
    const absolutePath = path.join(targetDirectory, relativePath);
    const latestContent = renderTemplateFile(template, relativePath, targetDirectory);
    const latestHash = sha256(latestContent);
    const baselineHash = metadata.managedFiles?.[relativePath]?.baselineHash || null;
    const currentExists = fs.existsSync(absolutePath);
    const currentHash = currentExists ? sha256(fs.readFileSync(absolutePath, "utf8")) : null;

    let status = "up-to-date";

    if (!baselineHash) {
      if (!currentExists) {
        status = "new-file";
      } else if (currentHash === latestHash) {
        status = "new-file";
      } else {
        status = "conflict";
      }
    } else if (!currentExists) {
      status = "conflict";
    } else if (currentHash === latestHash) {
      status = "up-to-date";
    } else if (currentHash === baselineHash) {
      status = "safe-update";
    } else {
      status = "conflict";
    }

    results.push({
      relativePath,
      status,
      latestContent,
      latestHash,
      currentHash,
      baselineHash,
      currentExists
    });
  }

  return results;
}

function printHelp() {
  const supportedTemplates = TEMPLATES.map((template) => `  ${template.id}${template.aliases.length > 0 ? ` (${template.aliases.join(", ")})` : ""}`).join("\n");

  process.stdout.write(`${colors.bold("create-qa-patterns")}

Usage:
  create-qa-patterns
  create-qa-patterns <target-directory>
  create-qa-patterns <template> [target-directory]
  create-qa-patterns --template <template> [target-directory]
  create-qa-patterns upgrade check [target-directory]
  create-qa-patterns upgrade apply --safe [target-directory]

Options:
  --yes          Accept all post-generate prompts
  --no-install   Skip npm install
  --no-setup     Skip template-specific setup such as Playwright browser install
  --no-test      Skip npm test
  --template     Explicitly choose a template without using positional arguments
  --safe         Required with upgrade apply; only updates unchanged managed files

Interactive mode:
  When run without an explicit template, the CLI shows an interactive template picker.

Supported templates:
${supportedTemplates}
`);
}

function parseCliOptions(args) {
  const options = {
    yes: false,
    noInstall: false,
    noSetup: false,
    noTest: false,
    safe: false,
    templateName: null,
    positionalArgs: []
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    switch (arg) {
      case "--yes":
        options.yes = true;
        break;
      case "--no-install":
        options.noInstall = true;
        break;
      case "--no-setup":
        options.noSetup = true;
        break;
      case "--no-test":
        options.noTest = true;
        break;
      case "--safe":
        options.safe = true;
        break;
      case "--template": {
        const templateValue = args[index + 1];
        if (!templateValue) {
          throw new Error("Missing value for --template.");
        }

        const templateName = resolveTemplate(templateValue);
        if (!templateName) {
          throw new Error(
            `Unsupported template "${templateValue}". Supported templates: ${TEMPLATES.map((template) => template.id).join(", ")}.`
          );
        }

        options.templateName = templateName;
        index += 1;
        break;
      }
      default:
        options.positionalArgs.push(arg);
        break;
    }
  }

  return options;
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
    docker: commandExists("docker"),
    git: commandExists("git")
  };
}

function printPrerequisiteWarnings(prerequisites) {
  if (!prerequisites.npm) {
    process.stdout.write(`${colors.yellow("Warning:")} npm was not found. Automated install and test steps will be unavailable.\n`);
  }

  if (!prerequisites.npx) {
    process.stdout.write(`${colors.yellow("Warning:")} npx was not found. Template setup steps that depend on npx will be unavailable.\n`);
  }

  if (!prerequisites.docker) {
    process.stdout.write(`${colors.yellow("Warning:")} docker was not found. Docker-based template flows will not run until Docker is installed.\n`);
  }

  if (!prerequisites.git) {
    process.stdout.write(`${colors.yellow("Warning:")} git was not found. The generated project cannot be initialized as a repository automatically.\n`);
  }

  if (!prerequisites.npm || !prerequisites.npx || !prerequisites.docker || !prerequisites.git) {
    process.stdout.write("\n");
  }
}

function createLineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function createSummary(template, targetDirectory, generatedInCurrentDirectory) {
  return {
    template,
    targetDirectory,
    generatedInCurrentDirectory,
    demoAppsManagedByTemplate: Boolean(template.demoAppsManagedByTemplate),
    gitInit: "not-run",
    npmInstall: "not-run",
    extraSetup: template.setup ? "not-run" : null,
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

function resolveNonInteractiveArgs(args, options = {}) {
  if (options.templateName) {
    if (args.length > 1) {
      throw new Error("Too many arguments. Run `create-qa-patterns --help` for usage.");
    }

    if (args.length === 0) {
      return {
        templateName: options.templateName,
        targetDirectory: process.cwd(),
        generatedInCurrentDirectory: true
      };
    }

    return {
      templateName: options.templateName,
      targetDirectory: path.resolve(process.cwd(), args[0]),
      generatedInCurrentDirectory: false
    };
  }

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
      throw new Error(
        `Unsupported template "${args[0]}". Supported templates: ${TEMPLATES.map((template) => template.id).join(", ")}.`
      );
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

function toPackageName(targetDirectory, template) {
  const baseName = path.basename(targetDirectory).toLowerCase();
  const normalized = baseName
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return normalized || template.defaultPackageName || "qa-patterns-template";
}

function updateJsonFile(filePath, update) {
  const current = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const next = update(current);
  fs.writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
}

function customizeProject(targetDirectory, template) {
  const packageJsonPath = path.join(targetDirectory, "package.json");
  const packageLockPath = path.join(targetDirectory, "package-lock.json");
  const gitignorePath = path.join(targetDirectory, ".gitignore");

  if (fs.existsSync(packageJsonPath)) {
    fs.writeFileSync(
      packageJsonPath,
      transformTemplateFile("package.json", fs.readFileSync(packageJsonPath, "utf8"), targetDirectory, template),
      "utf8"
    );
  }

  if (fs.existsSync(packageLockPath)) {
    fs.writeFileSync(
      packageLockPath,
      transformTemplateFile("package-lock.json", fs.readFileSync(packageLockPath, "utf8"), targetDirectory, template),
      "utf8"
    );
  }

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, DEFAULT_GITIGNORE, "utf8");
  }
}

function initializeGitRepository(targetDirectory) {
  if (fs.existsSync(path.join(targetDirectory, ".git"))) {
    return;
  }

  const result = spawnSync(getCommandName("git"), ["init"], {
    cwd: targetDirectory,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || "git init failed.");
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

async function scaffoldProject(template, targetDirectory, prerequisites) {
  const templateName = template.id;
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

  customizeProject(targetDirectory, template);
  renderProgress(3, steps.length, steps[2]);
  await sleep(80);

  if (prerequisites.git) {
    initializeGitRepository(targetDirectory);
  }

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

function printSuccess(template, targetDirectory, generatedInCurrentDirectory) {
  process.stdout.write(`\n${colors.green(colors.bold("Success"))}
Generated ${template ? template.label : template.id} in ${targetDirectory}
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

  if (summary.template.setup && summary.extraSetup !== "completed") {
    steps.push(summary.template.setup.nextStep);
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

function formatUpgradeStatus(status) {
  switch (status) {
    case "safe-update":
      return colors.green("safe update available");
    case "new-file":
      return colors.green("new managed file available");
    case "conflict":
      return colors.yellow("manual review required");
    default:
      return colors.dim("up to date");
  }
}

function printUpgradeReport(targetDirectory, metadata, results) {
  const safeCount = results.filter((entry) => entry.status === "safe-update").length;
  const newCount = results.filter((entry) => entry.status === "new-file").length;
  const conflictCount = results.filter((entry) => entry.status === "conflict").length;

  process.stdout.write(`\n${colors.bold("Upgrade check")}\n`);
  process.stdout.write(`  Target: ${targetDirectory}\n`);
  process.stdout.write(`  Template: ${metadata.template}\n`);
  process.stdout.write(`  Current baseline version: ${metadata.templateVersion}\n`);
  process.stdout.write(`  CLI template version: ${CLI_PACKAGE.version}\n`);
  process.stdout.write(`  Safe updates: ${safeCount}\n`);
  process.stdout.write(`  New managed files: ${newCount}\n`);
  process.stdout.write(`  Conflicts: ${conflictCount}\n\n`);

  for (const entry of results) {
    if (entry.status === "up-to-date") {
      continue;
    }

    process.stdout.write(`  ${entry.relativePath}: ${formatUpgradeStatus(entry.status)}\n`);
  }

  if (safeCount === 0 && newCount === 0 && conflictCount === 0) {
    process.stdout.write(`${colors.green("Everything already matches the current managed template files.")}\n`);
  }

  process.stdout.write("\n");
}

function applySafeUpdates(targetDirectory, metadata, results) {
  const nextMetadata = {
    ...metadata,
    managedFiles: {
      ...metadata.managedFiles
    }
  };

  let appliedCount = 0;

  for (const entry of results) {
    if (!["safe-update", "new-file"].includes(entry.status)) {
      continue;
    }

    const absolutePath = path.join(targetDirectory, entry.relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, entry.latestContent, "utf8");
    nextMetadata.managedFiles[entry.relativePath] = {
      baselineHash: entry.latestHash
    };
    appliedCount += 1;
  }

  const remainingConflicts = results.filter((entry) => entry.status === "conflict").length;
  if (remainingConflicts === 0) {
    nextMetadata.templateVersion = CLI_PACKAGE.version;
  }

  fs.writeFileSync(getMetadataPath(targetDirectory), `${JSON.stringify(nextMetadata, null, 2)}\n`, "utf8");

  process.stdout.write(`\n${colors.bold("Upgrade apply")}\n`);
  process.stdout.write(`  Applied safe updates: ${appliedCount}\n`);
  process.stdout.write(`  Remaining conflicts: ${remainingConflicts}\n`);
  process.stdout.write("\n");
}

function printSummary(summary) {
  process.stdout.write(`\n${colors.bold("Summary")}\n`);
  process.stdout.write(`  Template: ${summary.template.id}\n`);
  process.stdout.write(`  Target: ${summary.targetDirectory}\n`);
  process.stdout.write(`  Git repository: ${formatStatus(summary.gitInit)}\n`);
  process.stdout.write(
    `  Demo apps: ${summary.demoAppsManagedByTemplate ? "bundled and auto-started in dev when using default local URLs" : "external application required"}\n`
  );
  process.stdout.write(`  npm install: ${formatStatus(summary.npmInstall)}\n`);
  if (summary.template.setup) {
    process.stdout.write(`  ${summary.template.setup.summaryLabel}: ${formatStatus(summary.extraSetup)}\n`);
  }
  process.stdout.write(`  npm test: ${formatStatus(summary.testRun)}\n`);
}

async function runPostGenerateActions(template, targetDirectory, summary) {
  const prerequisites = collectPrerequisites();
  const options = summary.options;
  const canPrompt = process.stdin.isTTY && process.stdout.isTTY;

  if (prerequisites.npm) {
    if (options.noInstall) {
      summary.npmInstall = "skipped";
    } else {
      const shouldInstallDependencies = options.yes ? true : canPrompt ? await askYesNo("Run npm install now?", true) : false;

      if (shouldInstallDependencies) {
        await runCommand("npm", ["install"], targetDirectory);
        summary.npmInstall = "completed";
      } else {
        summary.npmInstall = canPrompt ? "skipped" : "not-run";
      }
    }
  } else {
    process.stdout.write(`${colors.yellow("Skipping")} npm install prompt because npm is not available.\n`);
    summary.npmInstall = "unavailable";
  }

  if (template.setup) {
    if (options.noSetup) {
      summary.extraSetup = "skipped";
    } else if (prerequisites[template.setup.availability]) {
      const shouldRunExtraSetup = options.yes ? true : canPrompt ? await askYesNo(template.setup.prompt, true) : false;

      if (shouldRunExtraSetup) {
        try {
          await template.setup.run(targetDirectory);
          summary.extraSetup = "completed";
        } catch (error) {
          summary.extraSetup = "manual-recovery";
          if (typeof template.setup.recovery === "function") {
            template.setup.recovery(targetDirectory);
          }

          const shouldContinue = await askYesNo("Continue without completing setup?", true);

          if (!shouldContinue) {
            throw error;
          }
        }
      } else {
        summary.extraSetup = canPrompt ? "skipped" : "not-run";
      }
    } else {
      process.stdout.write(
        `${colors.yellow("Skipping")} ${template.setup.summaryLabel.toLowerCase()} prompt because ${template.setup.availability} is not available.\n`
      );
      summary.extraSetup = "unavailable";
    }
  }

  if (prerequisites.npm) {
    if (options.noTest) {
      summary.testRun = "skipped";
    } else {
      const shouldRunTests = options.yes ? true : canPrompt ? await askYesNo("Run npm test now?", false) : false;

      if (shouldRunTests) {
        await runCommand("npm", ["test"], targetDirectory);
        summary.testRun = "completed";
      } else {
        summary.testRun = canPrompt ? "skipped" : "not-run";
      }
    }
  } else {
    process.stdout.write(`${colors.yellow("Skipping")} npm test prompt because npm is not available.\n`);
    summary.testRun = "unavailable";
  }
}

function resolveUpgradeTarget(args) {
  if (args.length > 1) {
    throw new Error("Too many arguments for upgrade. Use `create-qa-patterns upgrade check [target-directory]`.");
  }

  return path.resolve(process.cwd(), args[0] || ".");
}

function runUpgradeCommand(rawArgs) {
  const [subcommand = "check", ...rest] = rawArgs;
  const options = parseCliOptions(rest);
  const targetDirectory = resolveUpgradeTarget(options.positionalArgs);
  const metadata = readProjectMetadata(targetDirectory);
  const templateId = metadata.template || detectTemplateFromProject(targetDirectory);
  const template = getTemplate(templateId);

  if (!template) {
    throw new Error(`Unsupported template "${templateId}".`);
  }

  const results = analyzeUpgrade(template, targetDirectory, metadata);

  if (subcommand === "check" || subcommand === "report") {
    printUpgradeReport(targetDirectory, metadata, results);
    return;
  }

  if (subcommand === "apply") {
    if (!options.safe) {
      throw new Error("Upgrade apply requires --safe. Only safe managed-file updates are supported.");
    }

    printUpgradeReport(targetDirectory, metadata, results);
    applySafeUpdates(targetDirectory, metadata, results);
    return;
  }

  throw new Error(`Unsupported upgrade command "${subcommand}". Use check, report, or apply --safe.`);
}

async function main() {
  const rawArgs = process.argv.slice(2);

  assertSupportedNodeVersion();

  if (rawArgs[0] === "upgrade") {
    runUpgradeCommand(rawArgs.slice(1));
    return;
  }

  if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
    printHelp();
    return;
  }

  const options = parseCliOptions(rawArgs);
  const args = options.positionalArgs;
  const { templateName, targetDirectory, generatedInCurrentDirectory } = options.templateName
    ? resolveNonInteractiveArgs(args, options)
    : await resolveScaffoldArgs(args);
  const template = getTemplate(templateName);

  if (!template) {
    throw new Error(`Unsupported template "${templateName}".`);
  }

  const prerequisites = collectPrerequisites();
  const summary = createSummary(template, targetDirectory, generatedInCurrentDirectory);
  summary.options = options;
  printPrerequisiteWarnings(prerequisites);
  await scaffoldProject(template, targetDirectory, prerequisites);
  writeProjectMetadata(template, targetDirectory);
  summary.gitInit = prerequisites.git ? "completed" : "unavailable";
  printSuccess(template, targetDirectory, generatedInCurrentDirectory);
  await runPostGenerateActions(template, targetDirectory, summary);
  writeProjectMetadata(template, targetDirectory, readProjectMetadata(targetDirectory));
  printSummary(summary);
  printNextSteps(summary);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
