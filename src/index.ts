/**
 * AgentOS TypeScript SDK
 *
 * @packageDocumentation
 */

// Version
export const VERSION = "0.1.0";

// Client
export { AgentOSClient } from "./client";

// Types
export type {
  AgentOSClientOptions,
  HealthStatus,
  OSConfig,
  RequestOptions,
} from "./types";

// Errors
export {
  APIError,
  AuthenticationError,
  BadRequestError,
  InternalServerError,
  NotFoundError,
  RateLimitError,
  RemoteServerUnavailableError,
  UnprocessableEntityError,
} from "./errors";
