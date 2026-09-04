/**
 * Team streaming event interfaces (40 event types).
 *
 * @packageDocumentation
 */

import type {
  AudioData,
  BaseTeamRunEvent,
  ExtraData,
  ImageData,
  Metrics,
  ResponseAudio,
  RunRequirement,
  SessionSummary,
  TeamTaskData,
  ToolCallData,
  VideoData,
} from "./shared";

// ---------------------------------------------------------------------------
// Core lifecycle events
// ---------------------------------------------------------------------------

/**
 * Team run started event.
 *
 * @public
 */
export interface TeamRunStartedEvent extends BaseTeamRunEvent {
  event: "TeamRunStarted";
  session_id: string;
  model?: string;
  model_provider?: string;
}

/**
 * Team run content event.
 *
 * @public
 */
export interface TeamRunContentEvent extends BaseTeamRunEvent {
  event: "TeamRunContent";
  content: string | object;
  content_type: string;
  reasoning_content?: string;
  citations?: unknown;
  model_provider_data?: unknown;
  response_audio?: ResponseAudio;
  image?: ImageData;
  references?: unknown[];
  additional_input?: unknown[];
  reasoning_steps?: unknown[];
  reasoning_messages?: unknown[];
  tool?: ToolCallData;
  tools?: ToolCallData[];
  extra_data?: ExtraData;
  images?: ImageData[];
  videos?: VideoData[];
  audio?: AudioData[];
}

/**
 * Team content streaming completed.
 *
 * @public
 */
export interface TeamRunContentCompletedEvent extends BaseTeamRunEvent {
  event: "TeamRunContentCompleted";
}

/**
 * Team intermediate content during execution.
 *
 * @public
 */
export interface TeamRunIntermediateContentEvent extends BaseTeamRunEvent {
  event: "TeamRunIntermediateContent";
  content?: string | object;
  content_type?: string;
}

/**
 * Team run completed event.
 *
 * @public
 */
export interface TeamRunCompletedEvent extends BaseTeamRunEvent {
  event: "TeamRunCompleted";
  content: string | object;
  content_type: string;
  reasoning_content?: string;
  citations?: unknown;
  model_provider_data?: unknown;
  images?: ImageData[];
  videos?: VideoData[];
  audio?: AudioData[];
  response_audio?: ResponseAudio;
  references?: unknown[];
  additional_input?: unknown[];
  reasoning_steps?: unknown[];
  reasoning_messages?: unknown[];
  member_responses?: unknown[];
  metadata?: Record<string, unknown>;
  tool?: ToolCallData;
  tools?: ToolCallData[];
  extra_data?: ExtraData;
  metrics?: Metrics;
}

/**
 * Team run paused for human input (HITL, agno >= 3.0).
 *
 * `requirements` is the array a client resolves and sends back: the team
 * continue route (`POST /teams/{id}/runs/{run_id}/continue`) reads it as its
 * `requirements` form field. See `RunRequirement`. A requirement raised by a
 * team member carries `member_agent_id` / `member_run_id`.
 *
 * @public
 */
export interface TeamRunPausedEvent extends BaseTeamRunEvent {
  event: "TeamRunPaused";
  tools?: ToolCallData[];
  /** Requirements to resolve before the run can continue */
  requirements?: RunRequirement[];
}

/**
 * Paused team run continued.
 *
 * @public
 */
export interface TeamRunContinuedEvent extends BaseTeamRunEvent {
  event: "TeamRunContinued";
}

/**
 * Team run error event.
 *
 * Carries the same agno >= 3.0 failure identity as the agent `RunError`
 * event; see `RunErrorEvent`.
 *
 * @public
 */
export interface TeamRunErrorEvent extends BaseTeamRunEvent {
  event: "TeamRunError";
  content: string;
  /** Machine-readable failure kind (agno >= 3.0), e.g. `"model_provider_error"` */
  error_type?: string;
  /** Stable error identifier (agno >= 3.0); agno currently mirrors `error_type` */
  error_id?: string;
  /** Extra structured context attached by the raising exception */
  additional_data?: Record<string, unknown>;
}

/**
 * Team run cancelled event.
 *
 * @public
 */
export interface TeamRunCancelledEvent extends BaseTeamRunEvent {
  event: "TeamRunCancelled";
  reason?: string;
}

// ---------------------------------------------------------------------------
// Hook events
// ---------------------------------------------------------------------------

/**
 * Team pre-hook execution started.
 *
 * @public
 */
export interface TeamPreHookStartedEvent extends BaseTeamRunEvent {
  event: "TeamPreHookStarted";
  pre_hook_name?: string;
  run_input?: unknown;
}

/**
 * Team pre-hook execution completed.
 *
 * @public
 */
export interface TeamPreHookCompletedEvent extends BaseTeamRunEvent {
  event: "TeamPreHookCompleted";
  pre_hook_name?: string;
  run_input?: unknown;
}

/**
 * Team post-hook execution started.
 *
 * @public
 */
export interface TeamPostHookStartedEvent extends BaseTeamRunEvent {
  event: "TeamPostHookStarted";
  post_hook_name?: string;
}

/**
 * Team post-hook execution completed.
 *
 * @public
 */
export interface TeamPostHookCompletedEvent extends BaseTeamRunEvent {
  event: "TeamPostHookCompleted";
  post_hook_name?: string;
}

// ---------------------------------------------------------------------------
// Tool call events
// ---------------------------------------------------------------------------

/**
 * Team tool call started event.
 *
 * @public
 */
export interface TeamToolCallStartedEvent extends BaseTeamRunEvent {
  event: "TeamToolCallStarted";
  tool: ToolCallData;
}

/**
 * Team tool call completed event.
 *
 * @public
 */
export interface TeamToolCallCompletedEvent extends BaseTeamRunEvent {
  event: "TeamToolCallCompleted";
  tool: ToolCallData;
  content?: unknown;
  images?: ImageData[];
  videos?: VideoData[];
  audio?: AudioData[];
}

/**
 * Team tool call failed.
 *
 * @public
 */
export interface TeamToolCallErrorEvent extends BaseTeamRunEvent {
  event: "TeamToolCallError";
  tool?: ToolCallData;
  error?: string;
}

// ---------------------------------------------------------------------------
// Reasoning events
// ---------------------------------------------------------------------------

/**
 * Team reasoning started event.
 *
 * @public
 */
export interface TeamReasoningStartedEvent extends BaseTeamRunEvent {
  event: "TeamReasoningStarted";
  session_id?: string;
}

/**
 * Team reasoning step event.
 *
 * @public
 */
export interface TeamReasoningStepEvent extends BaseTeamRunEvent {
  event: "TeamReasoningStep";
  content?: unknown;
  content_type?: string;
  reasoning_content?: string;
  extra_data?: ExtraData;
}

/**
 * A chunk of team reasoning content, streamed as it arrives.
 *
 * @public
 */
export interface TeamReasoningContentDeltaEvent extends BaseTeamRunEvent {
  event: "TeamReasoningContentDelta";
  /** The delta of reasoning content */
  reasoning_content: string;
}

/**
 * Team reasoning completed event.
 *
 * @public
 */
export interface TeamReasoningCompletedEvent extends BaseTeamRunEvent {
  event: "TeamReasoningCompleted";
  content?: unknown;
  content_type?: string;
  extra_data?: ExtraData;
}

// ---------------------------------------------------------------------------
// Memory events
// ---------------------------------------------------------------------------

/**
 * Team memory update started event.
 *
 * @public
 */
export interface TeamMemoryUpdateStartedEvent extends BaseTeamRunEvent {
  event: "TeamMemoryUpdateStarted";
}

/**
 * Team memory update completed event.
 *
 * @public
 */
export interface TeamMemoryUpdateCompletedEvent extends BaseTeamRunEvent {
  event: "TeamMemoryUpdateCompleted";
}

// ---------------------------------------------------------------------------
// Session summary events
// ---------------------------------------------------------------------------

/**
 * Team session summary generation started.
 *
 * @public
 */
export interface TeamSessionSummaryStartedEvent extends BaseTeamRunEvent {
  event: "TeamSessionSummaryStarted";
}

/**
 * Team session summary generation completed.
 *
 * @public
 */
export interface TeamSessionSummaryCompletedEvent extends BaseTeamRunEvent {
  event: "TeamSessionSummaryCompleted";
  session_summary?: SessionSummary;
}

// ---------------------------------------------------------------------------
// Parser / output model events
// ---------------------------------------------------------------------------

/**
 * Team parser model response started.
 *
 * @public
 */
export interface TeamParserModelResponseStartedEvent extends BaseTeamRunEvent {
  event: "TeamParserModelResponseStarted";
}

/**
 * Team parser model response completed.
 *
 * @public
 */
export interface TeamParserModelResponseCompletedEvent
  extends BaseTeamRunEvent {
  event: "TeamParserModelResponseCompleted";
}

/**
 * Team output model response started.
 *
 * @public
 */
export interface TeamOutputModelResponseStartedEvent extends BaseTeamRunEvent {
  event: "TeamOutputModelResponseStarted";
}

/**
 * Team output model response completed.
 *
 * @public
 */
export interface TeamOutputModelResponseCompletedEvent
  extends BaseTeamRunEvent {
  event: "TeamOutputModelResponseCompleted";
}

// ---------------------------------------------------------------------------
// Model request events
// ---------------------------------------------------------------------------

/**
 * A team-leader model request is about to be made. Emitted before every
 * model call in the run, including the follow-up calls after tool execution.
 *
 * @public
 */
export interface TeamModelRequestStartedEvent extends BaseTeamRunEvent {
  event: "TeamModelRequestStarted";
  model?: string;
  model_provider?: string;
}

/**
 * A team-leader model request completed, with the token usage of that
 * single request.
 *
 * @public
 */
export interface TeamModelRequestCompletedEvent extends BaseTeamRunEvent {
  event: "TeamModelRequestCompleted";
  model?: string;
  model_provider?: string;
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  time_to_first_token?: number;
  reasoning_tokens?: number;
  cache_read_tokens?: number;
  cache_write_tokens?: number;
}

// ---------------------------------------------------------------------------
// Tool-result compression events
// ---------------------------------------------------------------------------

/**
 * Team tool-result compression is about to start.
 *
 * @public
 */
export interface TeamCompressionStartedEvent extends BaseTeamRunEvent {
  event: "TeamCompressionStarted";
}

/**
 * Team tool-result compression completed.
 *
 * @public
 */
export interface TeamCompressionCompletedEvent extends BaseTeamRunEvent {
  event: "TeamCompressionCompleted";
  tool_results_compressed?: number;
  original_size?: number;
  compressed_size?: number;
}

// ---------------------------------------------------------------------------
// Followup suggestion events
// ---------------------------------------------------------------------------

/**
 * Team followup prompt generation started.
 *
 * @public
 */
export interface TeamFollowupsStartedEvent extends BaseTeamRunEvent {
  event: "TeamFollowupsStarted";
}

/**
 * Team followup prompt generation completed.
 *
 * @public
 */
export interface TeamFollowupsCompletedEvent extends BaseTeamRunEvent {
  event: "TeamFollowupsCompleted";
  /** Short, action-oriented followup prompts */
  followups?: string[];
}

// ---------------------------------------------------------------------------
// Tasks mode events
// ---------------------------------------------------------------------------

/**
 * A task iteration started (team tasks mode).
 *
 * @public
 */
export interface TeamTaskIterationStartedEvent extends BaseTeamRunEvent {
  event: "TeamTaskIterationStarted";
  iteration: number;
  max_iterations: number;
}

/**
 * A task iteration completed (team tasks mode).
 *
 * @public
 */
export interface TeamTaskIterationCompletedEvent extends BaseTeamRunEvent {
  event: "TeamTaskIterationCompleted";
  iteration: number;
  max_iterations: number;
  task_summary?: string;
}

/**
 * The task state changed (team tasks mode). Carries the full task list so a
 * client can re-render it without merging the per-task events.
 *
 * @public
 */
export interface TeamTaskStateUpdatedEvent extends BaseTeamRunEvent {
  event: "TeamTaskStateUpdated";
  task_summary?: string;
  goal_complete: boolean;
  /** Full structured task list */
  tasks: TeamTaskData[];
  completion_summary?: string;
}

/**
 * A task was created (team tasks mode).
 *
 * @public
 */
export interface TeamTaskCreatedEvent extends BaseTeamRunEvent {
  event: "TeamTaskCreated";
  task_id: string;
  title: string;
  description: string;
  assignee?: string;
  /** `"pending"` | `"in_progress"` | `"completed"` | `"failed"` | `"blocked"` */
  status: string;
  dependencies: string[];
}

/**
 * A task's status changed (team tasks mode).
 *
 * @public
 */
export interface TeamTaskUpdatedEvent extends BaseTeamRunEvent {
  event: "TeamTaskUpdated";
  task_id: string;
  title: string;
  /** `"pending"` | `"in_progress"` | `"completed"` | `"failed"` | `"blocked"` */
  status: string;
  previous_status?: string;
  result?: string;
  assignee?: string;
}

// ---------------------------------------------------------------------------
// Custom event
// ---------------------------------------------------------------------------

/**
 * Team custom user-defined event.
 *
 * @public
 */
export interface TeamCustomEvent extends BaseTeamRunEvent {
  event: "TeamCustomEvent";
}

// ---------------------------------------------------------------------------
// Discriminated union
// ---------------------------------------------------------------------------

/**
 * Discriminated union of all team run streaming events (40 types).
 *
 * @public
 */
export type TeamRunEvent =
  | TeamRunStartedEvent
  | TeamRunContentEvent
  | TeamRunContentCompletedEvent
  | TeamRunIntermediateContentEvent
  | TeamRunCompletedEvent
  | TeamRunPausedEvent
  | TeamRunContinuedEvent
  | TeamRunErrorEvent
  | TeamRunCancelledEvent
  | TeamPreHookStartedEvent
  | TeamPreHookCompletedEvent
  | TeamPostHookStartedEvent
  | TeamPostHookCompletedEvent
  | TeamToolCallStartedEvent
  | TeamToolCallCompletedEvent
  | TeamToolCallErrorEvent
  | TeamReasoningStartedEvent
  | TeamReasoningStepEvent
  | TeamReasoningContentDeltaEvent
  | TeamReasoningCompletedEvent
  | TeamMemoryUpdateStartedEvent
  | TeamMemoryUpdateCompletedEvent
  | TeamSessionSummaryStartedEvent
  | TeamSessionSummaryCompletedEvent
  | TeamParserModelResponseStartedEvent
  | TeamParserModelResponseCompletedEvent
  | TeamOutputModelResponseStartedEvent
  | TeamOutputModelResponseCompletedEvent
  | TeamModelRequestStartedEvent
  | TeamModelRequestCompletedEvent
  | TeamCompressionStartedEvent
  | TeamCompressionCompletedEvent
  | TeamFollowupsStartedEvent
  | TeamFollowupsCompletedEvent
  | TeamTaskIterationStartedEvent
  | TeamTaskIterationCompletedEvent
  | TeamTaskStateUpdatedEvent
  | TeamTaskCreatedEvent
  | TeamTaskUpdatedEvent
  | TeamCustomEvent;
