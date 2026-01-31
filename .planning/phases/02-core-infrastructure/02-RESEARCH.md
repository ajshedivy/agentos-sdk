# Phase 2: Core Infrastructure - Research

**Researched:** 2026-01-31
**Domain:** TypeScript HTTP client with authentication, typed errors, and retry logic
**Confidence:** HIGH

## Summary

Phase 2 builds the core HTTP client infrastructure for the AgentOS SDK. The standard approach uses **native fetch** (no external HTTP libraries) with a class-based client architecture following patterns established by OpenAI and Stripe SDKs. The client provides typed error classes for different HTTP status codes, Bearer token authentication (client-level or per-request), and automatic retry with exponential backoff for transient failures.

Research confirms that modern TypeScript SDK patterns favor: (1) a configuration object pattern for client instantiation with `baseUrl`, `timeout`, and optional auth, (2) a hierarchy of typed error classes extending a base `APIError` that preserves `instanceof` checks, (3) `AbortSignal.timeout()` for request timeouts (Baseline 2024), and (4) either built-in retry logic or the lightweight `exponential-backoff` package for retry mechanics.

The SDK will use native `fetch` exclusively (per PROJECT.md constraint: "minimize dependencies - prefer native fetch"). This aligns with the target runtime support (Node.js 18+, modern browsers) where fetch is universally available.

**Primary recommendation:** Build a fetch-based HTTP client class with typed error hierarchy, configuration object constructor pattern, and automatic retry using the exponential-backoff package (2KB, zero dependencies) for transient failures (429, 5xx, network errors).

## Standard Stack

The established libraries/tools for TypeScript HTTP clients with minimal dependencies:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Native fetch | Built-in | HTTP requests | No dependencies, available in Node 18+ and browsers, TypeScript types in lib.dom |
| AbortController/AbortSignal | Built-in | Timeouts, cancellation | Native API, AbortSignal.timeout() available since April 2024 |
| exponential-backoff | 3.x | Retry logic | 2KB, zero dependencies, configurable jitter, widely used |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | - | Minimal dependency philosophy - no supporting libraries needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native fetch | axios | More features but +40KB bundle, we want minimal dependencies |
| Native fetch | ky | Lighter than axios but still a dependency, native fetch sufficient |
| exponential-backoff | Hand-rolled retry | Package handles edge cases (jitter, max delay) we'd miss |
| exponential-backoff | Built-in retry | Would increase code complexity; package is tiny (2KB) and proven |

**Installation:**
```bash
npm install exponential-backoff
```

**Dev Dependencies:**
```bash
# Already installed from Phase 1
npm install -D typescript vitest @types/node
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── index.ts           # Re-exports AgentOSClient, errors, types
├── client.ts          # AgentOSClient class implementation
├── errors.ts          # Typed error class hierarchy
├── http.ts            # Low-level fetch wrapper with retry logic
└── types.ts           # Shared TypeScript types and interfaces
```

### Pattern 1: Configuration Object Constructor
**What:** Client accepts a configuration object with optional properties and sensible defaults
**When to use:** Always - provides flexibility and future extensibility
**Example:**
```typescript
// Source: OpenAI/Stripe SDK patterns
interface AgentOSClientOptions {
  baseUrl: string;
  apiKey?: string;           // Optional - can be set per-request
  timeout?: number;          // Default: 30000ms
  maxRetries?: number;       // Default: 2
  headers?: Record<string, string>;
}

class AgentOSClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: AgentOSClientOptions) {
    if (!options.baseUrl) {
      throw new Error('baseUrl is required');
    }
    this.baseUrl = options.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = options.apiKey;
    this.timeout = options.timeout ?? 30000;
    this.maxRetries = options.maxRetries ?? 2;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  }
}
```

### Pattern 2: Typed Error Class Hierarchy
**What:** Base APIError class with specific subclasses for each HTTP status code
**When to use:** Always - enables `instanceof` checks and typed error handling
**Example:**
```typescript
// Source: OpenAI SDK error pattern + TypeScript best practices
export class APIError extends Error {
  readonly status: number;
  readonly message: string;
  readonly requestId?: string;
  readonly headers?: Record<string, string>;

  constructor(
    status: number,
    message: string,
    requestId?: string,
    headers?: Record<string, string>
  ) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.message = message;
    this.requestId = requestId;
    this.headers = headers;
    // Critical for instanceof to work with ES5 compilation
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

export class BadRequestError extends APIError {
  constructor(message: string, requestId?: string, headers?: Record<string, string>) {
    super(400, message, requestId, headers);
    this.name = 'BadRequestError';
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string, requestId?: string, headers?: Record<string, string>) {
    super(401, message, requestId, headers);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

// ... NotFoundError (404), UnprocessableEntityError (422), etc.
```

### Pattern 3: Fetch Wrapper with Response Handling
**What:** Type-safe wrapper around fetch that handles JSON parsing and error responses
**When to use:** All HTTP requests in the client
**Example:**
```typescript
// Source: web.dev fetch error handling + TypeScript patterns
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

async function request<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers, signal } = options;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  // Extract request ID from headers (if present)
  const requestId = response.headers.get('x-request-id') ?? undefined;

  if (!response.ok) {
    const errorBody = await parseErrorBody(response);
    throw createErrorFromResponse(response.status, errorBody, requestId);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
```

### Pattern 4: Automatic Retry with Exponential Backoff
**What:** Retry transient failures (429, 5xx, network errors) with increasing delays
**When to use:** All API requests by default, configurable per-request
**Example:**
```typescript
// Source: exponential-backoff npm package
import { backOff } from 'exponential-backoff';

async function requestWithRetry<T>(
  url: string,
  options: RequestOptions,
  maxRetries: number
): Promise<T> {
  return backOff(
    () => request<T>(url, options),
    {
      numOfAttempts: maxRetries + 1, // +1 because first attempt counts
      startingDelay: 500,            // 500ms initial delay
      timeMultiple: 2,               // Double each time
      maxDelay: 30000,               // Cap at 30 seconds
      jitter: 'full',                // Add randomness to prevent thundering herd
      retry: (error: unknown) => {
        // Only retry on transient errors
        if (error instanceof APIError) {
          return error.status === 429 || error.status >= 500;
        }
        // Retry on network errors
        if (error instanceof TypeError) {
          return true;
        }
        return false;
      },
    }
  );
}
```

### Pattern 5: AbortSignal Timeout
**What:** Use AbortSignal.timeout() for request-level timeouts
**When to use:** All HTTP requests
**Example:**
```typescript
// Source: MDN AbortSignal.timeout documentation
async function requestWithTimeout<T>(
  url: string,
  options: RequestOptions,
  timeoutMs: number
): Promise<T> {
  const signal = AbortSignal.timeout(timeoutMs);

  try {
    return await request<T>(url, { ...options, signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new APIError(0, `Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
}
```

### Anti-Patterns to Avoid
- **Using axios for simple requests:** Native fetch is sufficient; axios adds 40KB+ to bundle
- **Forgetting Object.setPrototypeOf:** Custom error classes break `instanceof` without it (ES5 target)
- **Hardcoding retry logic:** Use configurable options with sensible defaults
- **Ignoring request IDs:** Always extract and include in error objects for debugging
- **Not handling empty responses:** 204 No Content needs special handling (no JSON body)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Exponential backoff | Simple setTimeout loop | `exponential-backoff` package | Handles jitter, max delay, attempt counting, error classification |
| Request timeout | Manual AbortController + setTimeout | `AbortSignal.timeout()` | Native API, automatic cleanup, proper error types |
| Error classification | Giant switch statement | Error class hierarchy with `instanceof` | Type-safe, extensible, IDE autocomplete |
| Header normalization | Manual string manipulation | Native `Headers` API | Handles case-insensitivity, iteration, merging |

**Key insight:** The exponential-backoff package is only 2KB with zero dependencies. Hand-rolling retry logic typically misses edge cases like jitter (preventing thundering herd), proper attempt counting, and configurable retry conditions. The small dependency is worth the robustness.

## Common Pitfalls

### Pitfall 1: Error Class instanceof Broken
**What goes wrong:** `error instanceof BadRequestError` returns false even when throwing BadRequestError
**Why it happens:** TypeScript compiling to ES5 breaks prototype chain for classes extending built-ins like Error
**How to avoid:** Add `Object.setPrototypeOf(this, ClassName.prototype)` immediately after `super()` in every error class constructor
**Warning signs:** Error handling switch statements not matching expected types, catch blocks not triggering

### Pitfall 2: Fetch Doesn't Throw on HTTP Errors
**What goes wrong:** 404/500 responses don't trigger catch blocks
**Why it happens:** fetch() only throws on network failures, not HTTP error status codes
**How to avoid:** Always check `response.ok` before parsing body, throw typed errors for non-2xx responses
**Warning signs:** Silent failures, undefined data, missing error logging

### Pitfall 3: JSON Parse Errors on Error Responses
**What goes wrong:** `response.json()` throws SyntaxError when server returns HTML error page
**Why it happens:** Some servers return HTML for errors, not JSON
**How to avoid:** Wrap JSON parsing in try/catch, fall back to response.text() for error message
**Warning signs:** Unhandled SyntaxError exceptions, cryptic error messages

### Pitfall 4: Retry on Non-Idempotent Requests
**What goes wrong:** POST/PUT requests get duplicated during retry
**Why it happens:** Retrying non-GET requests can cause duplicate side effects
**How to avoid:** Only auto-retry GET requests by default, or ensure idempotency keys are used
**Warning signs:** Duplicate resources created, double charges, inconsistent state

### Pitfall 5: AbortSignal.timeout Not Available
**What goes wrong:** `AbortSignal.timeout is not a function` error in older environments
**Why it happens:** AbortSignal.timeout() is Baseline 2024, may not exist in older browsers/Node versions
**How to avoid:** Check Node.js 18 minimum version (we target this), add fallback for edge cases
**Warning signs:** Runtime errors in tests or production, timeout not working

### Pitfall 6: Missing Request Headers Normalization
**What goes wrong:** Authorization header overwritten or duplicated
**Why it happens:** Headers can be case-insensitive but object keys are case-sensitive
**How to avoid:** Use native Headers API or normalize header keys to lowercase
**Warning signs:** Authentication failures, duplicate headers in requests

## Code Examples

Verified patterns from official sources:

### Complete Error Class Hierarchy
```typescript
// Source: OpenAI SDK pattern + TypeScript Error extension best practices

export class APIError extends Error {
  readonly status: number;
  readonly message: string;
  readonly requestId?: string;
  readonly headers?: Record<string, string>;

  constructor(
    status: number,
    message: string,
    requestId?: string,
    headers?: Record<string, string>
  ) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.message = message;
    this.requestId = requestId;
    this.headers = headers;
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

export class BadRequestError extends APIError {
  constructor(message: string, requestId?: string, headers?: Record<string, string>) {
    super(400, message, requestId, headers);
    this.name = 'BadRequestError';
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string, requestId?: string, headers?: Record<string, string>) {
    super(401, message, requestId, headers);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class NotFoundError extends APIError {
  constructor(message: string, requestId?: string, headers?: Record<string, string>) {
    super(404, message, requestId, headers);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class UnprocessableEntityError extends APIError {
  constructor(message: string, requestId?: string, headers?: Record<string, string>) {
    super(422, message, requestId, headers);
    this.name = 'UnprocessableEntityError';
    Object.setPrototypeOf(this, UnprocessableEntityError.prototype);
  }
}

export class RateLimitError extends APIError {
  constructor(message: string, requestId?: string, headers?: Record<string, string>) {
    super(429, message, requestId, headers);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class InternalServerError extends APIError {
  constructor(message: string, requestId?: string, headers?: Record<string, string>) {
    super(500, message, requestId, headers);
    this.name = 'InternalServerError';
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

export class RemoteServerUnavailableError extends APIError {
  constructor(message: string, requestId?: string, headers?: Record<string, string>) {
    super(503, message, requestId, headers);
    this.name = 'RemoteServerUnavailableError';
    Object.setPrototypeOf(this, RemoteServerUnavailableError.prototype);
  }
}
```

### Client Configuration and Constructor
```typescript
// Source: OpenAI/Stripe SDK configuration patterns

export interface AgentOSClientOptions {
  /**
   * Base URL for the AgentOS API (required)
   * @example "https://api.agentos.example.com"
   */
  baseUrl: string;

  /**
   * API key for Bearer token authentication (optional)
   * Can also be provided per-request via headers
   */
  apiKey?: string;

  /**
   * Request timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Maximum number of retry attempts for transient failures
   * @default 2
   */
  maxRetries?: number;

  /**
   * Additional headers to include in all requests
   */
  headers?: Record<string, string>;
}

export class AgentOSClient {
  readonly version = '0.1.0';

  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: AgentOSClientOptions) {
    if (!options.baseUrl) {
      throw new Error('baseUrl is required');
    }

    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.timeout = options.timeout ?? 30000;
    this.maxRetries = options.maxRetries ?? 2;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': `agentos-sdk/${this.version}`,
      ...options.headers,
    };
  }

  /**
   * Get OS configuration
   */
  async getConfig(): Promise<OSConfig> {
    return this.request<OSConfig>('GET', '/config');
  }

  /**
   * Check API health status
   */
  async health(): Promise<HealthStatus> {
    return this.request<HealthStatus>('GET', '/health');
  }

  private async request<T>(
    method: string,
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Implementation uses patterns from above
  }
}
```

### Error Response Parsing
```typescript
// Source: web.dev fetch error handling + Stripe pattern

interface ErrorResponseBody {
  message?: string;
  error?: string | { message?: string };
  detail?: string;
}

async function parseErrorBody(response: Response): Promise<string> {
  try {
    const body = await response.json() as ErrorResponseBody;
    // Handle various error response formats
    if (typeof body.message === 'string') return body.message;
    if (typeof body.error === 'string') return body.error;
    if (typeof body.error?.message === 'string') return body.error.message;
    if (typeof body.detail === 'string') return body.detail;
    return response.statusText;
  } catch {
    // JSON parsing failed, try text
    try {
      const text = await response.text();
      return text || response.statusText;
    } catch {
      return response.statusText;
    }
  }
}

function createErrorFromResponse(
  status: number,
  message: string,
  requestId?: string,
  headers?: Record<string, string>
): APIError {
  switch (status) {
    case 400:
      return new BadRequestError(message, requestId, headers);
    case 401:
      return new AuthenticationError(message, requestId, headers);
    case 404:
      return new NotFoundError(message, requestId, headers);
    case 422:
      return new UnprocessableEntityError(message, requestId, headers);
    case 429:
      return new RateLimitError(message, requestId, headers);
    case 500:
      return new InternalServerError(message, requestId, headers);
    case 503:
      return new RemoteServerUnavailableError(message, requestId, headers);
    default:
      if (status >= 500) {
        return new InternalServerError(message, requestId, headers);
      }
      return new APIError(status, message, requestId, headers);
  }
}
```

### Bearer Token Authentication
```typescript
// Source: OpenAI SDK auth pattern

private getHeaders(overrideHeaders?: Record<string, string>): Record<string, string> {
  const headers = { ...this.defaultHeaders };

  // Add Bearer token if API key is configured
  if (this.apiKey) {
    headers['Authorization'] = `Bearer ${this.apiKey}`;
  }

  // Apply per-request header overrides
  if (overrideHeaders) {
    Object.assign(headers, overrideHeaders);
  }

  return headers;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| axios/node-fetch | Native fetch | Node.js 18 (2022) | No HTTP library dependency needed |
| Manual AbortController + setTimeout | AbortSignal.timeout() | April 2024 (Baseline) | Cleaner timeout API |
| Custom error.code strings | Typed error class hierarchy | TypeScript 2.0+ (2016) | Type-safe error handling |
| Giant try/catch blocks | Error class instanceof checks | Always | Cleaner, more maintainable code |
| Manual retry loops | exponential-backoff package | 2020+ | Handles edge cases (jitter, etc.) |

**Deprecated/outdated:**
- **node-fetch package:** No longer needed; native fetch available in Node 18+
- **axios for simple use cases:** Overkill for API clients targeting modern runtimes
- **isomorphic-fetch:** Polyfill no longer needed for Node 18+ / modern browsers
- **Custom Promise.race timeout:** AbortSignal.timeout() is cleaner and handles cleanup

## Open Questions

Things that couldn't be fully resolved:

1. **Retry on POST/PUT requests**
   - What we know: GET requests are safe to retry; POST/PUT may cause duplicates
   - What's unclear: Whether AgentOS API uses idempotency keys for POST requests
   - Recommendation: Default to only retrying GET requests; allow override via options. Document that users should ensure idempotency for POST retries.

2. **Error response body format**
   - What we know: Common formats are `{ message: "..." }`, `{ error: "..." }`, `{ detail: "..." }`
   - What's unclear: Exact format AgentOS API returns
   - Recommendation: Implement flexible parser that checks multiple fields. Validate against real API responses during Phase 3.

3. **Request ID header name**
   - What we know: OpenAI uses `x-request-id`, common patterns include `request-id`, `x-amzn-requestid`
   - What's unclear: What header AgentOS API uses
   - Recommendation: Check for `x-request-id` by default; make configurable if needed.

## Sources

### Primary (HIGH confidence)
- [MDN AbortSignal.timeout()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) - Native timeout API documentation
- [MDN AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) - Request cancellation API
- [web.dev Fetch Error Handling](https://web.dev/articles/fetch-api-error-handling) - Comprehensive error handling patterns
- [OpenAI Node SDK](https://github.com/openai/openai-node) - Error class hierarchy, retry logic patterns
- [Stripe Node SDK](https://github.com/stripe/stripe-node) - Error handling, configuration patterns
- [exponential-backoff npm](https://www.npmjs.com/package/exponential-backoff) - Retry library API documentation

### Secondary (MEDIUM confidence)
- [TypeScript Error Class Extension](https://bobbyhadz.com/blog/typescript-extend-error-class) - Object.setPrototypeOf pattern
- [Building Type-Safe API Clients](https://dev.to/limacodes/building-a-type-safe-api-client-in-typescript-beyond-axios-vs-fetch-4a3i) - Architecture patterns
- [TypeScript SDK Best Practices](https://www.buildwithmatija.com/blog/how-to-build-typescript-sdk-from-rest) - Configuration object patterns

### Tertiary (LOW confidence)
- WebSearch results for "TypeScript HTTP client patterns 2026" - General ecosystem patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Native fetch verified via MDN, exponential-backoff verified via npm/GitHub
- Architecture: HIGH - Patterns verified from OpenAI and Stripe SDKs (industry standard)
- Error handling: HIGH - Object.setPrototypeOf pattern verified via TypeScript documentation
- Retry logic: HIGH - exponential-backoff API verified via npm documentation
- Pitfalls: MEDIUM - Based on documented TypeScript issues and fetch behavior

**Research date:** 2026-01-31
**Valid until:** ~2026-03-31 (30 days - stable domain, fetch API mature)
