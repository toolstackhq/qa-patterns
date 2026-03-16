#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_TEMPLATE = "playwright-template";
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
const TEMPLATE_ALIASES = new Map([
  ["playwright", DEFAULT_TEMPLATE],
  ["pw", DEFAULT_TEMPLATE],
  [DEFAULT_TEMPLATE, DEFAULT_TEMPLATE]
]);

function printHelp() {
  process.stdout.write(`create-qa-patterns

Usage:
  create-qa-patterns
  create-qa-patterns <target-directory>
  create-qa-patterns <template> [target-directory]

Supported templates:
  playwright-template
  playwright
  pw
`);
}

function resolveTemplate(value) {
  return TEMPLATE_ALIASES.get(value);
}

function resolveScaffoldArgs(args) {
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

function scaffoldProject(templateName, targetDirectory) {
  const templateDirectory = path.resolve(__dirname, "templates", templateName);

  if (!fs.existsSync(templateDirectory)) {
    throw new Error(`Template files are missing for "${templateName}".`);
  }

  ensureScaffoldTarget(targetDirectory);
  fs.cpSync(templateDirectory, targetDirectory, { recursive: true });
  customizeProject(targetDirectory);
}

function printNextSteps(targetDirectory, generatedInCurrentDirectory) {
  process.stdout.write(`Generated ${DEFAULT_TEMPLATE} in ${targetDirectory}

Next steps:
`);

  if (!generatedInCurrentDirectory) {
    process.stdout.write(`  cd ${path.relative(process.cwd(), targetDirectory) || "."}
`);
  }

  process.stdout.write(`  npm install
  npx playwright install
  npm test
`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const { templateName, targetDirectory, generatedInCurrentDirectory } = resolveScaffoldArgs(args);
  scaffoldProject(templateName, targetDirectory);
  printNextSteps(targetDirectory, generatedInCurrentDirectory);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
