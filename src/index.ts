/**
 * AgentOS TypeScript SDK
 *
 * @packageDocumentation
 */

// Version
export const VERSION = "0.4.0";

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
  ListAgentRunsOptions,
  RunOptions,
  StreamRunOptions,
} from "./resources/agents";

export { ApprovalsResource } from "./resources/approvals";
export type {
  CountApprovalsOptions,
  ListApprovalsOptions,
  ResolveApprovalOptions,
} from "./resources/approvals";

export { AuthResource } from "./resources/auth";
export type {
  CreateConnectionOptions,
  CreateKeyOptions,
  UpdateConnectionOptions,
} from "./resources/auth";

export { ComponentsResource } from "./resources/components";
export type {
  CreateComponentOptions,
  CreateConfigOptions,
  ListComponentsOptions,
  UpdateComponentOptions,
  UpdateConfigOptions,
} from "./resources/components";

export { DatabaseResource } from "./resources/database";
export type { MigrateOptions } from "./resources/database";

export { EvalsResource } from "./resources/evals";
export type {
  CreateEvalOptions,
  DeleteEvalsOptions,
  ListEvalsOptions,
  UpdateEvalOptions,
} from "./resources/evals";

export { KnowledgeResource } from "./resources/knowledge";
export type {
  ListKnowledgeOptions,
  ListSourceFilesOptions,
  ListSourcesOptions,
  SearchOptions,
  UpdateContentOptions,
  UploadOptions,
  UploadRemoteOptions,
} from "./resources/knowledge";

export { MemoriesResource } from "./resources/memories";
export type {
  CreateMemoryOptions,
  DeleteAllMemoriesOptions,
  GetMemoryStatsOptions,
  GetTopicsOptions,
  ListMemoriesOptions,
  OptimizeMemoriesOptions,
  UpdateMemoryOptions,
} from "./resources/memories";

export { MetricsResource } from "./resources/metrics";
export type { GetMetricsOptions } from "./resources/metrics";

export { ModelsResource } from "./resources/models";

export { RegistryResource } from "./resources/registry";
export type { ListRegistryOptions } from "./resources/registry";

export { SchedulesResource } from "./resources/schedules";
export type {
  CreateScheduleOptions,
  ListSchedulesOptions,
  UpdateScheduleOptions,
} from "./resources/schedules";

export { SessionsResource } from "./resources/sessions";
export type {
  CreateSessionOptions,
  DeleteAllSessionsOptions,
  ListSessionsOptions,
  UpdateSessionOptions,
} from "./resources/sessions";

export { TeamsResource } from "./resources/teams";
export type {
  ListTeamRunsOptions,
  TeamContinueOptions,
  TeamRunOptions,
  TeamRunResult,
  TeamStreamRunOptions,
} from "./resources/teams";

export { TracesResource } from "./resources/traces";
export type {
  GetTraceStatsOptions,
  ListTracesOptions,
  SearchTracesOptions,
} from "./resources/traces";

export { WorkflowsResource } from "./resources/workflows";
export type {
  WorkflowContinueOptions,
  WorkflowRunOptions,
  WorkflowRunResult,
  WorkflowStreamRunOptions,
} from "./resources/workflows";

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
