import './styles.css';
import Termynal from './vendor/termynal.js';

const templates = [
  {
    name: 'Playwright',
    id: 'playwright-template',
    summary: 'UI and API starter with Docker support and optional Allure.'
  },
  {
    name: 'Cypress',
    id: 'cypress-template',
    summary:
      'Browser-focused starter with API checks, Docker support, and optional Allure.'
  },
  {
    name: 'WebdriverIO',
    id: 'wdio-template',
    summary:
      'Mocha-based starter with API checks, Docker support, and optional Allure.'
  }
];

const foundations = [
  {
    title: 'Deterministic scaffolding',
    text: 'Projects come from tested templates instead of generated boilerplate.'
  },
  {
    title: 'Framework boundaries',
    text: 'Generated projects teach LLMs where tests, selectors, data, and config belong.'
  },
  {
    title: 'Ready to run',
    text: 'Templates include local demo apps, reports, and validation commands.'
  },
  {
    title: 'Safe upgrades',
    text: 'Managed framework files can move forward without overwriting user test logic.'
  }
];

const docsLinks = [
  {
    title: 'Run locally',
    description: 'Install, start the demo apps, and run the generated project.',
    href: 'https://github.com/toolstackhq/testkit/blob/main/docs/local-development.md'
  },
  {
    title: 'Architecture',
    description:
      'See how templates, demo apps, MCP, and shared logic fit together.',
    href: 'https://github.com/toolstackhq/testkit/blob/main/docs/architecture.md'
  },
  {
    title: 'Agent layer',
    description:
      'Understand where AI context files help and where orchestration starts.',
    href: 'https://github.com/toolstackhq/testkit/blob/main/docs/agent-layer.md'
  },
  {
    title: 'Extend the repo',
    description: 'Add templates, evolve config, and keep scaffolds consistent.',
    href: 'https://github.com/toolstackhq/testkit/blob/main/docs/extending-the-repository.md'
  }
];

const quickStartPanes = {
  cli: {
    title: 'Use the npm CLI',
    lead: 'Generate a project in the terminal with the interactive picker or an explicit template command.',
    install: 'npm install -g @toolstackhq/create-testkit@latest',
    interactive: 'npx @toolstackhq/create-testkit',
    templates: {
      playwright:
        'npx @toolstackhq/create-testkit playwright-template my-project',
      cypress: 'npx @toolstackhq/create-testkit cypress-template my-project',
      wdio: 'npx @toolstackhq/create-testkit wdio-template my-project'
    }
  },
  mcp: {
    title: 'Use the MCP server',
    lead: 'Let an LLM scaffold projects deterministically instead of inventing the framework shape.',
    commands: [
      '{',
      '  "mcpServers": {',
      '    "testkit": {',
      '      "command": "npx",',
      '      "args": ["-y", "@toolstackhq/testkit-mcp"]',
      '    }',
      '  }',
      '}'
    ]
  }
};

document.querySelector('#app').innerHTML = `
  <div class="page">
    <header class="topbar">
      <a href="#" class="brand">testkit</a>
      <nav class="topnav">
        <a href="#templates">Templates</a>
        <a href="#start">Get started</a>
        <a href="#agents">Agents</a>
        <a href="#docs">Docs</a>
        <a href="https://github.com/toolstackhq/testkit" target="_blank" rel="noreferrer">GitHub</a>
      </nav>
    </header>

    <main class="shell">
      <section class="hero">
        <div class="hero__copy">
          <p class="eyebrow">Project scaffolding for QA frameworks</p>
          <h1>Generate a clean test framework. Keep the AI help without the chaos.</h1>
          <p class="lede">
            <code>testkit</code> scaffolds ready-to-run <code>Playwright</code>, <code>Cypress</code>, and
            <code>WebdriverIO</code> projects with demo apps, reports, safe upgrades, and AI context files that teach
            coding agents how to work inside the framework.
          </p>
          <div class="hero__actions">
            <a href="#start" class="button button--primary">Get started</a>
            <a href="#agents" class="button button--ghost">See agent workflow</a>
          </div>
        </div>
        <aside class="hero__panel">
          <p class="panel__label">Quick start</p>
          <p class="hero__subheading">Install</p>
          <pre class="code-pill"><code>npm install -g @toolstackhq/create-testkit@latest</code></pre>
          <p class="hero__subheading">Run</p>
          <pre class="code-pill"><code>npx @toolstackhq/create-testkit</code></pre>
          <ul class="hero__meta">
            <li>3 tested templates</li>
            <li>Bundled local demo apps</li>
            <li>MCP server for deterministic scaffolding</li>
            <li><code>AI_CONTEXT.md</code> and <code>AGENTS.md</code> in generated projects</li>
          </ul>
        </aside>
      </section>

      <section class="foundation-grid">
        ${foundations
          .map(
            ({ title, text }) => `
              <article class="foundation-card">
                <h2>${title}</h2>
                <p>${text}</p>
              </article>
            `
          )
          .join('')}
      </section>

      <section id="templates" class="section">
        <div class="section__heading">
          <p class="eyebrow">Templates</p>
          <h2>Choose the framework, keep the same operating model</h2>
        </div>
        <div class="template-grid">
          ${templates
            .map(
              ({ name, id, summary }) => `
                <article class="template-card">
                  <p class="template-card__eyebrow">${name}</p>
                  <h3><code>${id}</code></h3>
                  <p>${summary}</p>
                </article>
              `
            )
            .join('')}
        </div>
      </section>

      <section id="start" class="section">
        <div class="section__heading">
          <p class="eyebrow">Get started</p>
          <h2>Start with the CLI or connect an LLM through MCP</h2>
        </div>
        <div class="quickstart">
          <div class="quickstart__tabs" role="tablist" aria-label="Quick start options">
            <button type="button" class="quickstart__tab is-active" data-tab="cli" role="tab" aria-selected="true">CLI</button>
            <button type="button" class="quickstart__tab" data-tab="mcp" role="tab" aria-selected="false">MCP</button>
          </div>
          <div class="quickstart__panel">
            <div class="quickstart__pane is-active" data-pane="cli">
              <p class="panel__label">${quickStartPanes.cli.title}</p>
              <p class="note">${quickStartPanes.cli.lead}</p>
              <p class="quickstart__subheading">Install</p>
              <pre class="code-pill"><code>${quickStartPanes.cli.install}</code></pre>
              <p class="quickstart__subheading">Run</p>
              <pre class="code-pill"><code>${quickStartPanes.cli.interactive}</code></pre>
              <div class="command-tabs" role="tablist" aria-label="Template commands">
                <button type="button" class="command-tab is-active" data-command-tab="playwright" role="tab" aria-selected="true">Playwright</button>
                <button type="button" class="command-tab" data-command-tab="cypress" role="tab" aria-selected="false">Cypress</button>
                <button type="button" class="command-tab" data-command-tab="wdio" role="tab" aria-selected="false">WebdriverIO</button>
              </div>
              <div class="command-panels">
                <div class="command-pane is-active" data-command-pane="playwright">
                  <pre class="code-pill"><code>${quickStartPanes.cli.templates.playwright}</code></pre>
                </div>
                <div class="command-pane" data-command-pane="cypress" hidden>
                  <pre class="code-pill"><code>${quickStartPanes.cli.templates.cypress}</code></pre>
                </div>
                <div class="command-pane" data-command-pane="wdio" hidden>
                  <pre class="code-pill"><code>${quickStartPanes.cli.templates.wdio}</code></pre>
                </div>
              </div>
            </div>
            <div class="quickstart__pane" data-pane="mcp" hidden>
              <p class="panel__label">${quickStartPanes.mcp.title}</p>
              <p class="note">${quickStartPanes.mcp.lead}</p>
              <pre class="code-block--full"><code>${quickStartPanes.mcp.commands.join('\n')}</code></pre>
              <div class="prompt-callout">
                <p class="panel__label">Prompt example</p>
                <pre class="code-pill"><code>Create a Playwright framework in ./my-framework without installing dependencies.</code></pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section terminal-section">
        <div class="section__heading">
          <p class="eyebrow">Animated CLI walkthrough</p>
          <h2>See the full scaffold flow in motion</h2>
          <p class="note">
            This is the live Termynal-style demo of the questions, selections,
            progress state, and final project summary a user sees.
          </p>
        </div>
        <div class="terminal-card">
          <div class="terminal-card__topbar" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
          <div class="terminal-card__body" data-termynal>
            <span data-ty="input">npx @toolstackhq/create-testkit</span>
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
      </section>

      <section id="agents" class="section">
        <div class="section__heading">
          <p class="eyebrow">Agents</p>
          <h2>After scaffolding, hand the generated project to a coding agent</h2>
        </div>
        <div class="agent-layout">
          <div class="agent-steps">
            <article class="agent-step">
              <span>1</span>
              <div>
                <h3>Scaffold</h3>
                <p>Generate the project with the CLI or through MCP.</p>
              </div>
            </article>
            <article class="agent-step">
              <span>2</span>
              <div>
                <h3>Load framework context</h3>
                <p>Tell the agent to read <code>AGENTS.md</code> and <code>AI_CONTEXT.md</code> first.</p>
              </div>
            </article>
            <article class="agent-step">
              <span>3</span>
              <div>
                <h3>Edit and validate</h3>
                <p>Have the agent run the project’s normal <code>lint</code>, <code>typecheck</code>, and <code>test</code> commands.</p>
              </div>
            </article>
          </div>
          <div class="agent-prompt">
            <p class="panel__label">Prompt example</p>
            <pre><code>Read AGENTS.md and AI_CONTEXT.md first.

Add a new regression test for this scenario:
- sign in
- add two people
- verify both names appear in the list

Use existing page objects and the data factory.
Do not put selectors in the test.
Run lint, typecheck, and tests after the change.</code></pre>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section__heading">
          <p class="eyebrow">Upgrade flow</p>
          <h2>Move managed framework files forward later</h2>
        </div>
        <div class="upgrade-grid">
          <article class="code-card">
            <p class="panel__label">Check</p>
            <pre><code>npx -y @toolstackhq/create-testkit upgrade check .</code></pre>
          </article>
          <article class="code-card">
            <p class="panel__label">Apply safe updates</p>
            <pre><code>npx -y @toolstackhq/create-testkit upgrade apply --safe .</code></pre>
          </article>
        </div>
      </section>

      <section id="docs" class="section">
        <div class="section__heading">
          <p class="eyebrow">Docs</p>
          <h2>Go deeper only when you need it</h2>
        </div>
        <div class="docs-grid">
          ${docsLinks
            .map(
              ({ title, description, href }) => `
                <a class="doc-link" href="${href}" target="_blank" rel="noreferrer">
                  <strong>${title}</strong>
                  <span>${description}</span>
                </a>
              `
            )
            .join('')}
        </div>
      </section>
    </main>
  </div>
`;

const terminalElement = document.querySelector('[data-termynal]');
const terminalSection = document.querySelector('.terminal-section');

if (terminalElement && terminalSection) {
  const terminal = new Termynal(terminalElement, {
    startDelay: 850,
    typeDelay: 34,
    lineDelay: 760,
    progressDuration: 1800
  });

  let hasStartedTerminal = false;

  const startTerminal = () => {
    if (hasStartedTerminal) {
      return;
    }
    hasStartedTerminal = true;
    terminal.start();
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          startTerminal();
          observer.disconnect();
          break;
        }
      }
    },
    {
      threshold: 0.55
    }
  );

  observer.observe(terminalSection);
}

document.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-tab]');
  if (tab) {
    const target = tab.getAttribute('data-tab');
    const tabs = document.querySelectorAll('[data-tab]');
    const panes = document.querySelectorAll('[data-pane]');

    for (const item of tabs) {
      const active = item === tab;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
    }

    for (const pane of panes) {
      const active = pane.getAttribute('data-pane') === target;
      pane.classList.toggle('is-active', active);
      pane.hidden = !active;
    }
    return;
  }

  const commandTab = event.target.closest('[data-command-tab]');
  if (commandTab) {
    const target = commandTab.getAttribute('data-command-tab');
    const commandTabs = document.querySelectorAll('[data-command-tab]');
    const commandPanes = document.querySelectorAll('[data-command-pane]');

    for (const item of commandTabs) {
      const active = item === commandTab;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
    }

    for (const pane of commandPanes) {
      const active = pane.getAttribute('data-command-pane') === target;
      pane.classList.toggle('is-active', active);
      pane.hidden = !active;
    }
  }
});
