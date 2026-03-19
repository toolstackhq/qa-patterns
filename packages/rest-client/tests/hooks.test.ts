import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

import { createRestClient } from '../src/client';
import type { RequestContext, RestResponse } from '../src/types';

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
      res.writeHead(200);
      res.end(
        JSON.stringify({
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: body ? JSON.parse(body) : null
        })
      );
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

describe('hooks', () => {
  it('beforeRequest can inject headers', async () => {
    const api = createRestClient({
      baseUrl,
      hooks: {
        beforeRequest: (ctx: RequestContext) => ({
          ...ctx,
          headers: {
            ...ctx.headers,
            'X-Injected': 'by-hook'
          }
        })
      }
    });

    const res = await api.get<{
      headers: Record<string, string>;
    }>('/echo');

    assert.equal(res.data.headers['x-injected'], 'by-hook');
  });

  it('beforeRequest can modify URL', async () => {
    const api = createRestClient({
      baseUrl,
      hooks: {
        beforeRequest: (ctx: RequestContext) => ({
          ...ctx,
          url: ctx.url.replace('/original', '/redirected')
        })
      }
    });

    const res = await api.get<{ url: string }>('/original');
    assert.equal(res.data.url, '/redirected');
    assert.equal(res.request.url, `${baseUrl}/redirected`);
  });

  it('afterResponse can enrich response data', async () => {
    const api = createRestClient({
      baseUrl,
      hooks: {
        afterResponse: <T>(
          response: RestResponse<T>,
          _ctx: RequestContext
        ) => ({
          ...response,
          data: {
            ...(response.data as Record<string, unknown>),
            enriched: true
          } as T
        })
      }
    });

    const res = await api.get<{ method: string; enriched: boolean }>('/echo');
    assert.equal(res.data.enriched, true);
    assert.equal(res.data.method, 'GET');
  });

  it('async beforeRequest hook works', async () => {
    const api = createRestClient({
      baseUrl,
      hooks: {
        beforeRequest: async (ctx: RequestContext) => {
          // Simulate async token fetch
          await new Promise((resolve) => setTimeout(resolve, 5));
          return {
            ...ctx,
            headers: { ...ctx.headers, Authorization: 'Bearer async-token' }
          };
        }
      }
    });

    const res = await api.get<{
      headers: Record<string, string>;
    }>('/echo');

    assert.equal(res.data.headers['authorization'], 'Bearer async-token');
  });

  it('both hooks run in correct order', async () => {
    const order: string[] = [];

    const api = createRestClient({
      baseUrl,
      hooks: {
        beforeRequest: (ctx: RequestContext) => {
          order.push('before');
          return ctx;
        },
        afterResponse: <T>(
          response: RestResponse<T>,
          _ctx: RequestContext
        ) => {
          order.push('after');
          return response;
        }
      }
    });

    await api.get('/echo');
    assert.deepEqual(order, ['before', 'after']);
  });
});
