/**
 * AgentOS TypeScript SDK
 *
 * @packageDocumentation
 */

// Version
export const VERSION = "0.2.0";

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
export {
  AgentStream,
  RunEventType,
  AgentEventType,
  TeamEventType,
  WorkflowEventType,
  RunStatus,
} from "./streaming";
export type {
  // Base types
  StreamEvent,
  BaseEvent,
  BaseAgentRunEvent,
  BaseTeamRunEvent,
  BaseWorkflowRunEvent,
  EventMap,
  // Domain unions
  AgentRunEvent,
  TeamRunEvent,
  WorkflowRunEvent,
  AllRunEvents,
  // Agent event interfaces (29)
  RunStartedEvent,
  RunContentEvent,
  RunContentCompletedEvent,
  RunIntermediateContentEvent,
  RunCompletedEvent,
  RunPausedEvent,
  RunContinuedEvent,
  RunErrorEvent,
  RunCancelledEvent,
  RunOutputEvent,
  PreHookStartedEvent,
  PreHookCompletedEvent,
  PostHookStartedEvent,
  PostHookCompletedEvent,
  ReasoningStartedEvent,
  ReasoningStepEvent,
  ReasoningCompletedEvent,
  ToolCallStartedEvent,
  ToolCallCompletedEvent,
  UpdatingMemoryEvent,
  MemoryUpdateStartedEvent,
  MemoryUpdateCompletedEvent,
  SessionSummaryStartedEvent,
  SessionSummaryCompletedEvent,
  ParserModelResponseStartedEvent,
  ParserModelResponseCompletedEvent,
  OutputModelResponseStartedEvent,
  OutputModelResponseCompletedEvent,
  CustomEvent,
  // Team event interfaces (25)
  TeamRunStartedEvent,
  TeamRunContentEvent,
  TeamRunContentCompletedEvent,
  TeamRunIntermediateContentEvent,
  TeamRunCompletedEvent,
  TeamRunErrorEvent,
  TeamRunCancelledEvent,
  TeamPreHookStartedEvent,
  TeamPreHookCompletedEvent,
  TeamPostHookStartedEvent,
  TeamPostHookCompletedEvent,
  TeamToolCallStartedEvent,
  TeamToolCallCompletedEvent,
  TeamReasoningStartedEvent,
  TeamReasoningStepEvent,
  TeamReasoningCompletedEvent,
  TeamMemoryUpdateStartedEvent,
  TeamMemoryUpdateCompletedEvent,
  TeamSessionSummaryStartedEvent,
  TeamSessionSummaryCompletedEvent,
  TeamParserModelResponseStartedEvent,
  TeamParserModelResponseCompletedEvent,
  TeamOutputModelResponseStartedEvent,
  TeamOutputModelResponseCompletedEvent,
  TeamCustomEvent,
  // Workflow event interfaces (18)
  WorkflowStartedEvent,
  WorkflowCompletedEvent,
  WorkflowCancelledEvent,
  StepStartedEvent,
  StepCompletedEvent,
  StepOutputEvent,
  ConditionExecutionStartedEvent,
  ConditionExecutionCompletedEvent,
  ParallelExecutionStartedEvent,
  ParallelExecutionCompletedEvent,
  LoopExecutionStartedEvent,
  LoopIterationStartedEvent,
  LoopIterationCompletedEvent,
  LoopExecutionCompletedEvent,
  RouterExecutionStartedEvent,
  RouterExecutionCompletedEvent,
  StepsExecutionStartedEvent,
  StepsExecutionCompletedEvent,
  // Supporting types
  Metrics,
  RunMetrics,
  ToolCallData,
  ToolExecution,
  ReasoningStep,
  ExtraData,
  ImageData,
  VideoData,
  AudioData,
  ResponseAudio,
  ReasoningMessage,
  ReferenceData,
  Reference,
  RunResponseFields,
  SessionSummary,
  StepOutput,
  StepMetrics,
  WorkflowMetrics,
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
