import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  interpolatePath,
  interpolateString,
  interpolateDeep,
  buildQueryString
} from '../src/interpolate';

describe('interpolatePath', () => {
  it('replaces path params', () => {
    assert.equal(
      interpolatePath('/users/{userId}/posts/{postId}', {
        userId: '42',
        postId: '7'
      }),
      '/users/42/posts/7'
    );
  });

  it('encodes special characters', () => {
    assert.equal(
      interpolatePath('/search/{query}', { query: 'hello world' }),
      '/search/hello%20world'
    );
  });

  it('leaves unmatched placeholders intact', () => {
    assert.equal(
      interpolatePath('/users/{userId}', {}),
      '/users/{userId}'
    );
  });

  it('returns path unchanged when no params provided', () => {
    assert.equal(interpolatePath('/health'), '/health');
  });
});

describe('interpolateString', () => {
  it('replaces variables in a string', () => {
    assert.equal(
      interpolateString('Bearer {token}', { token: 'abc' }),
      'Bearer abc'
    );
  });

  it('handles multiple variables', () => {
    assert.equal(
      interpolateString('{greeting} {name}!', {
        greeting: 'Hello',
        name: 'World'
      }),
      'Hello World!'
    );
  });
});

describe('interpolateDeep', () => {
  it('interpolates nested objects', () => {
    const result = interpolateDeep(
      { user: { name: '{name}', meta: { tag: '{tag}' } } },
      { name: 'John', tag: 'vip' }
    );
    assert.deepEqual(result, {
      user: { name: 'John', meta: { tag: 'vip' } }
    });
  });

  it('interpolates arrays', () => {
    const result = interpolateDeep(['{a}', '{b}'], { a: '1', b: '2' });
    assert.deepEqual(result, ['1', '2']);
  });

  it('passes non-string primitives through', () => {
    const result = interpolateDeep({ count: 42, active: true }, { x: 'y' });
    assert.deepEqual(result, { count: 42, active: true });
  });
});

describe('buildQueryString', () => {
  it('builds query from params', () => {
    const qs = buildQueryString({ page: 1, limit: 10, active: true });
    assert.equal(qs, '?page=1&limit=10&active=true');
  });

  it('returns empty string for no params', () => {
    assert.equal(buildQueryString(), '');
    assert.equal(buildQueryString({}), '');
  });
});
