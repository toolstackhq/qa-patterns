// Retry with configurable backoff for flaky or rate-limited endpoints.
import type { RetryConfig } from './types';

function calculateDelay(
  attempt: number,
  baseDelay: number,
  backoff?: 'linear' | 'exponential'
): number {
  switch (backoff) {
    case 'exponential':
      return baseDelay * 2 ** attempt;
    case 'linear':
      return baseDelay * (attempt + 1);
    default:
      return baseDelay;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps a fetch call with retry logic.
 * Retries on network errors and on response status codes in `retryOn`.
 * Each attempt gets a fresh fetch() call so response bodies are not consumed.
 */
export async function executeWithRetry(
  fn: () => Promise<Response>,
  config: RetryConfig
): Promise<Response> {
  const retryOn = new Set(config.retryOn ?? [502, 503, 504]);
  const baseDelay = config.delayMs ?? 1000;

  let lastError: unknown;
  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt <= config.attempts; attempt++) {
    try {
      const response = await fn();

      if (!retryOn.has(response.status) || attempt === config.attempts) {
        return response;
      }

      // Consume body to free resources before retrying
      await response.text();
      lastResponse = response;
    } catch (error) {
      lastError = error;
      if (attempt === config.attempts) throw error;
    }

    if (attempt < config.attempts) {
      await sleep(calculateDelay(attempt, baseDelay, config.backoff));
    }
  }

  // Fallback — should not reach here in normal flow
  if (lastResponse) return lastResponse;
  throw lastError;
}
