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

// Resource classes
export { AgentsResource } from "./resources/agents";
export type {
  ContinueOptions,
  RunOptions,
  StreamRunOptions,
} from "./resources/agents";

// Generated types (re-export useful types)
export type { components, paths } from "./generated/types";

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

// Streaming
export { AgentStream } from "./streaming";
export type {
  AgentRunEvent,
  BaseEvent,
  MemoryUpdateCompletedEvent,
  MemoryUpdateStartedEvent,
  RunCompletedEvent,
  RunContentEvent,
  RunStartedEvent,
} from "./streaming";
