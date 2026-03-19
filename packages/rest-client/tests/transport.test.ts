import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

import { createRestClient } from '../src/client';
import { createTlsTransport } from '../src/transport';
import type { Transport } from '../src/types';

let server: http.Server;
let baseUrl: string;

before(async () => {
  server = http.createServer((_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({ source: 'test-server' }));
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

describe('custom transport', () => {
  it('uses a custom transport function instead of fetch', async () => {
    const calls: string[] = [];

    const spyTransport: Transport = async (url, init) => {
      calls.push(`${init.method} ${url}`);
      return fetch(url, init);
    };

    const api = createRestClient({
      baseUrl,
      transport: spyTransport
    });

    const res = await api.get('/test');
    assert.equal(res.status, 200);
    assert.equal(calls.length, 1);
    assert.match(calls[0], /GET.*\/test$/);
  });

  it('createTlsTransport works over plain HTTP too', async () => {
    // TLS transport falls back to http module for non-https URLs
    const transport = createTlsTransport({
      rejectUnauthorized: false
    });

    const api = createRestClient({ baseUrl, transport });
    const res = await api.get<{ source: string }>('/test');
    assert.equal(res.status, 200);
    assert.equal(res.data.source, 'test-server');
  });

  it('TLS transport sends POST body correctly', async () => {
    const echoServer = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify({ echo: JSON.parse(body) }));
      });
    });

    await new Promise<void>((resolve) => {
      echoServer.listen(0, '127.0.0.1', () => resolve());
    });

    const addr = echoServer.address();
    const echoUrl =
      typeof addr === 'object' && addr
        ? `http://127.0.0.1:${addr.port}`
        : '';

    const transport = createTlsTransport({ rejectUnauthorized: false });
    const api = createRestClient({ baseUrl: echoUrl, transport });

    const res = await api.post<{ echo: { name: string } }>('/data', {
      body: { name: 'test' }
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.echo.name, 'test');

    echoServer.close();
  });
});
