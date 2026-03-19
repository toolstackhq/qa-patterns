// Zoro-inspired field masking engine with per-field strategies.
// Masks are applied only to logged output — actual data is never altered.
import type { MaskConfig, MaskRules, MaskStrategy } from './types';

const ASTERISK = '***';

let registeredProfiles: Record<string, MaskRules | false> = {};

export function registerMaskProfiles(
  profiles: Record<string, MaskRules | false>
): void {
  registeredProfiles = { ...profiles };
}

export function resolveMaskConfig(mask: MaskConfig | undefined): MaskRules | false {
  if (mask === undefined || mask === false) return false;

  if (typeof mask === 'string') {
    const profile = registeredProfiles[mask];
    if (profile === undefined) {
      throw new Error(
        `Unknown mask profile: "${mask}". ` +
          `Register profiles with registerMaskProfiles(). ` +
          `Available: ${Object.keys(registeredProfiles).join(', ') || '(none)'}`
      );
    }
    return profile;
  }

  return mask;
}

export function applyMaskRule(value: string, rule: MaskStrategy): string {
  if (rule === 'asterisk') return ASTERISK;

  if (typeof rule === 'string' && rule.startsWith('partial:')) {
    const [, startStr, endStr] = rule.split(':');
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    if (end === 0) return value.slice(0, start) + ASTERISK;
    return value.slice(0, start) + ASTERISK + value.slice(end);
  }

  if (typeof rule === 'object' && 'pattern' in rule) {
    return value.replace(rule.pattern, rule.replace);
  }

  if (typeof rule === 'object' && 'fixed' in rule) {
    return rule.fixed;
  }

  return ASTERISK;
}

function findRule(
  rules: MaskRules,
  key: string
): MaskStrategy | undefined {
  const lowerKey = key.toLowerCase();
  for (const [ruleKey, strategy] of Object.entries(rules)) {
    if (ruleKey.toLowerCase() === lowerKey) return strategy;
  }
  return undefined;
}

function isPrimitive(
  value: unknown
): value is string | number | boolean {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

export function maskDeep(value: unknown, rules: MaskRules | false): unknown {
  if (!rules) return value;

  if (Array.isArray(value)) {
    return value.map((item) => maskDeep(item, rules));
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => {
        const rule = findRule(rules, key);
        if (rule && isPrimitive(val)) {
          return [key, applyMaskRule(String(val), rule)];
        }
        return [key, maskDeep(val, rules)];
      })
    );
  }

  return value;
}

export function maskHeaders(
  headers: Record<string, string>,
  rules: MaskRules | false
): Record<string, string> {
  if (!rules) return { ...headers };

  return Object.fromEntries(
    Object.entries(headers).map(([key, val]) => {
      const rule = findRule(rules, key);
      return rule ? [key, applyMaskRule(val, rule)] : [key, val];
    })
  );
}
