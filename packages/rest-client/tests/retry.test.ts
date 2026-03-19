import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

import { createRestClient } from '../src/client';

let server: http.Server;
let baseUrl: string;
let requestCount: number;

before(async () => {
  requestCount = 0;
  server = http.createServer((_req, res) => {
    requestCount += 1;
    res.setHeader('Content-Type', 'application/json');

    // First 2 requests return 503, then 200
    if (requestCount <= 2) {
      res.writeHead(503);
      res.end(JSON.stringify({ error: 'Service Unavailable' }));
    } else {
      res.writeHead(200);
      res.end(JSON.stringify({ attempt: requestCount }));
    }
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

describe('retry', () => {
  it('retries on 503 and succeeds on third attempt', async () => {
    requestCount = 0;

    const api = createRestClient({
      baseUrl,
      retry: {
        attempts: 3,
        delayMs: 10,
        retryOn: [503]
      }
    });

    const res = await api.get<{ attempt: number }>('/data');
    assert.equal(res.status, 200);
    assert.equal(res.data.attempt, 3);
    assert.equal(requestCount, 3);
  });

  it('returns last response when all retries exhausted', async () => {
    requestCount = 0;

    const api = createRestClient({
      baseUrl,
      retry: {
        attempts: 1,
        delayMs: 10,
        retryOn: [503]
      }
    });

    const res = await api.get('/data');
    // 2 attempts (initial + 1 retry), both 503
    assert.equal(res.status, 503);
    assert.equal(requestCount, 2);
  });

  it('does not retry on non-retryable status codes', async () => {
    requestCount = 0;

    const api = createRestClient({
      baseUrl,
      retry: {
        attempts: 3,
        delayMs: 10,
        retryOn: [500] // only retry 500, not 503
      }
    });

    const res = await api.get('/data');
    // First request returns 503, not in retryOn, so no retry
    assert.equal(res.status, 503);
    assert.equal(requestCount, 1);
  });

  it('uses exponential backoff', async () => {
    requestCount = 0;

    const api = createRestClient({
      baseUrl,
      retry: {
        attempts: 3,
        delayMs: 10,
        backoff: 'exponential',
        retryOn: [503]
      }
    });

    const start = performance.now();
    await api.get('/data');
    const elapsed = performance.now() - start;

    // exponential: 10ms (2^0) + 20ms (2^1) = 30ms minimum
    assert.ok(elapsed >= 25, `Expected >= 25ms, got ${elapsed}ms`);
  });
});
