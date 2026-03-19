// Core REST client — pluggable transport, retry, hooks, and masked logging.
import type {
  Hooks,
  MaskRules,
  RequestContext,
  RequestOptions,
  RestClientConfig,
  RestResponse,
  RetryConfig,
  Transport
} from './types';
import {
  buildQueryString,
  interpolateDeep,
  interpolatePath,
  interpolateString
} from './interpolate';
import { resolveMaskConfig } from './mask';
import { buildResponse } from './response';
import { attachToReport } from './logger';
import { defaultTransport } from './transport';
import { executeWithRetry } from './retry';

export class RestClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeout: number | undefined;
  private readonly auth: RestClientConfig['auth'];
  private readonly logging: RestClientConfig['logging'];
  private readonly resolvedMask: MaskRules | false;
  private readonly transport: Transport;
  private readonly retryConfig: RetryConfig | undefined;
  private readonly hooks: Hooks | undefined;

  constructor(config: RestClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.defaultHeaders = config.headers ?? {};
    this.timeout = config.timeout;
    this.auth = config.auth;
    this.logging = config.logging;
    this.resolvedMask = resolveMaskConfig(config.logging?.mask);
    this.transport = config.transport ?? defaultTransport;
    this.retryConfig = config.retry;
    this.hooks = config.hooks;
  }

  async get<T = unknown>(
    path: string,
    options?: RequestOptions
  ): Promise<RestResponse<T>> {
    return this.request<T>('GET', path, options);
  }

  async post<T = unknown>(
    path: string,
    options?: RequestOptions
  ): Promise<RestResponse<T>> {
    return this.request<T>('POST', path, options);
  }

  async put<T = unknown>(
    path: string,
    options?: RequestOptions
  ): Promise<RestResponse<T>> {
    return this.request<T>('PUT', path, options);
  }

  async patch<T = unknown>(
    path: string,
    options?: RequestOptions
  ): Promise<RestResponse<T>> {
    return this.request<T>('PATCH', path, options);
  }

  async delete<T = unknown>(
    path: string,
    options?: RequestOptions
  ): Promise<RestResponse<T>> {
    return this.request<T>('DELETE', path, options);
  }

  private async request<T>(
    method: string,
    path: string,
    options?: RequestOptions
  ): Promise<RestResponse<T>> {
    const base = options?.baseUrl?.replace(/\/$/, '') ?? this.baseUrl;
    const resolvedPath = interpolatePath(path, options?.params);
    const query = buildQueryString(options?.query);
    const url = `${base}${resolvedPath}${query}`;

    // Merge headers: defaults → per-request → auth
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...options?.headers
    };

    if (this.auth?.bearer) {
      headers['Authorization'] = `Bearer ${this.auth.bearer}`;
    } else if (this.auth?.basic) {
      const { username, password } = this.auth.basic;
      const encoded = Buffer.from(`${username}:${password}`).toString(
        'base64'
      );
      headers['Authorization'] = `Basic ${encoded}`;
    }

    // Interpolate variables in header values
    if (options?.variables) {
      for (const key of Object.keys(headers)) {
        headers[key] = interpolateString(headers[key], options.variables);
      }
    }

    // Build body (with variable interpolation)
    let rawBody: unknown;
    let fetchBody: string | undefined;
    if (options?.body !== undefined) {
      rawBody = interpolateDeep(options.body, options?.variables);
      fetchBody = JSON.stringify(rawBody);
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    // -- beforeRequest hook --
    let context: RequestContext = { method, url, headers, body: rawBody };
    if (this.hooks?.beforeRequest) {
      context = await this.hooks.beforeRequest(context);
    }

    // Build fetch options from (possibly mutated) context
    const fetchOptions: RequestInit = {
      method: context.method,
      headers: context.headers,
      body:
        context.body !== undefined
          ? JSON.stringify(context.body)
          : fetchBody
    };
    const timeout = options?.timeout ?? this.timeout;
    if (timeout) {
      fetchOptions.signal = AbortSignal.timeout(timeout);
    }

    // -- Execute (with optional retry) --
    const start = performance.now();
    const doFetch = () => this.transport(context.url, fetchOptions);
    const fetchResponse = this.retryConfig
      ? await executeWithRetry(doFetch, this.retryConfig)
      : await doFetch();
    const elapsed = Math.round(performance.now() - start);

    let response = await buildResponse<T>(fetchResponse, elapsed, {
      method: context.method,
      url: context.url,
      headers: context.headers,
      body: context.body ?? rawBody
    });

    // -- afterResponse hook --
    if (this.hooks?.afterResponse) {
      response = await this.hooks.afterResponse(response, context);
    }

    // -- Auto-log to report --
    await this.log(response, options);

    return response;
  }

  private async log<T>(
    response: RestResponse<T>,
    options?: RequestOptions
  ): Promise<void> {
    if (!this.logging?.attacher) return;

    const mask =
      options?.logging?.mask !== undefined
        ? resolveMaskConfig(options.logging.mask)
        : this.resolvedMask;

    await attachToReport(
      this.logging.attacher,
      {
        method: response.request.method,
        url: response.request.url,
        requestHeaders: response.request.headers,
        requestBody: response.request.body,
        status: response.status,
        statusText: response.statusText,
        responseHeaders: response.headers,
        responseBody: response.data,
        elapsed: response.elapsed
      },
      mask
    );
  }
}

export function createRestClient(config: RestClientConfig): RestClient {
  return new RestClient(config);
}
