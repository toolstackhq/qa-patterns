// Builds a local Allure report from raw test results after a test run completes.
import { AllureReport, readConfig } from "@allurereport/core";
import { readdir, rm, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import process from "node:process";

const cwd = process.cwd();
const resultsDir = resolve(cwd, "allure-results");
const outputDir = resolve(cwd, "reports/allure");

const collectResultFiles = async () => {
  const entries = (await readdir(resultsDir)).sort();
  const files = [];

  for (const entry of entries) {
    const filePath = join(resultsDir, entry);
    const entryStat = await stat(filePath);

    if (entryStat.isFile()) {
      files.push(filePath);
    }
  }

  return files;
};

const generateReport = async () => {
  try {
    await stat(resultsDir);
  } catch {
    process.stdout.write("Skipping Allure report generation because allure-results does not exist.\n");
    return;
  }

  const files = await collectResultFiles();

  if (files.length === 0) {
    process.stdout.write("Skipping Allure report generation because no result files were found.\n");
    return;
  }

  await rm(outputDir, { force: true, recursive: true });

  const config = await readConfig(cwd, "allurerc.mjs", { output: outputDir });
  const report = new AllureReport(config);

  await report.start();

  for (const file of files) {
    await report.readFile(file);
  }

  await report.done();

  process.stdout.write("Allure report generated at reports/allure/index.html\n");
};

generateReport().catch((error) => {
  if (error instanceof Error) {
    process.stderr.write(`${error.message}\n`);
  } else {
    process.stderr.write(`${String(error)}\n`);
  }

  process.exit(1);
});
