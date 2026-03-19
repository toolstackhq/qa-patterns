// Wraps the native fetch Response into a typed RestResponse.
import type { RestResponse, SchemaLike } from './types';

export async function buildResponse<T>(
  fetchResponse: Response,
  elapsed: number,
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: unknown;
  }
): Promise<RestResponse<T>> {
  const text = await fetchResponse.text();

  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    data = text as unknown as T;
  }

  const headers: Record<string, string> = {};
  fetchResponse.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    status: fetchResponse.status,
    statusText: fetchResponse.statusText,
    headers,
    data,
    text,
    ok: fetchResponse.ok,
    elapsed,
    request,
    validate<S>(schema: SchemaLike<S>): S {
      return schema.parse(data);
    }
  };
}
