const { spawn } = require('node:child_process');
const http = require('node:http');

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function openBrowser(url) {
  const platform = process.platform;

  try {
    if (platform === 'darwin') {
      spawn('open', [url], {
        detached: true,
        stdio: 'ignore'
      }).unref();
      return true;
    }

    if (platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', url], {
        detached: true,
        stdio: 'ignore'
      }).unref();
      return true;
    }

    spawn('xdg-open', [url], {
      detached: true,
      stdio: 'ignore'
    }).unref();
    return true;
  } catch {
    return false;
  }
}

function normalizeBrowserLogChunk(chunk) {
  return chunk.replaceAll('\r', '\n');
}

function createHtml({ packageName, templates, defaultTemplateId }) {
  const serializedTemplates = JSON.stringify(templates);
  const escapedPackageName = escapeHtml(packageName);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapedPackageName} setup</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f6f8fb;
        --panel: #ffffff;
        --panel-soft: #f8fafc;
        --border: rgba(15, 23, 42, 0.08);
        --border-strong: rgba(15, 23, 42, 0.16);
        --text: #0f172a;
        --muted: #475569;
        --subtle: #64748b;
        --accent: #2563eb;
        --accent-soft: rgba(37, 99, 235, 0.06);
        --success: #0f766e;
        --danger: #b91c1c;
        --shadow: 0 20px 48px rgba(15, 23, 42, 0.08);
        --radius: 20px;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Segoe UI", Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        background: linear-gradient(180deg, #fbfdff 0%, var(--bg) 100%);
        color: var(--text);
      }

      .shell {
        min-height: 100vh;
        padding: 28px 20px 40px;
      }

      .frame {
        max-width: 1180px;
        margin: 0 auto;
      }

      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 18px;
      }

      .brand {
        font-size: 1.2rem;
        font-weight: 700;
        letter-spacing: -0.03em;
      }

      .topbar span {
        color: var(--muted);
        font-size: 0.92rem;
      }

      .layout {
        display: grid;
        grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
        gap: 20px;
      }

      .panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        padding: 24px;
      }

      .panel h1,
      .panel h2 {
        margin: 0;
        letter-spacing: -0.03em;
      }

      .panel h1 {
        font-size: 1.55rem;
      }

      .panel h2 {
        font-size: 1.08rem;
      }

      .panel > p,
      .section-note {
        margin: 0;
        color: var(--muted);
        line-height: 1.65;
      }

      .question-stack {
        margin-top: 24px;
        display: grid;
        gap: 20px;
      }

      .question {
        display: grid;
        gap: 12px;
      }

      .question-label {
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--text);
      }

      .template-grid,
      .choice-list {
        display: grid;
        gap: 12px;
      }

      .template-card {
        display: block;
        width: 100%;
        text-align: left;
        padding: 16px 18px;
        border-radius: 18px;
        border: 1px solid var(--border);
        background: var(--panel-soft);
        cursor: pointer;
        transition: border-color 0.2s ease, box-shadow 0.2s ease,
          transform 0.2s ease;
      }

      .template-card:hover {
        transform: translateY(-1px);
        border-color: rgba(37, 99, 235, 0.18);
        box-shadow: 0 10px 22px rgba(37, 99, 235, 0.08);
      }

      .template-card.is-active {
        border-color: rgba(37, 99, 235, 0.34);
        box-shadow: 0 12px 24px rgba(37, 99, 235, 0.12);
        background: linear-gradient(
          180deg,
          rgba(37, 99, 235, 0.08),
          #ffffff 100%
        );
      }

      .template-card strong {
        display: block;
        font-size: 1rem;
        letter-spacing: -0.02em;
      }

      .template-card span {
        display: block;
        margin-top: 6px;
        color: var(--muted);
        line-height: 1.55;
        font-size: 0.92rem;
      }

      .choice {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 14px;
        align-items: start;
        padding: 14px 16px;
        border-radius: 16px;
        border: 1px solid var(--border);
        background: var(--panel-soft);
      }

      .choice input {
        margin-top: 3px;
      }

      .choice strong {
        display: block;
        margin-bottom: 4px;
        font-size: 0.95rem;
      }

      .choice span {
        color: var(--muted);
        font-size: 0.9rem;
        line-height: 1.55;
      }

      .choice.is-disabled {
        opacity: 0.58;
      }

      .text-input {
        width: 100%;
        padding: 14px 16px;
        border-radius: 14px;
        border: 1px solid var(--border-strong);
        background: #fff;
        color: var(--text);
        font: inherit;
      }

      .text-input:focus {
        outline: 2px solid rgba(37, 99, 235, 0.16);
        border-color: rgba(37, 99, 235, 0.4);
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .button {
        appearance: none;
        border: 0;
        border-radius: 14px;
        padding: 13px 18px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
      }

      .button:hover {
        transform: translateY(-1px);
      }

      .button:disabled {
        cursor: not-allowed;
        transform: none;
        opacity: 0.68;
      }

      .button-primary {
        background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
        color: #ffffff;
        box-shadow: 0 14px 30px rgba(37, 99, 235, 0.22);
      }

      .button-secondary {
        background: rgba(15, 23, 42, 0.06);
        color: var(--text);
      }

      .hint {
        color: var(--subtle);
        font-size: 0.88rem;
      }

      .stack {
        display: grid;
        gap: 18px;
      }

      .feature-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .feature-card {
        padding: 14px 15px;
        border-radius: 16px;
        border: 1px solid var(--border);
        background: var(--panel-soft);
      }

      .feature-card strong {
        display: block;
        font-size: 0.92rem;
        margin-bottom: 4px;
      }

      .feature-card span {
        display: block;
        color: var(--muted);
        font-size: 0.87rem;
        line-height: 1.5;
      }

      .inline-note {
        padding: 14px 16px;
        border-radius: 16px;
        border: 1px solid var(--border);
        background: rgba(37, 99, 235, 0.04);
        color: var(--muted);
        line-height: 1.6;
      }

      .preview-card {
        border-radius: 18px;
        border: 1px solid var(--border);
        background: rgba(15, 23, 42, 0.96);
        overflow: hidden;
      }

      .preview-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 16px;
        border-bottom: 1px solid rgba(226, 232, 240, 0.08);
      }

      .preview-header strong {
        color: #f8fafc;
        font-size: 0.92rem;
      }

      .preview-header span {
        color: #94a3b8;
        font-size: 0.8rem;
      }

      .code-block {
        margin: 0;
        padding: 18px 18px 20px;
        color: #cbd5e1;
        font-family: "SFMono-Regular", ui-monospace, Menlo, Consolas, monospace;
        font-size: 0.89rem;
        line-height: 1.8;
        overflow-x: auto;
        white-space: pre-wrap;
      }

      .log-block {
        min-height: 320px;
        max-height: 500px;
      }

      .log-empty {
        color: #64748b;
      }

      .log-stream {
        color: #e2e8f0;
      }

      .run-state {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.06);
        color: var(--text);
        font-size: 0.84rem;
        font-weight: 700;
      }

      .run-state::before {
        content: "";
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--subtle);
      }

      .run-state[data-state="running"]::before {
        background: var(--accent);
      }

      .run-state[data-state="completed"]::before {
        background: var(--success);
      }

      .run-state[data-state="failed"]::before {
        background: var(--danger);
      }

      [hidden] {
        display: none !important;
      }

      @media (max-width: 980px) {
        .layout,
        .feature-grid {
          grid-template-columns: 1fr;
        }

        .shell {
          padding: 20px 14px 32px;
        }

        .panel {
          padding: 18px;
        }

        .topbar {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <div class="frame">
        <div class="topbar">
          <div class="brand">testkit setup</div>
          <span>Local UI wrapper for <code>${escapedPackageName}</code></span>
        </div>

        <section class="layout">
          <section class="panel">
            <h1>Setup</h1>
            <p class="section-note">
              Answer the questions, start scaffolding, then go back to the terminal for the full output.
            </p>

            <form id="scaffold-form" class="question-stack">
              <fieldset class="question">
                <legend class="question-label">1. Select the framework</legend>
                <div id="template-grid" class="template-grid"></div>
              </fieldset>

              <fieldset class="question">
                <legend class="question-label">2. Include API tests too?</legend>
                <div class="choice-list">
                  <label class="choice">
                    <input id="withApi" name="withApi" type="checkbox" checked />
                    <span>
                      <strong>Yes, include the API layer</strong>
                      Keep the demo API server, API client, and starter API tests.
                    </span>
                  </label>
                </div>
              </fieldset>

              <fieldset class="question">
                <legend class="question-label">3. Create in the current folder?</legend>
                <div class="choice-list">
                  <label class="choice">
                    <input id="useCurrentDirectory" name="useCurrentDirectory" type="checkbox" />
                    <span>
                      <strong>Use the current folder</strong>
                      Scaffold directly where this command was started instead of creating a new directory.
                    </span>
                  </label>
                </div>
                <div id="targetDirectoryWrap">
                  <label class="question-label" for="targetDirectory">New directory name</label>
                  <input
                    id="targetDirectory"
                    class="text-input"
                    name="targetDirectory"
                    value="my-testkit-project"
                    spellcheck="false"
                  />
                </div>
              </fieldset>

              <fieldset class="question">
                <legend class="question-label">4. Post-generate actions</legend>
                <div class="choice-list">
                  <label class="choice">
                    <input id="runInstall" name="runInstall" type="checkbox" checked />
                    <span>
                      <strong>Run npm install</strong>
                      Install dependencies immediately after the scaffold completes.
                    </span>
                  </label>
                  <label class="choice" id="setupToggle">
                    <input id="runSetup" name="runSetup" type="checkbox" checked />
                    <span>
                      <strong id="setupTitle">Run Playwright setup</strong>
                      <span id="setupDescription">Install Playwright browsers after npm install.</span>
                    </span>
                  </label>
                  <label class="choice">
                    <input id="runTests" name="runTests" type="checkbox" />
                    <span>
                      <strong>Run npm test</strong>
                      Execute the starter validation path once the project is ready.
                    </span>
                  </label>
                </div>
              </fieldset>

              <div class="actions">
                <button id="startButton" class="button button-primary" type="submit">
                  Start scaffolding
                </button>
                <button id="resetButton" class="button button-secondary" type="button">
                  Reset defaults
                </button>
              </div>

              <div class="hint">
                Execution always happens in the same terminal session that launched this local UI.
              </div>
            </form>
          </section>

          <section class="panel">
            <div class="stack">
              <div>
                <h2>Selected template</h2>
                <p class="section-note" id="templateSummary">
                  The selected template summary appears here.
                </p>
              </div>

              <div id="featureGrid" class="feature-grid"></div>

              <div class="inline-note">
                After the run starts, return to the terminal you launched
                <code>${escapedPackageName} --ui</code> from. This page mirrors progress, but the terminal stays in charge.
              </div>

              <div class="actions">
                <div id="runState" class="run-state" data-state="idle">Idle</div>
              </div>

              <div class="preview-card">
                <div class="preview-header">
                  <strong>Command preview</strong>
                  <span>same scaffold engine</span>
                </div>
                <pre id="commandPreview" class="code-block"></pre>
              </div>

              <div class="preview-card">
                <div class="preview-header">
                  <strong>Live log</strong>
                  <span>mirrored from the terminal run</span>
                </div>
                <pre id="activityLog" class="code-block log-block"><span class="log-empty">No scaffold activity yet. Start a run to stream output here.</span></pre>
              </div>
            </div>
          </section>
        </section>
      </div>
    </div>

    <script>
      const templates = ${serializedTemplates};
      const defaultTemplateId = ${JSON.stringify(defaultTemplateId)};
      const templateFeatures = {
        'playwright-template': [
          ['TypeScript', 'typed starter project'],
          ['API tests', 'bundled API client and starter spec'],
          ['Docker', 'container-ready validation path'],
          ['Allure', 'optional report generation'],
          ['Page objects', 'selectors stay out of tests'],
          ['Demo apps', 'UI and API starter apps']
        ],
        'cypress-template': [
          ['TypeScript', 'typed Cypress starter'],
          ['API tests', 'task-based API layer'],
          ['Docker', 'container-ready validation path'],
          ['Allure', 'optional report generation'],
          ['Page modules', 'selectors stay in support/pages'],
          ['Demo apps', 'UI and API starter apps']
        ],
        'wdio-template': [
          ['TypeScript', 'typed WebdriverIO starter'],
          ['API tests', 'bundled API helper and client'],
          ['Docker', 'container-ready validation path'],
          ['Allure', 'optional report generation'],
          ['Page objects', 'selectors stay out of specs'],
          ['Demo apps', 'UI and API starter apps']
        ]
      };

      const state = {
        templateId: defaultTemplateId,
        busy: false,
        logs: ''
      };

      const templateGrid = document.getElementById('template-grid');
      const useCurrentDirectory = document.getElementById('useCurrentDirectory');
      const targetDirectoryWrap = document.getElementById('targetDirectoryWrap');
      const targetDirectory = document.getElementById('targetDirectory');
      const withApi = document.getElementById('withApi');
      const runInstall = document.getElementById('runInstall');
      const runSetup = document.getElementById('runSetup');
      const runTests = document.getElementById('runTests');
      const setupToggle = document.getElementById('setupToggle');
      const setupTitle = document.getElementById('setupTitle');
      const setupDescription = document.getElementById('setupDescription');
      const runState = document.getElementById('runState');
      const startButton = document.getElementById('startButton');
      const resetButton = document.getElementById('resetButton');
      const commandPreview = document.getElementById('commandPreview');
      const activityLog = document.getElementById('activityLog');
      const templateSummary = document.getElementById('templateSummary');
      const featureGrid = document.getElementById('featureGrid');
      const form = document.getElementById('scaffold-form');

      function findTemplate(templateId) {
        return templates.find((template) => template.id === templateId) || templates[0];
      }

      function updateSetupControl() {
        const template = findTemplate(state.templateId);
        const isPlaywright = template.id === 'playwright-template';
        runSetup.disabled = !isPlaywright;
        setupToggle.classList.toggle('is-disabled', !isPlaywright);

        if (isPlaywright) {
          setupTitle.textContent = 'Run Playwright setup';
          setupDescription.textContent = 'Install Playwright browsers after npm install.';
          runSetup.checked = true;
        } else {
          setupTitle.textContent = 'Template-specific setup';
          setupDescription.textContent = 'No extra setup step is required for this template.';
          runSetup.checked = false;
        }
      }

      function updateTargetControl() {
        targetDirectoryWrap.hidden = useCurrentDirectory.checked;
        renderCommandPreview();
      }

      function renderTemplates() {
        templateGrid.innerHTML = '';

        for (const template of templates) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'template-card' + (template.id === state.templateId ? ' is-active' : '');
          button.innerHTML =
            '<strong>' +
            template.label +
            '</strong><span>' +
            template.description +
            '</span>';
          button.addEventListener('click', () => {
            if (state.busy) return;
            state.templateId = template.id;
            updateSetupControl();
            renderTemplates();
            renderFeatureSummary();
            renderCommandPreview();
          });
          templateGrid.appendChild(button);
        }
      }

      function renderFeatureSummary() {
        const template = findTemplate(state.templateId);
        const apiNote = withApi.checked
          ? 'Starter API coverage is included.'
          : 'UI-only scaffold. API starter files will be removed.';
        templateSummary.textContent = template.description + ' ' + apiNote;
        featureGrid.innerHTML = '';

        for (const [title, description] of templateFeatures[template.id] || []) {
          const card = document.createElement('div');
          card.className = 'feature-card';
          card.innerHTML =
            '<strong>' + title + '</strong><span>' + description + '</span>';
          featureGrid.appendChild(card);
        }
      }

      function renderCommandPreview() {
        const target = useCurrentDirectory.checked
          ? '.'
          : (targetDirectory.value || '.').trim();
        const parts = ['npx', '@toolstackhq/create-testkit', state.templateId];

        if (target && target !== '.') {
          parts.push(target);
        }

        if (!withApi.checked) {
          parts.push('--no-api');
        }

        if (!runInstall.checked) {
          parts.push('--no-install');
        }

        if (runSetup.disabled || !runSetup.checked) {
          parts.push('--no-setup');
        }

        if (!runTests.checked) {
          parts.push('--no-test');
        }

        commandPreview.textContent = parts.join(' ');
      }

      function setRunState(nextState, label) {
        runState.dataset.state = nextState;
        runState.textContent = label;
      }

      function appendLog(text) {
        state.logs += text;

        if (!state.logs.trim()) {
          activityLog.innerHTML =
            '<span class="log-empty">No scaffold activity yet. Start a run to stream output here.</span>';
          return;
        }

        activityLog.innerHTML = '<span class="log-stream"></span>';
        activityLog.firstChild.textContent = state.logs;
        activityLog.scrollTop = activityLog.scrollHeight;
      }

      function resetForm() {
        if (state.busy) return;

        state.templateId = defaultTemplateId;
        useCurrentDirectory.checked = false;
        targetDirectory.value = 'my-testkit-project';
        withApi.checked = true;
        runInstall.checked = true;
        runTests.checked = false;
        updateSetupControl();
        updateTargetControl();
        renderTemplates();
        renderFeatureSummary();
        renderCommandPreview();
      }

      targetDirectory.addEventListener('input', renderCommandPreview);
      useCurrentDirectory.addEventListener('change', updateTargetControl);
      withApi.addEventListener('change', renderCommandPreview);
      withApi.addEventListener('change', renderFeatureSummary);
      runInstall.addEventListener('change', renderCommandPreview);
      runSetup.addEventListener('change', renderCommandPreview);
      runTests.addEventListener('change', renderCommandPreview);
      resetButton.addEventListener('click', resetForm);

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (state.busy) return;

        state.busy = true;
        state.logs = '';
        appendLog('');
        setRunState('running', 'Running');
        startButton.disabled = true;
        resetButton.disabled = true;

        const payload = {
          templateName: state.templateId,
          targetDirectory: useCurrentDirectory.checked
            ? '.'
            : targetDirectory.value.trim() || '.',
          withApi: withApi.checked,
          runInstall: runInstall.checked,
          runSetup: runSetup.disabled ? false : runSetup.checked,
          runTest: runTests.checked
        };

        const response = await fetch('/api/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const result = await response
            .json()
            .catch(() => ({ error: 'Unable to start scaffold.' }));
          state.busy = false;
          setRunState('failed', 'Failed to start');
          appendLog((result.error || 'Unable to start scaffold.') + '\\n');
          startButton.disabled = false;
          resetButton.disabled = false;
        }
      });

      const eventSource = new EventSource('/events');

      eventSource.addEventListener('snapshot', (event) => {
        const payload = JSON.parse(event.data);
        state.logs = payload.logs || '';
        appendLog('');
        state.busy = payload.busy;
        setRunState(payload.state || 'idle', payload.label || 'Idle');
        startButton.disabled = payload.busy;
        resetButton.disabled = payload.busy;
      });

      eventSource.addEventListener('log', (event) => {
        const payload = JSON.parse(event.data);
        appendLog(payload.text || '');
      });

      eventSource.addEventListener('state', (event) => {
        const payload = JSON.parse(event.data);
        state.busy = Boolean(payload.busy);
        setRunState(payload.state || 'idle', payload.label || 'Idle');
        startButton.disabled = state.busy;
        resetButton.disabled = state.busy;
      });

      updateSetupControl();
      updateTargetControl();
      renderTemplates();
      renderFeatureSummary();
      renderCommandPreview();
    </script>
  </body>
</html>`;
}

function startUiServer(options) {
  const {
    colors,
    defaultTemplateId,
    packageName,
    port,
    runScaffold,
    templates
  } = options;
  const clients = new Set();
  const state = {
    busy: false,
    logs: '',
    runState: 'idle',
    runLabel: 'Idle'
  };

  function broadcast(event, payload) {
    const serialized = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const response of clients) {
      response.write(serialized);
    }
  }

  function appendLog(text) {
    state.logs += text;
    broadcast('log', { text });
  }

  function setState(nextState, label, busy) {
    state.runState = nextState;
    state.runLabel = label;
    state.busy = busy;
    broadcast('state', {
      state: nextState,
      label,
      busy
    });
  }

  function mirrorProcessOutput() {
    const stdoutWrite = process.stdout.write.bind(process.stdout);
    const stderrWrite = process.stderr.write.bind(process.stderr);

    process.stdout.write = (chunk, encoding, callback) => {
      const text = Buffer.isBuffer(chunk)
        ? chunk.toString(encoding || 'utf8')
        : chunk;
      appendLog(normalizeBrowserLogChunk(String(text)));
      return stdoutWrite(chunk, encoding, callback);
    };

    process.stderr.write = (chunk, encoding, callback) => {
      const text = Buffer.isBuffer(chunk)
        ? chunk.toString(encoding || 'utf8')
        : chunk;
      appendLog(normalizeBrowserLogChunk(String(text)));
      return stderrWrite(chunk, encoding, callback);
    };

    return () => {
      process.stdout.write = stdoutWrite;
      process.stderr.write = stderrWrite;
    };
  }

  async function handleRun(selection) {
    if (state.busy) {
      throw new Error('A scaffold run is already in progress.');
    }

    state.logs = '';
    setState('running', 'Running', true);
    const restoreOutput = mirrorProcessOutput();
    process.env.TESTKIT_UI_MIRROR = '1';

    try {
      await runScaffold(selection);
      setState('completed', 'Completed', false);
      appendLog(
        '\nUI session complete. Return to the terminal for next steps or another run.\n'
      );
    } catch (error) {
      setState('failed', 'Failed', false);
      const message = error instanceof Error ? error.message : String(error);
      appendLog(`\n${message}\n`);
    } finally {
      delete process.env.TESTKIT_UI_MIRROR;
      restoreOutput();
    }
  }

  const server = http.createServer((request, response) => {
    const { method = 'GET', url = '/' } = request;

    if (method === 'GET' && url === '/') {
      response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });
      response.end(
        createHtml({
          defaultTemplateId,
          packageName,
          templates
        })
      );
      return;
    }

    if (method === 'GET' && url === '/events') {
      response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      });
      response.write(
        `event: snapshot\ndata: ${JSON.stringify({
          busy: state.busy,
          state: state.runState,
          label: state.runLabel,
          logs: state.logs
        })}\n\n`
      );
      clients.add(response);
      request.on('close', () => {
        clients.delete(response);
      });
      return;
    }

    if (method === 'POST' && url === '/api/start') {
      let body = '';
      request.on('data', (chunk) => {
        body += chunk;
      });
      request.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          response.writeHead(202, {
            'Content-Type': 'application/json; charset=utf-8'
          });
          response.end(JSON.stringify({ accepted: true }));
          await handleRun(payload);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          if (!response.headersSent) {
            response.writeHead(400, {
              'Content-Type': 'application/json; charset=utf-8'
            });
            response.end(JSON.stringify({ error: message }));
          } else {
            appendLog(`\n${message}\n`);
            setState('failed', 'Failed', false);
          }
        }
      });
      return;
    }

    response.writeHead(404, {
      'Content-Type': 'text/plain; charset=utf-8'
    });
    response.end('Not found');
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const url = `http://127.0.0.1:${port}`;
      const opened = openBrowser(url);
      process.stdout.write(
        `${colors.bold('Local setup UI')}\n` +
          `  URL: ${url}\n` +
          `  Fill the form in the browser, then return here for the live scaffold output.\n` +
          `  Browser launch: ${opened ? 'opened automatically' : 'open the URL manually'}\n\n`
      );
      resolve({ server, url });
    });
  });
}

module.exports = {
  startUiServer
};
