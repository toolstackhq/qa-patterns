import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

import { createRestClient } from '../src/client';
import { registerMaskProfiles } from '../src/mask';
import type { ReportAttacher, RestResponse } from '../src/types';

// Minimal test server that echoes requests and serves canned responses.
let server: http.Server;
let baseUrl: string;

before(async () => {
  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json');

      if (req.url === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ok' }));
        return;
      }

      if (req.url === '/echo') {
        res.writeHead(200);
        res.end(
          JSON.stringify({
            method: req.method,
            headers: req.headers,
            body: body ? JSON.parse(body) : null
          })
        );
        return;
      }

      // /users/:id
      const userMatch = req.url?.match(/^\/users\/(.+?)(\?.*)?$/);
      if (userMatch && req.method === 'GET') {
        res.writeHead(200);
        res.end(
          JSON.stringify({ userId: userMatch[1], name: 'Test User' })
        );
        return;
      }

      if (req.url === '/users' && req.method === 'POST') {
        const parsed = body ? JSON.parse(body) : {};
        res.writeHead(201);
        res.end(JSON.stringify({ userId: 'new-1', ...parsed }));
        return;
      }

      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not Found' }));
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const addr = server.address();
  if (typeof addr === 'object' && addr) {
    baseUrl = `http://127.0.0.1:${addr.port}`;
  }
});

after(() => {
  server.close();
});

describe('RestClient', () => {
  it('GET /health', async () => {
    const api = createRestClient({ baseUrl });
    const res = await api.get<{ status: string }>('/health');
    assert.equal(res.status, 200);
    assert.equal(res.ok, true);
    assert.equal(res.data.status, 'ok');
    assert.equal(typeof res.elapsed, 'number');
  });

  it('GET with path params', async () => {
    const api = createRestClient({ baseUrl });
    const res = await api.get<{ userId: string }>('/users/{userId}', {
      params: { userId: '42' }
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.userId, '42');
  });

  it('GET with query params', async () => {
    const api = createRestClient({ baseUrl });
    const res = await api.get('/users/{userId}', {
      params: { userId: '1' },
      query: { include: 'profile', verbose: true }
    });
    assert.equal(res.status, 200);
    assert.match(res.request.url, /\?include=profile&verbose=true$/);
  });

  it('POST with JSON body', async () => {
    const api = createRestClient({ baseUrl });
    const res = await api.post<{ userId: string; name: string }>('/users', {
      body: { name: 'John', role: 'Engineer' }
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.name, 'John');
    assert.equal(res.data.userId, 'new-1');
  });

  it('PUT / PATCH / DELETE return responses', async () => {
    const api = createRestClient({ baseUrl });

    const put = await api.put<{ method: string }>('/echo', { body: { action: 'update' } });
    assert.equal(put.data.method, 'PUT');

    const patch = await api.patch<{ method: string }>('/echo', { body: { action: 'patch' } });
    assert.equal(patch.data.method, 'PATCH');

    const del = await api.delete<{ method: string }>('/echo');
    assert.equal(del.data.method, 'DELETE');
  });

  it('sends default headers', async () => {
    const api = createRestClient({
      baseUrl,
      headers: { 'X-Test-Run-Id': 'run-001' }
    });
    const res = await api.get<{ headers: Record<string, string> }>('/echo');
    assert.equal(res.data.headers['x-test-run-id'], 'run-001');
  });

  it('sends bearer auth header', async () => {
    const api = createRestClient({
      baseUrl,
      auth: { bearer: 'my-jwt-token' }
    });
    const res = await api.get<{ headers: Record<string, string> }>('/echo');
    assert.equal(res.data.headers['authorization'], 'Bearer my-jwt-token');
  });

  it('sends basic auth header', async () => {
    const api = createRestClient({
      baseUrl,
      auth: { basic: { username: 'user', password: 'pass' } }
    });
    const res = await api.get<{ headers: Record<string, string> }>('/echo');
    const expected = `Basic ${Buffer.from('user:pass').toString('base64')}`;
    assert.equal(res.data.headers['authorization'], expected);
  });

  it('interpolates variables in body and headers', async () => {
    const api = createRestClient({ baseUrl });
    const res = await api.post<{
      headers: Record<string, string>;
      body: { name: string };
    }>('/echo', {
      headers: { 'X-Correlation-Id': '{corrId}' },
      body: { name: '{userName}' },
      variables: { corrId: 'corr-abc', userName: 'Jane' }
    });
    assert.equal(res.data.headers['x-correlation-id'], 'corr-abc');
    assert.equal(res.data.body.name, 'Jane');
  });

  it('per-request baseUrl override', async () => {
    const api = createRestClient({ baseUrl: 'http://will-not-be-used:9999' });
    const res = await api.get('/health', { baseUrl });
    assert.equal(res.status, 200);
  });
});

describe('RestClient logging', () => {
  it('attaches masked log entry to report', async () => {
    const attachments: { name: string; content: string }[] = [];
    const attacher: ReportAttacher = {
      attach(name, content) {
        attachments.push({ name, content });
      }
    };

    const api = createRestClient({
      baseUrl,
      logging: {
        attacher,
        mask: { password: 'asterisk', token: 'asterisk' }
      }
    });

    await api.post('/echo', {
      body: { username: 'john', password: 'hunter2' }
    });

    assert.equal(attachments.length, 1);
    assert.match(attachments[0].name, /POST \/echo \[200\]/);
    assert.match(attachments[0].content, /password.*\*\*\*/);
    assert.doesNotMatch(attachments[0].content, /hunter2/);
    assert.match(attachments[0].content, /john/);
  });

  it('resolves mask profile by name', async () => {
    registerMaskProfiles({
      testprofile: { secret: 'asterisk' }
    });

    const attachments: { name: string; content: string }[] = [];
    const api = createRestClient({
      baseUrl,
      logging: {
        attacher: { attach(n, c) { attachments.push({ name: n, content: c }); } },
        mask: 'testprofile'
      }
    });

    await api.post('/echo', { body: { secret: 'top-secret', visible: 'ok' } });

    assert.doesNotMatch(attachments[0].content, /top-secret/);
    assert.match(attachments[0].content, /visible.*ok/);
  });

  it('per-request mask override', async () => {
    const attachments: { content: string }[] = [];
    const api = createRestClient({
      baseUrl,
      logging: {
        attacher: { attach(_, c) { attachments.push({ content: c }); } },
        mask: { password: 'asterisk' }
      }
    });

    // Override to no masking for this request
    await api.post('/echo', {
      body: { password: 'visible-now' },
      logging: { mask: false }
    });

    assert.match(attachments[0].content, /visible-now/);
  });

  it('does not log when no attacher configured', async () => {
    const api = createRestClient({ baseUrl });
    // Should not throw
    const res = await api.get('/health');
    assert.equal(res.status, 200);
  });
});
