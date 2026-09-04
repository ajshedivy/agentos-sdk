/**
 * Barrel export for all streaming event types.
 *
 * @packageDocumentation
 */

// Shared types and base events
export type {
  StreamEvent,
  BaseEvent,
  BaseAgentRunEvent,
  BaseTeamRunEvent,
  BaseWorkflowRunEvent,
  Metrics,
  RunMetrics,
  ToolCallData,
  ToolExecution,
  ReasoningStep,
  ExtraData,
  ReasoningMessage,
  ReferenceData,
  Reference,
  ImageData,
  VideoData,
  AudioData,
  ResponseAudio,
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
} from "./shared";
export { RunStatus } from "./shared";
export type { RunStatus as RunStatusType } from "./shared";

// Constants
export {
  AgentEventType,
  TeamEventType,
  WorkflowEventType,
  RunEventType,
} from "./constants";

// Agent events
export type {
  AgentRunEvent,
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
} from "./agent";

// Team events
export type {
  TeamRunEvent,
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
} from "./team";

// Workflow events
export type {
  WorkflowRunEvent,
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
} from "./workflow";

// ---------------------------------------------------------------------------
// Composite types
// ---------------------------------------------------------------------------

import type { AgentRunEvent } from "./agent";
import type { TeamRunEvent } from "./team";
import type { WorkflowRunEvent } from "./workflow";

/**
 * Union of all streaming events across agent, team, and workflow.
 *
 * @public
 */
export type AllRunEvents = AgentRunEvent | TeamRunEvent | WorkflowRunEvent;

/**
 * Map from event type string to its corresponding event interface.
 * Powers the generic `.on()` method for type-safe event handlers.
 *
 * @public
 */
export type EventMap = {
  [E in AllRunEvents as E["event"]]: Extract<
    AllRunEvents,
    { event: E["event"] }
  >;
};
