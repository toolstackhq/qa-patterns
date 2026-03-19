import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

import { createRestClient } from '../src/client';
import type { SchemaLike } from '../src/types';

let server: http.Server;
let baseUrl: string;

before(async () => {
  server = http.createServer((_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({ id: '42', name: 'John', age: 30 }));
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

// A minimal schema that matches the SchemaLike<T> interface (like Zod's .parse)
function createSchema<T>(
  validator: (data: unknown) => T
): SchemaLike<T> {
  return {
    parse(data: unknown): T {
      return validator(data);
    }
  };
}

describe('response.validate', () => {
  it('validates response data against a schema', async () => {
    const UserSchema = createSchema((data) => {
      const obj = data as Record<string, unknown>;
      if (typeof obj.id !== 'string') throw new Error('id must be a string');
      if (typeof obj.name !== 'string')
        throw new Error('name must be a string');
      return { id: obj.id as string, name: obj.name as string };
    });

    const api = createRestClient({ baseUrl });
    const res = await api.get('/user');

    const user = res.validate(UserSchema);
    assert.equal(user.id, '42');
    assert.equal(user.name, 'John');
  });

  it('throws when data does not match schema', async () => {
    const StrictSchema = createSchema((data) => {
      const obj = data as Record<string, unknown>;
      if (!('email' in obj)) {
        throw new Error('email is required');
      }
      return obj;
    });

    const api = createRestClient({ baseUrl });
    const res = await api.get('/user');

    assert.throws(() => res.validate(StrictSchema), /email is required/);
  });

  it('works with real Zod-like parse interface', async () => {
    // Simulates Zod's z.object().parse() behavior
    const ZodLikeSchema = {
      parse(data: unknown) {
        const obj = data as Record<string, unknown>;
        if (typeof obj.id !== 'string' || typeof obj.name !== 'string') {
          throw new Error('Validation failed');
        }
        return { id: obj.id, name: obj.name, age: obj.age as number };
      }
    };

    const api = createRestClient({ baseUrl });
    const res = await api.get('/user');

    const parsed = res.validate(ZodLikeSchema);
    assert.equal(parsed.id, '42');
    assert.equal(parsed.age, 30);
  });
});
