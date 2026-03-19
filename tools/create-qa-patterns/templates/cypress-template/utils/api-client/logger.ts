// Auto-logging with report attachment (Allure / Playwright / console).
import type { MaskRules, ReportAttacher } from './types';
import { maskDeep, maskHeaders } from './mask';

interface LogEntry {
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody?: unknown;
  status: number;
  statusText: string;
  responseHeaders: Record<string, string>;
  responseBody?: unknown;
  elapsed: number;
}

function indent(text: string, prefix: string): string {
  return text
    .split('\n')
    .map((line, i) => (i === 0 ? line : `${prefix}${line}`))
    .join('\n');
}

export function formatLogEntry(
  entry: LogEntry,
  rules: MaskRules | false
): string {
  const reqHeaders = maskHeaders(entry.requestHeaders, rules);
  const reqBody =
    entry.requestBody != null ? maskDeep(entry.requestBody, rules) : undefined;
  const resHeaders = maskHeaders(entry.responseHeaders, rules);
  const resBody =
    entry.responseBody != null
      ? maskDeep(entry.responseBody, rules)
      : undefined;

  const lines: string[] = [
    `${entry.method} ${entry.url}`,
    '',
    'Request:',
    `  Headers: ${indent(JSON.stringify(reqHeaders, null, 2), '  ')}`
  ];

  if (reqBody !== undefined) {
    lines.push(
      `  Body: ${indent(JSON.stringify(reqBody, null, 2), '  ')}`
    );
  }

  lines.push('');
  lines.push(
    `Response: ${entry.status} ${entry.statusText} (${entry.elapsed}ms)`
  );
  lines.push(
    `  Headers: ${indent(JSON.stringify(resHeaders, null, 2), '  ')}`
  );

  if (resBody !== undefined) {
    lines.push(
      `  Body: ${indent(JSON.stringify(resBody, null, 2), '  ')}`
    );
  }

  return lines.join('\n');
}

export async function attachToReport(
  attacher: ReportAttacher,
  entry: LogEntry,
  rules: MaskRules | false
): Promise<void> {
  const content = formatLogEntry(entry, rules);
  let pathname: string;
  try {
    pathname = new URL(entry.url).pathname;
  } catch {
    pathname = entry.url;
  }
  const name = `${entry.method} ${pathname} [${entry.status}]`;
  await attacher.attach(name, content, 'text/plain');
}
