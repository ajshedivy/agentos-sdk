import { backOff } from "exponential-backoff";
import { APIError, RateLimitError, createErrorFromResponse } from "./errors";
import type { RequestOptions } from "./types";

/**
 * Type guard to check if value is a non-null object.
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Parse error body from a failed response.
 * Attempts to extract a message from common JSON formats,
 * falling back to text or statusText.
 */
async function parseErrorBody(response: Response): Promise<string> {
  try {
    const json: unknown = await response.json();

    // Try common message formats
    if (isObject(json)) {
      if (typeof json.message === "string") {
        return json.message;
      }
      if (typeof json.error === "string") {
        return json.error;
      }
      if (isObject(json.error) && typeof json.error.message === "string") {
        return json.error.message;
      }
      if (typeof json.detail === "string") {
        return json.detail;
      }
    }

    // Return stringified JSON if no message field found
    return JSON.stringify(json);
  } catch {
    // JSON parsing failed, try text
    try {
      const text = await response.text();
      if (text) {
        return text;
      }
    } catch {
      // Text parsing also failed
    }

    // Fall back to statusText
    return response.statusText || `HTTP ${response.status}`;
  }
}

/**
 * Extract headers as a plain object from Response headers.
 */
function extractHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * Perform a single HTTP request without retry logic.
 *
 * @param url - The URL to request
 * @param options - Request options (method, body, headers, signal)
 * @returns The parsed JSON response
 * @throws {APIError} For non-2xx responses
 *
 * @example
 * ```typescript
 * const data = await request<{ id: string }>('https://api.example.com/resource', {
 *   method: 'POST',
 *   body: { name: 'test' },
 * });
 * ```
 */
export async function request<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {}, signal } = options;

  // Don't set Content-Type for FormData - fetch auto-sets with boundary
  const fetchHeaders: Record<string, string> =
    body instanceof FormData
      ? { ...headers }
      : { "Content-Type": "application/json", ...headers };

  const fetchOptions: globalThis.RequestInit = {
    method,
    headers: fetchHeaders,
    signal,
  };

  if (body !== undefined) {
    // Pass FormData directly, stringify other body types
    fetchOptions.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  const requestId = response.headers.get("x-request-id") ?? undefined;
  const responseHeaders = extractHeaders(response.headers);

  if (!response.ok) {
    const message = await parseErrorBody(response);
    throw createErrorFromResponse(
      response.status,
      message,
      requestId,
      responseHeaders,
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Perform an HTTP request with automatic retry for transient failures.
 *
 * Retries on:
 * - 429 (Rate Limit) errors
 * - 5xx (Server) errors
 * - Network errors (TypeError)
 *
 * Does NOT retry on:
 * - 4xx client errors (except 429)
 * - Timeout errors (converted to APIError)
 *
 * @param url - The URL to request
 * @param options - Request options (method, body, headers)
 * @param maxRetries - Maximum number of retry attempts (default: 2)
 * @param timeoutMs - Request timeout in milliseconds (default: 30000)
 * @returns The parsed JSON response
 * @throws {APIError} For non-2xx responses or timeout
 *
 * @example
 * ```typescript
 * const data = await requestWithRetry<{ id: string }>(
 *   'https://api.example.com/resource',
 *   { method: 'GET' },
 *   3,
 *   10000
 * );
 * ```
 */
export async function requestWithRetry<T>(
  url: string,
  options: RequestOptions = {},
  maxRetries = 2,
  timeoutMs = 30000,
): Promise<T> {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);

  // Combine with any existing signal
  const combinedSignal = options.signal
    ? anySignal([options.signal, timeoutSignal])
    : timeoutSignal;

  const requestOptions: RequestOptions = {
    ...options,
    signal: combinedSignal,
  };

  try {
    return await backOff(() => request<T>(url, requestOptions), {
      numOfAttempts: maxRetries + 1, // First attempt + retries
      startingDelay: 500,
      timeMultiple: 2,
      maxDelay: 30000,
      jitter: "full",
      retry: (error: unknown) => {
        // Retry on rate limit errors (429)
        if (error instanceof RateLimitError) {
          return true;
        }

        // Retry on server errors (5xx)
        if (error instanceof APIError && error.status >= 500) {
          return true;
        }

        // Retry on network errors (fetch throws TypeError for network failures)
        if (error instanceof TypeError) {
          return true;
        }

        // Do not retry on other client errors (4xx)
        return false;
      },
    });
  } catch (error) {
    // Convert timeout errors to APIError
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new APIError(0, `Request timed out after ${timeoutMs}ms`);
    }

    // Convert AbortError (from AbortSignal) to APIError
    if (error instanceof Error && error.name === "AbortError") {
      throw new APIError(0, `Request timed out after ${timeoutMs}ms`);
    }

    // Re-throw APIError subclasses as-is
    if (error instanceof APIError) {
      throw error;
    }

    // Re-throw network errors after retry exhaustion
    if (error instanceof TypeError) {
      throw new APIError(0, `Network error: ${error.message}`);
    }

    // Re-throw unknown errors
    throw error;
  }
}

/**
 * Combines multiple AbortSignals into one that aborts when any of them abort.
 */
function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }

    signal.addEventListener(
      "abort",
      () => {
        controller.abort(signal.reason);
      },
      { once: true },
    );
  }

  return controller.signal;
}
