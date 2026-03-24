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
  const optionsHtml = templates
    .map((template) => {
      const selected = template.id === defaultTemplateId ? ' selected' : '';
      return `<option value="${escapeHtml(template.id)}"${selected}>${escapeHtml(
        template.label
      )}</option>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapedPackageName} setup</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f3f4f6;
        --panel: #ffffff;
        --panel-soft: #f8fafc;
        --border: #dbe2ea;
        --border-strong: #c2cbd6;
        --text: #0f172a;
        --muted: #526070;
        --subtle: #64748b;
        --accent: #2563eb;
        --success: #0f766e;
        --danger: #b91c1c;
        --shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
        --radius: 16px;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Segoe UI", Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        background: var(--bg);
        color: var(--text);
      }

      .frame {
        max-width: 1120px;
        margin: 0 auto;
        min-height: 100vh;
        padding: 16px;
        display: grid;
        grid-template-columns: minmax(340px, 420px) minmax(0, 1fr);
        gap: 16px;
        align-items: start;
      }

      .panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        padding: 18px;
      }

      h1,
      h2,
      p {
        margin: 0;
      }

      h1 {
        font-size: 1.08rem;
        letter-spacing: -0.02em;
      }

      h2 {
        font-size: 0.94rem;
        letter-spacing: -0.02em;
      }

      .subtle {
        margin-top: 4px;
        color: var(--muted);
        font-size: 0.84rem;
        line-height: 1.45;
      }

      .form-stack,
      .meta-stack {
        display: grid;
        gap: 12px;
      }

      .form-stack {
        margin-top: 14px;
      }

      .field {
        display: grid;
        gap: 6px;
      }

      .field label,
      .section-label {
        font-size: 0.84rem;
        font-weight: 700;
      }

      .select-input,
      .text-input {
        width: 100%;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid var(--border-strong);
        background: #fff;
        color: var(--text);
        font: inherit;
      }

      .select-input:focus,
      .text-input:focus {
        outline: 2px solid rgba(37, 99, 235, 0.15);
        border-color: rgba(37, 99, 235, 0.4);
      }

      .inline-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .toggle {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: var(--panel-soft);
      }

      .toggle.is-disabled {
        opacity: 0.58;
      }

      .toggle strong {
        display: block;
        font-size: 0.84rem;
      }

      .toggle span {
        color: var(--muted);
        font-size: 0.76rem;
        line-height: 1.35;
      }

      .button-row {
        display: flex;
        gap: 10px;
        margin-top: 2px;
      }

      .button {
        appearance: none;
        border: 0;
        border-radius: 10px;
        padding: 10px 14px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }

      .button:disabled {
        cursor: not-allowed;
        opacity: 0.68;
      }

      .button-primary {
        background: #111827;
        color: #fff;
      }

      .button-secondary {
        background: #e5e7eb;
        color: #111827;
      }

      .feature-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .feature-card {
        padding: 10px 11px;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: var(--panel-soft);
      }

      .feature-card strong {
        display: block;
        font-size: 0.82rem;
      }

      .feature-card span {
        display: block;
        margin-top: 4px;
        color: var(--muted);
        font-size: 0.75rem;
        line-height: 1.35;
      }

      .status-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .run-state {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border-radius: 999px;
        background: #eef2f7;
        color: var(--text);
        font-size: 0.78rem;
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

      .terminal {
        border: 1px solid var(--border);
        border-radius: 14px;
        background: #111827;
        overflow: hidden;
      }

      .terminal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .terminal-header strong {
        color: #f8fafc;
        font-size: 0.82rem;
      }

      .terminal-header span {
        color: #94a3b8;
        font-size: 0.74rem;
      }

      .code-block,
      .log-block {
        margin: 0;
        padding: 12px;
        color: #cbd5e1;
        font-family: "SFMono-Regular", ui-monospace, Menlo, Consolas, monospace;
        font-size: 0.8rem;
        line-height: 1.5;
        overflow-x: auto;
        white-space: pre-wrap;
      }

      .log-block {
        min-height: 240px;
        max-height: 360px;
      }

      .log-empty {
        color: #64748b;
      }

      .log-stream {
        color: #e2e8f0;
      }

      [hidden] {
        display: none !important;
      }

      @media (max-width: 980px) {
        .frame,
        .inline-grid,
        .feature-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="frame">
      <section class="panel">
        <h1>testkit setup</h1>
        <p class="subtle">Answer the questions below, start the scaffold, then go back to the terminal.</p>

        <form id="scaffold-form" class="form-stack" action="/" method="get">
          <div class="field">
            <label for="templateSelect">Framework</label>
            <select id="templateSelect" class="select-input" name="templateSelect">${optionsHtml}</select>
          </div>

          <div class="inline-grid">
            <label class="toggle">
              <input id="withApi" name="withApi" type="checkbox" checked />
              <span>
                <strong>Include API tests</strong>
                Adds starter API coverage.
              </span>
            </label>

            <label class="toggle">
              <input id="useCurrentDirectory" name="useCurrentDirectory" type="checkbox" />
              <span>
                <strong>Use current folder</strong>
                Skip creating a new directory.
              </span>
            </label>
          </div>

          <div id="targetDirectoryWrap" class="field">
            <label for="targetDirectory">Directory name</label>
            <input
              id="targetDirectory"
              class="text-input"
              name="targetDirectory"
              value="my-testkit-project"
              spellcheck="false"
            />
          </div>

          <div class="section-label">After scaffold</div>

          <div class="inline-grid">
            <label class="toggle">
              <input id="runInstall" name="runInstall" type="checkbox" checked />
              <span>
                <strong>Run install</strong>
                Executes <code>npm install</code>.
              </span>
            </label>

            <label class="toggle" id="setupToggle">
              <input id="runSetup" name="runSetup" type="checkbox" checked />
              <span>
                <strong id="setupTitle">Run setup</strong>
                <span id="setupDescription">Installs Playwright browsers.</span>
              </span>
            </label>

            <label class="toggle">
              <input id="runTests" name="runTests" type="checkbox" />
              <span>
                <strong>Run tests</strong>
                Executes the starter validation path.
              </span>
            </label>
          </div>

          <div class="button-row">
            <button id="startButton" class="button button-primary" type="button">
              Generate template
            </button>
            <button id="resetButton" class="button button-secondary" type="button">
              Reset
            </button>
          </div>
        </form>
      </section>

      <section class="panel meta-stack">
        <div>
          <h2>Your template will include</h2>
          <p class="subtle" id="templateSummary">The selected template summary appears here.</p>
        </div>

        <div id="featureGrid" class="feature-grid"></div>

        <div class="status-row">
          <div id="runState" class="run-state" data-state="idle">Idle</div>
          <div class="subtle">Watch the log here, then go back to the terminal for next steps.</div>
        </div>

        <div class="terminal">
          <div class="terminal-header">
            <strong>Command preview</strong>
            <span>same CLI engine</span>
          </div>
          <pre id="commandPreview" class="code-block"></pre>
        </div>

        <div class="terminal">
          <div class="terminal-header">
            <strong>Live log</strong>
            <span>mirrored from the terminal run</span>
          </div>
          <pre id="activityLog" class="log-block"><span class="log-empty">No scaffold activity yet. Start a run to stream output here.</span></pre>
        </div>
      </section>
    </main>

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
        logs: '',
        successMessageShown: false
      };

      const templateSelect = document.getElementById('templateSelect');
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

      function appendSuccessMessage() {
        if (state.successMessageShown) {
          return;
        }

        state.successMessageShown = true;
        appendLog(
          '\nTemplate generated successfully. Go back to the terminal for next steps and full output details.\n'
        );
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
        templateSelect.value = state.templateId;
        renderFeatureSummary();
        renderCommandPreview();
      }

      templateSelect.addEventListener('change', () => {
        if (state.busy) return;
        state.templateId = templateSelect.value;
        updateSetupControl();
        renderFeatureSummary();
        renderCommandPreview();
      });
      targetDirectory.addEventListener('input', renderCommandPreview);
      useCurrentDirectory.addEventListener('change', updateTargetControl);
      withApi.addEventListener('change', renderCommandPreview);
      withApi.addEventListener('change', renderFeatureSummary);
      runInstall.addEventListener('change', renderCommandPreview);
      runSetup.addEventListener('change', renderCommandPreview);
      runTests.addEventListener('change', renderCommandPreview);
      resetButton.addEventListener('click', resetForm);

      async function startScaffold(event) {
        event.preventDefault();
        if (state.busy) return;

        state.busy = true;
        state.logs = '';
        state.successMessageShown = false;
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
      }

      form.addEventListener('submit', startScaffold);
      startButton.addEventListener('click', startScaffold);

      const eventSource = new EventSource('/events');

      eventSource.addEventListener('snapshot', (event) => {
        const payload = JSON.parse(event.data);
        state.logs = payload.logs || '';
        appendLog('');
        state.busy = payload.busy;
        setRunState(payload.state || 'idle', payload.label || 'Idle');
        startButton.disabled = payload.busy;
        resetButton.disabled = payload.busy;
        if (payload.state === 'completed') {
          appendSuccessMessage();
        }
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
        if (payload.state === 'completed') {
          appendSuccessMessage();
        }
      });

      updateSetupControl();
      updateTargetControl();
      templateSelect.value = state.templateId;
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
    const requestUrl = new URL(url, 'http://127.0.0.1');
    const pathname = requestUrl.pathname;

    if (method === 'GET' && pathname === '/') {
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

    if (method === 'GET' && pathname === '/events') {
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

    if (method === 'POST' && pathname === '/api/start') {
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
