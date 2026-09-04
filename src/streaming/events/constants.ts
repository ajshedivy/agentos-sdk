/**
 * Event type constants for agent, team, and workflow streaming events.
 *
 * @packageDocumentation
 */

/**
 * Constants for agent streaming event types (37 events).
 *
 * Covers every value of agno 3.0's `RunEvent` enum (`agno/run/agent.py`)
 * plus the legacy `UpdatingMemory` / `RunOutput` names.
 *
 * @public
 */
export const AgentEventType = {
  // Core lifecycle
  RunStarted: "RunStarted",
  RunContent: "RunContent",
  RunContentCompleted: "RunContentCompleted",
  RunIntermediateContent: "RunIntermediateContent",
  RunCompleted: "RunCompleted",
  RunPaused: "RunPaused",
  RunContinued: "RunContinued",
  RunError: "RunError",
  RunCancelled: "RunCancelled",
  RunOutput: "RunOutput",

  // Hooks
  PreHookStarted: "PreHookStarted",
  PreHookCompleted: "PreHookCompleted",
  PostHookStarted: "PostHookStarted",
  PostHookCompleted: "PostHookCompleted",

  // Reasoning
  ReasoningStarted: "ReasoningStarted",
  ReasoningStep: "ReasoningStep",
  ReasoningContentDelta: "ReasoningContentDelta",
  ReasoningCompleted: "ReasoningCompleted",

  // Tool calls
  ToolCallStarted: "ToolCallStarted",
  ToolCallCompleted: "ToolCallCompleted",
  ToolCallError: "ToolCallError",

  // Memory
  UpdatingMemory: "UpdatingMemory",
  MemoryUpdateStarted: "MemoryUpdateStarted",
  MemoryUpdateCompleted: "MemoryUpdateCompleted",

  // Session summary
  SessionSummaryStarted: "SessionSummaryStarted",
  SessionSummaryCompleted: "SessionSummaryCompleted",

  // Parser / output model
  ParserModelResponseStarted: "ParserModelResponseStarted",
  ParserModelResponseCompleted: "ParserModelResponseCompleted",
  OutputModelResponseStarted: "OutputModelResponseStarted",
  OutputModelResponseCompleted: "OutputModelResponseCompleted",

  // Model requests
  ModelRequestStarted: "ModelRequestStarted",
  ModelRequestCompleted: "ModelRequestCompleted",

  // Tool-result compression
  CompressionStarted: "CompressionStarted",
  CompressionCompleted: "CompressionCompleted",

  // Followup suggestions
  FollowupsStarted: "FollowupsStarted",
  FollowupsCompleted: "FollowupsCompleted",

  // Custom
  CustomEvent: "CustomEvent",
} as const;

/**
 * Constants for team streaming event types (40 events).
 *
 * Covers every value of agno 3.0's `TeamRunEvent` enum (`agno/run/team.py`).
 *
 * @public
 */
export const TeamEventType = {
  // Core lifecycle
  TeamRunStarted: "TeamRunStarted",
  TeamRunContent: "TeamRunContent",
  TeamRunContentCompleted: "TeamRunContentCompleted",
  TeamRunIntermediateContent: "TeamRunIntermediateContent",
  TeamRunCompleted: "TeamRunCompleted",
  TeamRunPaused: "TeamRunPaused",
  TeamRunContinued: "TeamRunContinued",
  TeamRunError: "TeamRunError",
  TeamRunCancelled: "TeamRunCancelled",

  // Hooks
  TeamPreHookStarted: "TeamPreHookStarted",
  TeamPreHookCompleted: "TeamPreHookCompleted",
  TeamPostHookStarted: "TeamPostHookStarted",
  TeamPostHookCompleted: "TeamPostHookCompleted",

  // Tool calls
  TeamToolCallStarted: "TeamToolCallStarted",
  TeamToolCallCompleted: "TeamToolCallCompleted",
  TeamToolCallError: "TeamToolCallError",

  // Reasoning
  TeamReasoningStarted: "TeamReasoningStarted",
  TeamReasoningStep: "TeamReasoningStep",
  TeamReasoningContentDelta: "TeamReasoningContentDelta",
  TeamReasoningCompleted: "TeamReasoningCompleted",

  // Memory
  TeamMemoryUpdateStarted: "TeamMemoryUpdateStarted",
  TeamMemoryUpdateCompleted: "TeamMemoryUpdateCompleted",

  // Session summary
  TeamSessionSummaryStarted: "TeamSessionSummaryStarted",
  TeamSessionSummaryCompleted: "TeamSessionSummaryCompleted",

  // Parser / output model
  TeamParserModelResponseStarted: "TeamParserModelResponseStarted",
  TeamParserModelResponseCompleted: "TeamParserModelResponseCompleted",
  TeamOutputModelResponseStarted: "TeamOutputModelResponseStarted",
  TeamOutputModelResponseCompleted: "TeamOutputModelResponseCompleted",

  // Model requests
  TeamModelRequestStarted: "TeamModelRequestStarted",
  TeamModelRequestCompleted: "TeamModelRequestCompleted",

  // Tool-result compression
  TeamCompressionStarted: "TeamCompressionStarted",
  TeamCompressionCompleted: "TeamCompressionCompleted",

  // Followup suggestions
  TeamFollowupsStarted: "TeamFollowupsStarted",
  TeamFollowupsCompleted: "TeamFollowupsCompleted",

  // Tasks mode
  TeamTaskIterationStarted: "TeamTaskIterationStarted",
  TeamTaskIterationCompleted: "TeamTaskIterationCompleted",
  TeamTaskStateUpdated: "TeamTaskStateUpdated",
  TeamTaskCreated: "TeamTaskCreated",
  TeamTaskUpdated: "TeamTaskUpdated",

  // Custom
  TeamCustomEvent: "TeamCustomEvent",
} as const;

/**
 * Constants for workflow streaming event types (30 events).
 *
 * Covers every value of agno 3.0's `WorkflowRunEvent` enum
 * (`agno/run/workflow.py`).
 *
 * @public
 */
export const WorkflowEventType = {
  // Lifecycle
  WorkflowStarted: "WorkflowStarted",
  WorkflowCompleted: "WorkflowCompleted",
  WorkflowPaused: "WorkflowPaused",
  WorkflowError: "WorkflowError",
  WorkflowCancelled: "WorkflowCancelled",

  // Workflow agent (decides between running the workflow and answering directly)
  WorkflowAgentStarted: "WorkflowAgentStarted",
  WorkflowAgentCompleted: "WorkflowAgentCompleted",

  // Steps
  StepStarted: "StepStarted",
  StepCompleted: "StepCompleted",
  StepPaused: "StepPaused",
  StepContinued: "StepContinued",
  StepExecutorPaused: "StepExecutorPaused",
  StepExecutorContinued: "StepExecutorContinued",
  StepOutputReview: "StepOutputReview",
  StepError: "StepError",
  StepOutput: "StepOutput",

  // Conditions
  ConditionExecutionStarted: "ConditionExecutionStarted",
  ConditionExecutionCompleted: "ConditionExecutionCompleted",
  ConditionPaused: "ConditionPaused",

  // Parallel
  ParallelExecutionStarted: "ParallelExecutionStarted",
  ParallelExecutionCompleted: "ParallelExecutionCompleted",

  // Loops
  LoopExecutionStarted: "LoopExecutionStarted",
  LoopIterationStarted: "LoopIterationStarted",
  LoopIterationCompleted: "LoopIterationCompleted",
  LoopExecutionCompleted: "LoopExecutionCompleted",

  // Routers
  RouterExecutionStarted: "RouterExecutionStarted",
  RouterExecutionCompleted: "RouterExecutionCompleted",
  RouterPaused: "RouterPaused",

  // Step groups
  StepsExecutionStarted: "StepsExecutionStarted",
  StepsExecutionCompleted: "StepsExecutionCompleted",
} as const;

/**
 * Composite constant containing all event types across agent, team, and workflow.
 * Backward compatible with the original RunEventType.
 *
 * @public
 */
export const RunEventType = {
  ...AgentEventType,
  ...TeamEventType,
  ...WorkflowEventType,
} as const;
