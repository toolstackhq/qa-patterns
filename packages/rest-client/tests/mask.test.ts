import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  applyMaskRule,
  maskDeep,
  maskHeaders,
  registerMaskProfiles,
  resolveMaskConfig
} from '../src/mask';

describe('applyMaskRule', () => {
  it('asterisk replaces entire value', () => {
    assert.equal(applyMaskRule('secret123', 'asterisk'), '***');
  });

  it('partial keeps start and end', () => {
    assert.equal(
      applyMaskRule('4111222233334444', 'partial:4:-4'),
      '4111***4444'
    );
  });

  it('partial with end=0 keeps only start', () => {
    assert.equal(applyMaskRule('sk-live-abc123', 'partial:3:0'), 'sk-***');
  });

  it('pattern applies regex replacement', () => {
    assert.equal(
      applyMaskRule('123-45-6789', {
        pattern: /(\d{3})-(\d{2})-(\d{4})/,
        replace: '***-**-$3'
      }),
      '***-**-6789'
    );
  });

  it('fixed replaces with exact string', () => {
    assert.equal(
      applyMaskRule('Bearer eyJhbG...', { fixed: '[BEARER]' }),
      '[BEARER]'
    );
  });
});

describe('maskDeep', () => {
  const rules = {
    password: 'asterisk' as const,
    token: 'asterisk' as const,
    creditCard: 'partial:4:-4' as const
  };

  it('masks top-level fields', () => {
    const result = maskDeep(
      { username: 'john', password: 'hunter2' },
      rules
    );
    assert.deepEqual(result, { username: 'john', password: '***' });
  });

  it('masks deeply nested fields', () => {
    const result = maskDeep(
      {
        body: {
          account: {
            details: {
              logins: [
                { meta: { token: 'abc123', timestamp: '2026-01-01' } }
              ]
            }
          }
        }
      },
      rules
    );

    const expected = {
      body: {
        account: {
          details: {
            logins: [
              { meta: { token: '***', timestamp: '2026-01-01' } }
            ]
          }
        }
      }
    };
    assert.deepEqual(result, expected);
  });

  it('applies partial masking on nested card numbers', () => {
    const result = maskDeep(
      { billing: { creditCard: '4111222233334444' } },
      rules
    );
    assert.deepEqual(result, { billing: { creditCard: '4111***4444' } });
  });

  it('is case-insensitive for field names', () => {
    const result = maskDeep({ PASSWORD: 'secret' }, rules);
    assert.deepEqual(result, { PASSWORD: '***' });
  });

  it('returns value unchanged when rules is false', () => {
    const data = { password: 'secret' };
    assert.deepEqual(maskDeep(data, false), data);
  });

  it('handles arrays of objects', () => {
    const result = maskDeep(
      [{ password: 'a' }, { password: 'b' }, { name: 'c' }],
      rules
    );
    assert.deepEqual(result, [
      { password: '***' },
      { password: '***' },
      { name: 'c' }
    ]);
  });
});

describe('maskHeaders', () => {
  it('masks matching header keys case-insensitively', () => {
    const rules = { authorization: { fixed: '[BEARER]' } as const };
    const headers = {
      Authorization: 'Bearer eyJhbG...',
      'Content-Type': 'application/json'
    };
    const result = maskHeaders(headers, rules);
    assert.deepEqual(result, {
      Authorization: '[BEARER]',
      'Content-Type': 'application/json'
    });
  });
});

describe('mask profiles', () => {
  beforeEach(() => {
    registerMaskProfiles({});
  });

  it('resolves a registered profile by name', () => {
    registerMaskProfiles({
      healthcare: { ssn: 'asterisk' }
    });
    const rules = resolveMaskConfig('healthcare');
    assert.deepEqual(rules, { ssn: 'asterisk' });
  });

  it('throws for unknown profile', () => {
    assert.throws(
      () => resolveMaskConfig('nonexistent'),
      /Unknown mask profile: "nonexistent"/
    );
  });

  it('returns false for false/undefined', () => {
    assert.equal(resolveMaskConfig(false), false);
    assert.equal(resolveMaskConfig(undefined), false);
  });

  it('passes through inline rules object', () => {
    const rules = { password: 'asterisk' as const };
    assert.deepEqual(resolveMaskConfig(rules), rules);
  });
});
