import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();

function runCommand(command, args) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

function writeOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }

  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`, "utf8");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(repoRoot, filePath), "utf8"));
}

function normalizeVersion(range) {
  return String(range).trim().replace(/^[~^]/, "");
}

function getPlaywrightVersionFromTemplate() {
  const packageJson = readJson("templates/playwright-template/package.json");
  return normalizeVersion(packageJson.devDependencies["@playwright/test"]);
}

function getLatestPlaywrightVersion() {
  const result = runCommand("npm", ["view", "@playwright/test", "version", "--json"]);

  if (result.status !== 0) {
    throw new Error(result.stderr || "Unable to resolve latest @playwright/test version.");
  }

  return JSON.parse(result.stdout.trim());
}

function getAuditSummary() {
  const result = runCommand("npm", ["audit", "--json"]);
  const raw = result.stdout.trim();

  if (!raw) {
    return {
      total: 0,
      info: 0,
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0
    };
  }

  const audit = JSON.parse(raw);
  const vulnerabilities = audit.metadata?.vulnerabilities ?? {};

  return {
    total:
      Number(vulnerabilities.info ?? 0) +
      Number(vulnerabilities.low ?? 0) +
      Number(vulnerabilities.moderate ?? 0) +
      Number(vulnerabilities.high ?? 0) +
      Number(vulnerabilities.critical ?? 0),
    info: Number(vulnerabilities.info ?? 0),
    low: Number(vulnerabilities.low ?? 0),
    moderate: Number(vulnerabilities.moderate ?? 0),
    high: Number(vulnerabilities.high ?? 0),
    critical: Number(vulnerabilities.critical ?? 0)
  };
}

const currentPlaywrightVersion = getPlaywrightVersionFromTemplate();
const latestPlaywrightVersion = getLatestPlaywrightVersion();
const vulnerabilities = getAuditSummary();
const updateAvailable = currentPlaywrightVersion !== latestPlaywrightVersion;
const shouldNotify = updateAvailable || vulnerabilities.total > 0;

const report = {
  generatedAt: new Date().toISOString(),
  playwright: {
    current: currentPlaywrightVersion,
    latest: latestPlaywrightVersion,
    updateAvailable
  },
  vulnerabilities,
  shouldNotify
};

writeOutput("playwright_current_version", currentPlaywrightVersion);
writeOutput("playwright_latest_version", latestPlaywrightVersion);
writeOutput("playwright_update_available", String(updateAvailable));
writeOutput("vulnerabilities_total", String(vulnerabilities.total));
writeOutput("vulnerabilities_info", String(vulnerabilities.info));
writeOutput("vulnerabilities_low", String(vulnerabilities.low));
writeOutput("vulnerabilities_moderate", String(vulnerabilities.moderate));
writeOutput("vulnerabilities_high", String(vulnerabilities.high));
writeOutput("vulnerabilities_critical", String(vulnerabilities.critical));
writeOutput("should_notify", String(shouldNotify));

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
