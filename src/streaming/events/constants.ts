/**
 * Event type constants for agent, team, and workflow streaming events.
 *
 * @packageDocumentation
 */

/**
 * Constants for agent streaming event types (29 events).
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
  ReasoningCompleted: "ReasoningCompleted",

  // Tool calls
  ToolCallStarted: "ToolCallStarted",
  ToolCallCompleted: "ToolCallCompleted",

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

  // Custom
  CustomEvent: "CustomEvent",
} as const;

/**
 * Constants for team streaming event types (25 events).
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

  // Reasoning
  TeamReasoningStarted: "TeamReasoningStarted",
  TeamReasoningStep: "TeamReasoningStep",
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

  // Custom
  TeamCustomEvent: "TeamCustomEvent",
} as const;

/**
 * Constants for workflow streaming event types (18 events).
 *
 * @public
 */
export const WorkflowEventType = {
  // Lifecycle
  WorkflowStarted: "WorkflowStarted",
  WorkflowCompleted: "WorkflowCompleted",
  WorkflowCancelled: "WorkflowCancelled",

  // Steps
  StepStarted: "StepStarted",
  StepCompleted: "StepCompleted",
  StepOutput: "StepOutput",

  // Conditions
  ConditionExecutionStarted: "ConditionExecutionStarted",
  ConditionExecutionCompleted: "ConditionExecutionCompleted",

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
