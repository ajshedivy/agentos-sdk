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

  constructor(
    status: number,
    message: string,
    requestId?: string,
    headers?: Record<string, string>,
  ) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.message = message;
    this.requestId = requestId;
    this.headers = headers;
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
  ) {
    super(400, message, requestId, headers);
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
  ) {
    super(401, message, requestId, headers);
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
  ) {
    super(404, message, requestId, headers);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
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
  ) {
    super(422, message, requestId, headers);
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
  ) {
    super(429, message, requestId, headers);
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
  ) {
    super(500, message, requestId, headers);
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
  ) {
    super(503, message, requestId, headers);
    this.name = "RemoteServerUnavailableError";
    Object.setPrototypeOf(this, RemoteServerUnavailableError.prototype);
  }
}

/**
 * Creates the appropriate error class based on HTTP status code.
 *
 * @param status - HTTP status code
 * @param message - Error message
 * @param requestId - Optional request ID from response headers
 * @param headers - Optional response headers
 * @returns The appropriate APIError subclass instance
 */
export function createErrorFromResponse(
  status: number,
  message: string,
  requestId?: string,
  headers?: Record<string, string>,
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
      // For other 5xx errors, use InternalServerError
      if (status >= 500) {
        return new InternalServerError(message, requestId, headers);
      }
      // For unrecognized status codes, use generic APIError
      return new APIError(status, message, requestId, headers);
  }
}
