// Public types for the REST client library.

// -- Masking ------------------------------------------------------------------

export type MaskStrategy =
  | 'asterisk'
  | `partial:${number}:${number}`
  | { pattern: RegExp; replace: string }
  | { fixed: string };

export type MaskRules = Record<string, MaskStrategy>;

export type MaskConfig = string | MaskRules | false;

// -- Logging ------------------------------------------------------------------

export interface ReportAttacher {
  attach(
    name: string,
    content: string,
    contentType: string
  ): void | Promise<void>;
}

export interface LoggingConfig {
  attacher?: ReportAttacher;
  mask?: MaskConfig;
}

// -- Auth ---------------------------------------------------------------------

export interface AuthConfig {
  bearer?: string;
  basic?: { username: string; password: string };
}

// -- Transport ----------------------------------------------------------------

export type Transport = (
  url: string,
  init: RequestInit
) => Promise<Response>;

export interface TlsOptions {
  cert?: string | Buffer;
  key?: string | Buffer;
  ca?: string | Buffer;
  pfx?: string | Buffer;
  passphrase?: string;
  rejectUnauthorized?: boolean;
}

// -- Retry --------------------------------------------------------------------

export interface RetryConfig {
  attempts: number;
  delayMs?: number;
  backoff?: 'linear' | 'exponential';
  retryOn?: number[];
}

// -- Hooks --------------------------------------------------------------------

export interface RequestContext {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
}

export interface Hooks {
  beforeRequest?: (
    context: RequestContext
  ) => RequestContext | Promise<RequestContext>;
  afterResponse?: <T>(
    response: RestResponse<T>,
    context: RequestContext
  ) => RestResponse<T> | Promise<RestResponse<T>>;
}

// -- Schema validation --------------------------------------------------------

export interface SchemaLike<T> {
  parse(data: unknown): T;
}

// -- Client config ------------------------------------------------------------

export interface RestClientConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
  auth?: AuthConfig;
  logging?: LoggingConfig;
  transport?: Transport;
  retry?: RetryConfig;
  hooks?: Hooks;
}

export interface RequestOptions {
  params?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  body?: unknown;
  variables?: Record<string, string>;
  baseUrl?: string;
  timeout?: number;
  logging?: { mask?: MaskConfig };
}

// -- Response -----------------------------------------------------------------

export interface RestResponse<T = unknown> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  text: string;
  ok: boolean;
  elapsed: number;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: unknown;
  };
  validate: <S>(schema: SchemaLike<S>) => S;
}
