#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as z from 'zod/v4';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const CLI_ENTRY = path.join(REPO_ROOT, 'tools/create-qa-patterns/index.js');
const DEBUG = process.env.QA_PATTERNS_MCP_DEBUG === 'true';

const TEMPLATE_DEFINITIONS = {
  'playwright-template': {
    id: 'playwright-template',
    label: 'Playwright Template',
    description:
      'TypeScript automation framework with page objects, fixtures, deterministic demo apps, Docker, CI, and optional Allure reporting.',
    mainCommands: [
      'npm install',
      'npx playwright install',
      'npm test',
      'npm run report:allure'
    ]
  },
  'cypress-template': {
    id: 'cypress-template',
    label: 'Cypress Template',
    description:
      'TypeScript Cypress starter with custom commands, page modules, deterministic UI demo app, CI, and optional Allure reporting.',
    mainCommands: ['npm install', 'npm test', 'npm run report:allure']
  },
  'wdio-template': {
    id: 'wdio-template',
    label: 'WebdriverIO Template',
    description:
      'TypeScript WebdriverIO starter with Mocha, page objects, deterministic UI demo app, CI, and optional Allure reporting.',
    mainCommands: ['npm install', 'npm test', 'npm run report:allure']
  }
};

function formatJson(value) {
  return JSON.stringify(value, null, 2);
}

function toToolResult(value) {
  const structuredContent =
    typeof value === 'string' ? { message: value } : value;

  return {
    content: [
      {
        type: 'text',
        text: typeof value === 'string' ? value : formatJson(value)
      }
    ],
    structuredContent
  };
}

function resolveTemplate(template) {
  const resolved = TEMPLATE_DEFINITIONS[template];
  if (!resolved) {
    throw new Error(`Unsupported template "${template}".`);
  }
  return resolved;
}

function resolveTargetDirectory(targetDirectory) {
  return path.isAbsolute(targetDirectory)
    ? path.normalize(targetDirectory)
    : path.resolve(process.cwd(), targetDirectory);
}

function detectTemplateFromProject(targetDirectory) {
  if (fs.existsSync(path.join(targetDirectory, 'playwright.config.ts'))) {
    return 'playwright-template';
  }

  if (fs.existsSync(path.join(targetDirectory, 'cypress.config.ts'))) {
    return 'cypress-template';
  }

  if (fs.existsSync(path.join(targetDirectory, 'wdio.conf.ts'))) {
    return 'wdio-template';
  }

  throw new Error(`Could not detect template type for ${targetDirectory}.`);
}

function resolveCommandName(command) {
  if (process.platform !== 'win32') {
    return command;
  }

  return ['npm', 'npx', 'node'].includes(command) ? `${command}.cmd` : command;
}

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(resolveCommandName(command), args, {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ code, stdout, stderr });
        return;
      }

      reject(
        new Error(
          [
            `${command} ${args.join(' ')} exited with code ${code}.`,
            stdout && `stdout:\n${stdout.trim()}`,
            stderr && `stderr:\n${stderr.trim()}`
          ]
            .filter(Boolean)
            .join('\n\n')
        )
      );
    });
  });
}

async function scaffoldTemplate({
  template: templateId,
  target_directory: targetDirectoryInput,
  install_dependencies: installDependencies = true,
  run_setup: runSetup = true,
  run_tests: runTests = true
}) {
  const template = resolveTemplate(templateId);
  const targetDirectory = resolveTargetDirectory(targetDirectoryInput);
  const cliArgs = [CLI_ENTRY, template.id, targetDirectory, '--yes'];

  if (!installDependencies) {
    cliArgs.push('--no-install');
  }

  if (!runSetup) {
    cliArgs.push('--no-setup');
  }

  if (!runTests) {
    cliArgs.push('--no-test');
  }

  const result = await runCommand('node', cliArgs, REPO_ROOT);
  const packageJsonPath = path.join(targetDirectory, 'package.json');
  const packageName = fs.existsSync(packageJsonPath)
    ? JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).name
    : path.basename(targetDirectory);

  return {
    success: true,
    template: template.id,
    targetDirectory,
    packageName,
    steps: {
      gitInit: 'completed',
      installDependencies: installDependencies ? 'completed' : 'skipped',
      runSetup: runSetup ? 'completed' : 'skipped',
      runTests: runTests ? 'completed' : 'skipped'
    },
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

async function validateProject({
  target_directory: targetDirectoryInput,
  template,
  install_dependencies: installDependencies = false,
  install_browsers: installBrowsers = false
}) {
  const targetDirectory = resolveTargetDirectory(targetDirectoryInput);
  const templateId = template ?? detectTemplateFromProject(targetDirectory);
  const resolvedTemplate = resolveTemplate(templateId);
  const steps = [];

  if (installDependencies) {
    steps.push({
      name: 'npm install',
      result: await runCommand('npm', ['install'], targetDirectory)
    });
  }

  if (templateId === 'playwright-template' && installBrowsers) {
    steps.push({
      name: 'npx playwright install --with-deps chromium',
      result: await runCommand(
        'npx',
        ['playwright', 'install', '--with-deps', 'chromium'],
        targetDirectory
      )
    });
  }

  steps.push({
    name: 'npm run lint',
    result: await runCommand('npm', ['run', 'lint'], targetDirectory)
  });
  steps.push({
    name: 'npm run typecheck',
    result: await runCommand('npm', ['run', 'typecheck'], targetDirectory)
  });
  steps.push({
    name: 'npm test',
    result: await runCommand('npm', ['test'], targetDirectory)
  });

  return {
    success: true,
    template: resolvedTemplate.id,
    targetDirectory,
    steps: steps.map((step) => ({
      name: step.name,
      stdout: step.result.stdout.trim(),
      stderr: step.result.stderr.trim()
    }))
  };
}

function getNextSteps({ template, target_directory: targetDirectoryInput }) {
  const resolvedTemplate = resolveTemplate(template);
  const targetDirectory = resolveTargetDirectory(targetDirectoryInput);

  return {
    template: resolvedTemplate.id,
    targetDirectory,
    nextSteps: [`cd ${targetDirectory}`, ...resolvedTemplate.mainCommands]
  };
}

const server = new McpServer({
  name: 'qa-patterns-mcp',
  version: '1.0.0'
});

if (DEBUG) {
  console.error('[qa-patterns-mcp] debug enabled');
  process.stdin.on('data', (chunk) => {
    console.error('[qa-patterns-mcp] stdin', chunk.toString().trim());
  });
  process.on('beforeExit', (code) => {
    console.error('[qa-patterns-mcp] beforeExit', code);
  });
  process.on('exit', (code) => {
    console.error('[qa-patterns-mcp] exit', code);
  });
  process.on('uncaughtException', (error) => {
    console.error('[qa-patterns-mcp] uncaughtException', error);
  });
  process.on('unhandledRejection', (error) => {
    console.error('[qa-patterns-mcp] unhandledRejection', error);
  });
  server.server.onerror = (error) => {
    console.error('[qa-patterns-mcp] protocol error', error);
  };
  server.server.oninitialized = () => {
    console.error('[qa-patterns-mcp] initialized');
  };
}

server.registerTool(
  'list_templates',
  {
    description: 'List the scaffold templates exposed by qa-patterns.',
    outputSchema: {
      templates: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          description: z.string()
        })
      )
    }
  },
  async () => {
    return toToolResult({
      templates: Object.values(TEMPLATE_DEFINITIONS).map(
        ({ id, label, description }) => ({
          id,
          label,
          description
        })
      )
    });
  }
);

server.registerTool(
  'describe_template',
  {
    description:
      'Describe one template, including its purpose and main commands.',
    inputSchema: {
      template: z.enum([
        'playwright-template',
        'cypress-template',
        'wdio-template'
      ])
    },
    outputSchema: {
      template: z.string(),
      label: z.string(),
      description: z.string(),
      mainCommands: z.array(z.string())
    }
  },
  async ({ template }) => {
    const resolvedTemplate = resolveTemplate(template);
    return toToolResult({
      template: resolvedTemplate.id,
      label: resolvedTemplate.label,
      description: resolvedTemplate.description,
      mainCommands: resolvedTemplate.mainCommands
    });
  }
);

server.registerTool(
  'scaffold_template',
  {
    description:
      'Scaffold a qa-patterns template into a target directory using the existing CLI.',
    inputSchema: {
      template: z.enum([
        'playwright-template',
        'cypress-template',
        'wdio-template'
      ]),
      target_directory: z.string(),
      install_dependencies: z.boolean().optional(),
      run_setup: z.boolean().optional(),
      run_tests: z.boolean().optional()
    },
    outputSchema: {
      success: z.boolean(),
      template: z.string(),
      targetDirectory: z.string(),
      packageName: z.string(),
      steps: z.object({
        gitInit: z.string(),
        installDependencies: z.string(),
        runSetup: z.string(),
        runTests: z.string()
      }),
      stdout: z.string(),
      stderr: z.string()
    }
  },
  async (args) => {
    return toToolResult(await scaffoldTemplate(args));
  }
);

server.registerTool(
  'validate_project',
  {
    description: "Run the generated project's validation commands.",
    inputSchema: {
      target_directory: z.string(),
      template: z
        .enum(['playwright-template', 'cypress-template', 'wdio-template'])
        .optional(),
      install_dependencies: z.boolean().optional(),
      install_browsers: z.boolean().optional()
    },
    outputSchema: {
      success: z.boolean(),
      template: z.string(),
      targetDirectory: z.string(),
      steps: z.array(
        z.object({
          name: z.string(),
          stdout: z.string(),
          stderr: z.string()
        })
      )
    }
  },
  async (args) => {
    return toToolResult(await validateProject(args));
  }
);

server.registerTool(
  'get_next_steps',
  {
    description: 'Return the next shell commands for a generated template.',
    inputSchema: {
      template: z.enum([
        'playwright-template',
        'cypress-template',
        'wdio-template'
      ]),
      target_directory: z.string()
    },
    outputSchema: {
      template: z.string(),
      targetDirectory: z.string(),
      nextSteps: z.array(z.string())
    }
  },
  async (args) => {
    return toToolResult(getNextSteps(args));
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  if (DEBUG) {
    console.error('[qa-patterns-mcp] connected');
  }
  process.stdin.resume();
}

main().catch((error) => {
  console.error('qa-patterns MCP server failed to start:', error);
  process.exit(1);
});
