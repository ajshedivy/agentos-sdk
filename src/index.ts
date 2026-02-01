/**
 * AgentOS TypeScript SDK
 *
 * @packageDocumentation
 */

// Version
export const VERSION = "0.1.1";

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
  AgentRunResult,
  ContinueOptions,
  RunOptions,
  StreamRunOptions,
} from "./resources/agents";

export { TeamsResource } from "./resources/teams";
export type {
  TeamContinueOptions,
  TeamRunOptions,
  TeamRunResult,
  TeamStreamRunOptions,
} from "./resources/teams";

export { WorkflowsResource } from "./resources/workflows";
export type {
  WorkflowContinueOptions,
  WorkflowRunOptions,
  WorkflowRunResult,
  WorkflowStreamRunOptions,
} from "./resources/workflows";

export { SessionsResource } from "./resources/sessions";
export type {
  ListSessionsOptions,
  CreateSessionOptions,
} from "./resources/sessions";

export { MemoriesResource } from "./resources/memories";
export type {
  ListMemoriesOptions,
  CreateMemoryOptions,
  UpdateMemoryOptions,
} from "./resources/memories";

export { TracesResource } from "./resources/traces";
export type { ListTracesOptions } from "./resources/traces";

export { MetricsResource } from "./resources/metrics";
export type { GetMetricsOptions } from "./resources/metrics";

export { KnowledgeResource } from "./resources/knowledge";
export type {
  UploadOptions,
  ListKnowledgeOptions,
  SearchOptions,
  UpdateContentOptions,
} from "./resources/knowledge";

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

// File input types (Phase 6)
export type {
  FileInput,
  Image,
  Audio,
  Video,
  FileType,
} from "./types/files";

// File utilities (Phase 6)
export { normalizeFileInput } from "./utils/files";
