// Pluggable HTTP transport layer.
// Default uses built-in fetch (zero deps). Swap for mTLS, proxy, or custom.
import https from 'node:https';
import http from 'node:http';

import type { TlsOptions, Transport } from './types';

export const defaultTransport: Transport = (url, init) => fetch(url, init);

/**
 * Creates a transport that uses Node's https.Agent for custom TLS options.
 * Supports mTLS (client certificates), custom CA bundles, and self-signed certs.
 *
 * Usage:
 *   const api = createRestClient({
 *     baseUrl: 'https://api.internal.corp',
 *     transport: createTlsTransport({
 *       cert: fs.readFileSync('client.pem'),
 *       key: fs.readFileSync('client-key.pem'),
 *       ca: fs.readFileSync('ca-bundle.pem'),
 *     })
 *   });
 */
export function createTlsTransport(tlsOptions: TlsOptions): Transport {
  const agent = new https.Agent({
    cert: tlsOptions.cert,
    key: tlsOptions.key,
    ca: tlsOptions.ca,
    pfx: tlsOptions.pfx,
    passphrase: tlsOptions.passphrase,
    rejectUnauthorized: tlsOptions.rejectUnauthorized ?? true
  });

  return (url: string, init: RequestInit): Promise<Response> => {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const isHttps = parsed.protocol === 'https:';
      const mod = isHttps ? https : http;

      const headers: Record<string, string> = {};
      if (init.headers) {
        const h = init.headers;
        if (h instanceof Headers) {
          h.forEach((value, key) => {
            headers[key] = value;
          });
        } else if (Array.isArray(h)) {
          for (const [key, value] of h) {
            headers[key] = value;
          }
        } else {
          Object.assign(headers, h);
        }
      }

      const reqOptions: https.RequestOptions = {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: `${parsed.pathname}${parsed.search}`,
        method: init.method ?? 'GET',
        headers,
        agent: isHttps ? agent : undefined
      };

      const req = mod.request(reqOptions, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString();
          const responseHeaders = new Headers();
          for (const [key, value] of Object.entries(res.headers)) {
            if (value) {
              responseHeaders.set(
                key,
                Array.isArray(value) ? value.join(', ') : value
              );
            }
          }
          resolve(
            new Response(body, {
              status: res.statusCode ?? 200,
              statusText: res.statusMessage ?? '',
              headers: responseHeaders
            })
          );
        });
      });

      req.on('error', reject);

      if (init.signal) {
        init.signal.addEventListener('abort', () => {
          req.destroy();
          reject(new DOMException('The operation was aborted', 'AbortError'));
        });
      }

      if (init.body) {
        req.write(init.body);
      }
      req.end();
    });
  };
}
