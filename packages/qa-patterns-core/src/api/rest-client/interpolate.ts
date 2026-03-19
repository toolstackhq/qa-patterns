// Postman-style {variable} interpolation for URLs, headers, and bodies.

export function interpolatePath(
  path: string,
  params?: Record<string, string>
): string {
  if (!params) return path;
  return path.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (key in params) return encodeURIComponent(params[key]);
    return match;
  });
}

export function interpolateString(
  value: string,
  variables?: Record<string, string>
): string {
  if (!variables) return value;
  return value.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (key in variables) return variables[key];
    return match;
  });
}

export function interpolateDeep(
  value: unknown,
  variables?: Record<string, string>
): unknown {
  if (!variables) return value;
  if (typeof value === 'string') return interpolateString(value, variables);
  if (Array.isArray(value)) {
    return value.map((item) => interpolateDeep(item, variables));
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, interpolateDeep(v, variables)])
    );
  }
  return value;
}

export function buildQueryString(
  query?: Record<string, string | number | boolean>
): string {
  if (!query || Object.keys(query).length === 0) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    params.append(key, String(value));
  }
  return `?${params.toString()}`;
}
