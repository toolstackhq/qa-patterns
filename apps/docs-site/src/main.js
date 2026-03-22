import './styles.css';
import Termynal from './vendor/termynal.js';

const featureRows = [
  ['TypeScript template', 'YES', 'YES', 'YES'],
  ['Built-in sample app for local testing', 'YES', 'YES', 'YES'],
  ['API example', 'YES', '-', '-'],
  ['Data factory', 'YES', 'YES', 'YES'],
  ['Page objects / page modules', 'YES', 'YES', 'YES'],
  ['Multi-environment support', 'YES', 'YES', 'YES'],
  ['Secret management pattern', 'YES', 'YES', 'YES'],
  ['Linting checks', 'YES', 'YES', 'YES'],
  ['CI workflow', 'YES', 'YES', 'YES'],
  ['Optional Allure report', 'YES', 'YES', 'YES'],
  ['Docker support', 'YES', '-', '-'],
  ['MCP scaffolding support', 'YES', 'YES', 'YES'],
  ['AI-ready template guidance', 'YES', 'YES', 'YES'],
  ['Safe template upgrade checks', 'YES', 'YES', 'YES']
];

document.querySelector('#app').innerHTML = `
  <div class="shell">
    <header class="hero">
      <div class="hero__copy">
        <p class="eyebrow">qa-patterns</p>
        <h1>Scaffold QA frameworks that are ready to run.</h1>
        <p class="lede">
          <code>qa-patterns</code> is a project scaffolding tool for test automation teams. It ships ready-to-run
          <code>Playwright</code>, <code>Cypress</code>, and <code>WebdriverIO</code> templates, local demo apps, CI
          wiring, reporting, and safe template upgrade checks.
        </p>
        <div class="hero__actions">
          <a href="#cli" class="button button--primary">Use the CLI</a>
          <a href="#mcp" class="button button--ghost">Connect an MCP client</a>
          <a
            href="https://github.com/toolstackhq/qa-patterns"
            class="button button--ghost"
            target="_blank"
            rel="noreferrer"
          >
            View on GitHub
          </a>
        </div>
      </div>
      <div class="hero__panel">
        <p class="panel__label">Quick start</p>
        <pre><code>npx @toolstackhq/create-qa-patterns</code></pre>
        <p class="panel__label">Supported templates</p>
        <ul class="panel-list">
          <li><code>playwright-template</code></li>
          <li><code>cypress-template</code></li>
          <li><code>wdio-template</code></li>
        </ul>
        <p class="panel__label">Upgrade check later</p>
        <pre><code>npx -y @toolstackhq/create-qa-patterns upgrade check .</code></pre>
      </div>
    </header>

    <main>
      <section class="section grid grid--three">
        <article class="card">
          <h2>Deterministic</h2>
          <p>Every project comes from a tested template instead of an LLM guessing file trees, configs, or reporters.</p>
        </article>
        <article class="card">
          <h2>LLM-friendly</h2>
          <p>Use the CLI directly or expose the MCP server so an agent can scaffold projects with minimal token waste.</p>
        </article>
        <article class="card">
          <h2>Agent-ready</h2>
          <p>Generated templates ship with <code>AI_CONTEXT.md</code> and <code>AGENTS.md</code> so an LLM can follow the framework boundaries instead of inventing them.</p>
        </article>
        <article class="card">
          <h2>Upgradeable</h2>
          <p>Generated projects include metadata for conservative managed-file upgrade checks instead of blind overwrites.</p>
        </article>
      </section>

      <section class="section">
        <div class="section__heading">
          <p class="eyebrow">Feature matrix</p>
          <h2>What each template includes</h2>
        </div>
        <div class="table-card">
          <table class="feature-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Playwright</th>
                <th>Cypress</th>
                <th>WebdriverIO</th>
              </tr>
            </thead>
            <tbody>
              ${featureRows
                .map(
                  ([feature, playwright, cypress, wdio]) => `
                    <tr>
                      <td>${feature}</td>
                      <td><span class="status ${playwright === 'YES' ? 'status--yes' : 'status--muted'}">${playwright}</span></td>
                      <td><span class="status ${cypress === 'YES' ? 'status--yes' : 'status--muted'}">${cypress}</span></td>
                      <td><span class="status ${wdio === 'YES' ? 'status--yes' : 'status--muted'}">${wdio}</span></td>
                    </tr>
                  `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </section>

      <section id="cli" class="section">
        <div class="section__heading">
          <p class="eyebrow">CLI</p>
          <h2>Scaffold a project in one command</h2>
          <p class="note">The animated terminal below is a Termynal-style walkthrough of the full scaffold flow.</p>
        </div>
        <div class="terminal-showcase">
          <div class="terminal-card">
            <div class="terminal-card__topbar" aria-hidden="true">
              <span></span><span></span><span></span>
            </div>
            <div class="terminal-card__body" data-termynal>
              <span data-ty="input">npx @toolstackhq/create-qa-patterns</span>
              <span data-ty>? Select a template › Playwright Template</span>
              <span data-ty>? Target directory (.) › my-framework</span>
              <span data-ty>? Run npm install now? › Yes</span>
              <span data-ty>? Run npx playwright install now? › Yes</span>
              <span data-ty>? Run npm test now? › Yes</span>
              <span data-ty="progress" data-ty-progress-label="Finalizing scaffold files"></span>
              <span data-ty>Success</span>
              <span data-ty>Generated Playwright Template in /workspace/my-framework</span>
              <span data-ty>Summary</span>
              <span data-ty>  Template: playwright-template</span>
              <span data-ty>  Demo apps: bundled and auto-started in dev</span>
              <span data-ty>  npm install: completed</span>
              <span data-ty>  Playwright browser install: completed</span>
              <span data-ty>  npm test: completed</span>
              <span data-ty>Happy testing.</span>
            </div>
          </div>
          <div class="terminal-notes">
            <article class="card">
              <h3>What this demo shows</h3>
              <p>The full scaffold path: template selection, install/setup prompts, generated project summary, and the local success path a new user sees.</p>
            </article>
            <article class="card card--contrast">
              <h3>Why it matters</h3>
              <p>This keeps the CLI experience visible. It is the fastest way for a user to understand what the tool asks, what it creates, and what happens next.</p>
            </article>
          </div>
        </div>
        <div class="grid grid--two">
          <article class="code-block">
            <p class="panel__label">Interactive flow</p>
            <pre><code>npx @toolstackhq/create-qa-patterns</code></pre>
            <p class="note">Pick a template, choose a target directory, then decide whether to install deps, run setup, and run tests.</p>
          </article>
          <article class="code-block">
            <p class="panel__label">Direct template selection</p>
            <pre><code>npx @toolstackhq/create-qa-patterns playwright-template my-project</code></pre>
            <pre><code>npx @toolstackhq/create-qa-patterns cypress-template my-project</code></pre>
            <pre><code>npx @toolstackhq/create-qa-patterns wdio-template my-project</code></pre>
          </article>
        </div>
      </section>

      <section id="mcp" class="section">
        <div class="section__heading">
          <p class="eyebrow">MCP</p>
          <h2>Use the same scaffolder through an LLM client</h2>
        </div>
        <div class="grid grid--two">
          <article class="tool-card tool-card--code">
            <h3><code>Codex</code></h3>
            <pre><code>{
  "mcpServers": {
    "qa-patterns": {
      "command": "/absolute/path/to/node",
      "args": [
        "/absolute/path/to/qa-patterns/packages/mcp-server/src/index.mjs"
      ],
      "cwd": "/absolute/path/to/qa-patterns"
    }
  }
}</code></pre>
          </article>
          <article class="tool-card tool-card--code">
            <h3><code>Claude Code</code></h3>
            <pre><code>{
  "mcpServers": {
    "qa-patterns": {
      "command": "/absolute/path/to/node",
      "args": [
        "/absolute/path/to/qa-patterns/packages/mcp-server/src/index.mjs"
      ],
      "cwd": "/absolute/path/to/qa-patterns"
    }
  }
}</code></pre>
          </article>
        </div>
        <div class="code-block code-block--wide">
          <p class="panel__label">Prompt example</p>
          <pre><code>Create a Playwright framework in ./my-framework without installing dependencies.</code></pre>
        </div>
        <p class="note">
          Generated projects also include <code>AI_CONTEXT.md</code> and <code>AGENTS.md</code> so teams can hand the framework rules to any LLM after scaffolding.
        </p>
      </section>

      <section class="section">
        <div class="section__heading">
          <p class="eyebrow">Upgrade flow</p>
          <h2>Bring managed template files forward later</h2>
        </div>
        <div class="grid grid--two">
          <article class="code-block">
            <p class="panel__label">Check</p>
            <pre><code>npx -y @toolstackhq/create-qa-patterns upgrade check .</code></pre>
          </article>
          <article class="code-block">
            <p class="panel__label">Apply safe updates</p>
            <pre><code>npx -y @toolstackhq/create-qa-patterns upgrade apply --safe .</code></pre>
          </article>
        </div>
        <p class="note">
          Safe updates only touch managed framework files that still match the generated baseline. User-edited tests and page files are left alone.
        </p>
      </section>

      <section class="section">
        <div class="section__heading">
          <p class="eyebrow">More docs</p>
          <h2>Go deeper when you need details</h2>
        </div>
        <div class="grid grid--three">
          <a class="doc-link" href="https://github.com/toolstackhq/qa-patterns/blob/main/docs/local-development.md" target="_blank" rel="noreferrer">
            <strong>Run locally</strong>
            <span>App startup, environment setup, and local commands.</span>
          </a>
          <a class="doc-link" href="https://github.com/toolstackhq/qa-patterns/blob/main/docs/architecture.md" target="_blank" rel="noreferrer">
            <strong>Architecture</strong>
            <span>How the templates, apps, MCP server, and shared config fit together.</span>
          </a>
          <a class="doc-link" href="https://github.com/toolstackhq/qa-patterns/blob/main/docs/extending-the-repository.md" target="_blank" rel="noreferrer">
            <strong>Extend the repo</strong>
            <span>Add new templates, evolve the data layer, and keep things consistent.</span>
          </a>
        </div>
      </section>
    </main>
  </div>
`;

const terminalElement = document.querySelector('[data-termynal]');
if (terminalElement) {
  const terminal = new Termynal(terminalElement);
  terminal.start();
}
