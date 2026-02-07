/**
 * Team streaming event interfaces (25 event types).
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
  SessionSummary,
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
 * Team run error event.
 *
 * @public
 */
export interface TeamRunErrorEvent extends BaseTeamRunEvent {
  event: "TeamRunError";
  content: string;
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
 * Discriminated union of all team run streaming events (25 types).
 *
 * @public
 */
export type TeamRunEvent =
  | TeamRunStartedEvent
  | TeamRunContentEvent
  | TeamRunContentCompletedEvent
  | TeamRunIntermediateContentEvent
  | TeamRunCompletedEvent
  | TeamRunErrorEvent
  | TeamRunCancelledEvent
  | TeamPreHookStartedEvent
  | TeamPreHookCompletedEvent
  | TeamPostHookStartedEvent
  | TeamPostHookCompletedEvent
  | TeamToolCallStartedEvent
  | TeamToolCallCompletedEvent
  | TeamReasoningStartedEvent
  | TeamReasoningStepEvent
  | TeamReasoningCompletedEvent
  | TeamMemoryUpdateStartedEvent
  | TeamMemoryUpdateCompletedEvent
  | TeamSessionSummaryStartedEvent
  | TeamSessionSummaryCompletedEvent
  | TeamParserModelResponseStartedEvent
  | TeamParserModelResponseCompletedEvent
  | TeamOutputModelResponseStartedEvent
  | TeamOutputModelResponseCompletedEvent
  | TeamCustomEvent;
