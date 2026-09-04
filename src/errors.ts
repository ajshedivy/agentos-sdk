/**
 * Machine-readable error identity carried by agno >= 3.0 error bodies.
 *
 * agno 3.0 emits `{ detail, error_id, error_type }` for typed failures
 * (`AgnoError` / `AgnoHTTPException`, e.g. `migration_required_error`).
 * Plain `HTTPException` bodies and older servers emit `{ detail }` only,
 * so both fields are optional.
 */
export interface APIErrorOptions {
  /** Stable error identifier, e.g. `"migration_required_error"` */
  errorId?: string;
  /**
   * Server-side error type. agno currently sets it to the same snake_case
   * value as `error_id` (e.g. `"migration_required_error"`); branch on
   * `errorId` and treat this as informational.
   */
  errorType?: string;
}

/**
 * Base API error class for all AgentOS SDK errors.
 *
 * Use `instanceof` to catch specific error types:
 * @example
 * ```typescript
 * try {
 *   await client.agents.run(agentId, { input: "Hello" });
 * } catch (error) {
 *   if (error instanceof AuthenticationError) {
 *     // Handle 401 - invalid or missing API key
 *   } else if (error instanceof RateLimitError) {
 *     // Handle 429 - too many requests
 *   } else if (error instanceof APIError) {
 *     // Handle all other API errors
 *   }
 * }
 * ```
 */
export class APIError extends Error {
  readonly status: number;
  readonly message: string;
  readonly requestId?: string;
  readonly headers?: Record<string, string>;
  /** Stable error identifier from the response body (agno >= 3.0), if any */
  readonly errorId?: string;
  /** Server-side error type from the response body (agno >= 3.0), if any; see `APIErrorOptions` */
  readonly errorType?: string;

  constructor(
    status: number,
    message: string,
    requestId?: string,
    headers?: Record<string, string>,
    options?: APIErrorOptions,
  ) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.message = message;
    this.requestId = requestId;
    this.headers = headers;
    this.errorId = options?.errorId;
    this.errorType = options?.errorType;
    // Critical for instanceof to work with ES5 compilation
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

/**
 * Thrown when the request is malformed or contains invalid data.
 * HTTP status code: 400
 */
export class BadRequestError extends APIError {
  constructor(
    message: string,
    requestId?: string,
    headers?: Record<string, string>,
    options?: APIErrorOptions,
  ) {
    super(400, message, requestId, headers, options);
    this.name = "BadRequestError";
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * Thrown when authentication fails (invalid or missing API key).
 * HTTP status code: 401
 */
export class AuthenticationError extends APIError {
  constructor(
    message: string,
    requestId?: string,
    headers?: Record<string, string>,
    options?: APIErrorOptions,
  ) {
    super(401, message, requestId, headers, options);
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Thrown when the requested resource is not found.
 * HTTP status code: 404
 */
export class NotFoundError extends APIError {
  constructor(
    message: string,
    requestId?: string,
    headers?: Record<string, string>,
    options?: APIErrorOptions,
  ) {
    super(404, message, requestId, headers, options);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Thrown when the request conflicts with the current server state
 * (e.g. a reused idempotency key, or continuing a run that is not paused).
 * HTTP status code: 409
 */
export class ConflictError extends APIError {
  constructor(
    message: string,
    requestId?: string,
    headers?: Record<string, string>,
    options?: APIErrorOptions,
  ) {
    super(409, message, requestId, headers, options);
    this.name = "ConflictError";
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Thrown when the request body is valid JSON but contains semantic errors.
 * HTTP status code: 422
 */
export class UnprocessableEntityError extends APIError {
  constructor(
    message: string,
    requestId?: string,
    headers?: Record<string, string>,
    options?: APIErrorOptions,
  ) {
    super(422, message, requestId, headers, options);
    this.name = "UnprocessableEntityError";
    Object.setPrototypeOf(this, UnprocessableEntityError.prototype);
  }
}

/**
 * Thrown when rate limits are exceeded.
 * HTTP status code: 429
 */
export class RateLimitError extends APIError {
  constructor(
    message: string,
    requestId?: string,
    headers?: Record<string, string>,
    options?: APIErrorOptions,
  ) {
    super(429, message, requestId, headers, options);
    this.name = "RateLimitError";
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Thrown when the server encounters an internal error.
 * HTTP status code: 500
 */
export class InternalServerError extends APIError {
  constructor(
    message: string,
    requestId?: string,
    headers?: Record<string, string>,
    options?: APIErrorOptions,
  ) {
    super(500, message, requestId, headers, options);
    this.name = "InternalServerError";
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * Thrown when the remote server is unavailable (e.g., maintenance, overloaded).
 * HTTP status code: 503
 */
export class RemoteServerUnavailableError extends APIError {
  constructor(
    message: string,
    requestId?: string,
    headers?: Record<string, string>,
    options?: APIErrorOptions,
  ) {
    super(503, message, requestId, headers, options);
    this.name = "RemoteServerUnavailableError";
    Object.setPrototypeOf(this, RemoteServerUnavailableError.prototype);
  }
}

/**
 * Thrown by `client.database.migrateAll()` when the server answers
 * 207 Multi-Status: at least one database failed to migrate. The route
 * migrates every database it can and reports the failures per database
 * id instead of failing the whole request, so a 207 satisfies `response.ok`
 * and is surfaced as this error from the parsed body rather than by status.
 *
 * @example
 * ```typescript
 * try {
 *   await client.database.migrateAll();
 * } catch (error) {
 *   if (error instanceof MigrationFailedError) {
 *     for (const [dbId, reason] of Object.entries(error.failed)) {
 *       console.error(`${dbId}: ${reason}`);
 *     }
 *   }
 * }
 * ```
 */
export class MigrationFailedError extends APIError {
  /** Database id -> failure reason, for every database that failed */
  readonly failed: Record<string, string>;
  /** Remote database ids the server skipped (migrate them on their own AgentOS) */
  readonly skipped?: string[];

  constructor(
    message: string,
    failed: Record<string, string>,
    skipped?: string[],
  ) {
    super(207, message);
    this.name = "MigrationFailedError";
    this.failed = failed;
    this.skipped = skipped;
    Object.setPrototypeOf(this, MigrationFailedError.prototype);
  }
}

/**
 * Creates the appropriate error class based on HTTP status code.
 *
 * @param status - HTTP status code
 * @param message - Error message
 * @param requestId - Optional request ID from response headers
 * @param headers - Optional response headers
 * @param options - Optional `error_id` / `error_type` from the response body
 * @returns The appropriate APIError subclass instance
 */
export function createErrorFromResponse(
  status: number,
  message: string,
  requestId?: string,
  headers?: Record<string, string>,
  options?: APIErrorOptions,
): APIError {
  switch (status) {
    case 400:
      return new BadRequestError(message, requestId, headers, options);
    case 401:
      return new AuthenticationError(message, requestId, headers, options);
    case 404:
      return new NotFoundError(message, requestId, headers, options);
    case 409:
      return new ConflictError(message, requestId, headers, options);
    case 422:
      return new UnprocessableEntityError(message, requestId, headers, options);
    case 429:
      return new RateLimitError(message, requestId, headers, options);
    case 500:
      return new InternalServerError(message, requestId, headers, options);
    case 503:
      return new RemoteServerUnavailableError(
        message,
        requestId,
        headers,
        options,
      );
    default:
      // For other 5xx errors, use InternalServerError
      if (status >= 500) {
        return new InternalServerError(message, requestId, headers, options);
      }
      // For unrecognized status codes, use generic APIError
      return new APIError(status, message, requestId, headers, options);
  }
}
