/**
 * AgentOS TypeScript SDK
 *
 * @packageDocumentation
 */

import { version } from "../package.json";

/**
 * SDK version, read from `package.json` at build time so it cannot drift
 * from the published package version. Sent as `User-Agent: agentos-sdk/<VERSION>`.
 */
export const VERSION: string = version;

// Client
export { AgentOSClient } from "./client";

// Types
export type {
  AgentOSClientOptions,
  HealthStatus,
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
  // Agent event interfaces (37)
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
  ReasoningContentDeltaEvent,
  ReasoningCompletedEvent,
  ToolCallStartedEvent,
  ToolCallCompletedEvent,
  ToolCallErrorEvent,
  UpdatingMemoryEvent,
  MemoryUpdateStartedEvent,
  MemoryUpdateCompletedEvent,
  SessionSummaryStartedEvent,
  SessionSummaryCompletedEvent,
  ParserModelResponseStartedEvent,
  ParserModelResponseCompletedEvent,
  OutputModelResponseStartedEvent,
  OutputModelResponseCompletedEvent,
  ModelRequestStartedEvent,
  ModelRequestCompletedEvent,
  CompressionStartedEvent,
  CompressionCompletedEvent,
  FollowupsStartedEvent,
  FollowupsCompletedEvent,
  CustomEvent,
  // Team event interfaces (40)
  TeamRunStartedEvent,
  TeamRunContentEvent,
  TeamRunContentCompletedEvent,
  TeamRunIntermediateContentEvent,
  TeamRunCompletedEvent,
  TeamRunPausedEvent,
  TeamRunContinuedEvent,
  TeamRunErrorEvent,
  TeamRunCancelledEvent,
  TeamPreHookStartedEvent,
  TeamPreHookCompletedEvent,
  TeamPostHookStartedEvent,
  TeamPostHookCompletedEvent,
  TeamToolCallStartedEvent,
  TeamToolCallCompletedEvent,
  TeamToolCallErrorEvent,
  TeamReasoningStartedEvent,
  TeamReasoningStepEvent,
  TeamReasoningContentDeltaEvent,
  TeamReasoningCompletedEvent,
  TeamMemoryUpdateStartedEvent,
  TeamMemoryUpdateCompletedEvent,
  TeamSessionSummaryStartedEvent,
  TeamSessionSummaryCompletedEvent,
  TeamParserModelResponseStartedEvent,
  TeamParserModelResponseCompletedEvent,
  TeamOutputModelResponseStartedEvent,
  TeamOutputModelResponseCompletedEvent,
  TeamModelRequestStartedEvent,
  TeamModelRequestCompletedEvent,
  TeamCompressionStartedEvent,
  TeamCompressionCompletedEvent,
  TeamFollowupsStartedEvent,
  TeamFollowupsCompletedEvent,
  TeamTaskIterationStartedEvent,
  TeamTaskIterationCompletedEvent,
  TeamTaskStateUpdatedEvent,
  TeamTaskCreatedEvent,
  TeamTaskUpdatedEvent,
  TeamCustomEvent,
  // Workflow event interfaces (30)
  WorkflowStartedEvent,
  WorkflowCompletedEvent,
  WorkflowPausedEvent,
  WorkflowErrorEvent,
  WorkflowCancelledEvent,
  WorkflowAgentStartedEvent,
  WorkflowAgentCompletedEvent,
  StepStartedEvent,
  StepCompletedEvent,
  StepPausedEvent,
  StepContinuedEvent,
  StepExecutorPausedEvent,
  StepExecutorContinuedEvent,
  StepOutputReviewEvent,
  StepErrorEvent,
  StepOutputEvent,
  ConditionExecutionStartedEvent,
  ConditionExecutionCompletedEvent,
  ConditionPausedEvent,
  ParallelExecutionStartedEvent,
  ParallelExecutionCompletedEvent,
  LoopExecutionStartedEvent,
  LoopIterationStartedEvent,
  LoopIterationCompletedEvent,
  LoopExecutionCompletedEvent,
  RouterExecutionStartedEvent,
  RouterExecutionCompletedEvent,
  RouterPausedEvent,
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
  // HITL supporting types
  UserInputField,
  UserFeedbackOption,
  UserFeedbackQuestion,
  RunRequirement,
  TeamTaskData,
  StepInput,
  StepRequirement,
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
