import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const outputDirectory = path.resolve(process.cwd(), ".github/ai-repair");
const changedFilesPath = path.join(outputDirectory, "changed-files.txt");
const failingLogPath = path.join(outputDirectory, "failing.log");
const promptPath = path.join(outputDirectory, "prompt.md");
const contextJsonPath = path.join(outputDirectory, "context.json");

const changedFiles = fs.existsSync(changedFilesPath)
  ? fs
      .readFileSync(changedFilesPath, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
  : [];

const failingLog = fs.existsSync(failingLogPath) ? fs.readFileSync(failingLogPath, "utf8") : "";
const truncatedLog = failingLog.slice(0, 40_000);
const validationCommands = String(process.env.VALIDATION_COMMANDS ?? "")
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const context = {
  prNumber: process.env.PR_NUMBER,
  prTitle: process.env.PR_TITLE,
  prUrl: process.env.PR_URL,
  headBranch: process.env.HEAD_BRANCH,
  baseBranch: process.env.BASE_BRANCH,
  workflowRunId: process.env.WORKFLOW_RUN_ID,
  workflowRunUrl: process.env.WORKFLOW_RUN_URL,
  validationCommands,
  changedFiles
};

const prompt = `You are repairing a failing dependency update PR.

Rules:
- Make the minimum changes needed to restore compatibility.
- Only modify files required to fix the failure.
- Do not disable tests, weaken lint rules, or reduce validation scope.
- Do not change release or publish workflows.
- Keep dependency changes scoped to the update PR.
- If you touch files under templates/playwright-template, keep the scaffold copy in tools/create-qa-patterns/templates/playwright-template aligned.

PR:
- Number: ${context.prNumber}
- Title: ${context.prTitle}
- URL: ${context.prUrl}
- Head branch: ${context.headBranch}
- Base branch: ${context.baseBranch}

Failed workflow run:
- Run ID: ${context.workflowRunId}
- URL: ${context.workflowRunUrl}

Changed files in the dependency PR:
${changedFiles.length > 0 ? changedFiles.map((file) => `- ${file}`).join("\n") : "- none found"}

Validation commands you must leave passing:
${validationCommands.map((command) => `- ${command}`).join("\n")}

Failed CI log excerpt:
\`\`\`
${truncatedLog}
\`\`\`
`;

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(contextJsonPath, `${JSON.stringify(context, null, 2)}\n`, "utf8");
fs.writeFileSync(promptPath, prompt, "utf8");
