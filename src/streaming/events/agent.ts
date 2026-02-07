/**
 * Agent streaming event interfaces (29 event types).
 *
 * @packageDocumentation
 */

import type {
  AudioData,
  BaseAgentRunEvent,
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
 * Initial event sent when agent run starts.
 *
 * @public
 */
export interface RunStartedEvent extends BaseAgentRunEvent {
  event: "RunStarted";
  session_id: string;
  agent_id: string;
  run_id: string;
  model?: string;
  model_provider?: string;
}

/**
 * Content chunks streamed during agent execution.
 *
 * @public
 */
export interface RunContentEvent extends BaseAgentRunEvent {
  event: "RunContent";
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
 * Signals that content streaming is complete.
 *
 * @public
 */
export interface RunContentCompletedEvent extends BaseAgentRunEvent {
  event: "RunContentCompleted";
}

/**
 * Intermediate content during agent execution.
 *
 * @public
 */
export interface RunIntermediateContentEvent extends BaseAgentRunEvent {
  event: "RunIntermediateContent";
  content?: string | object;
  content_type?: string;
}

/**
 * Final event with complete response and metrics.
 *
 * @public
 */
export interface RunCompletedEvent extends BaseAgentRunEvent {
  event: "RunCompleted";
  content: string | object;
  content_type: string;
  session_id: string;
  agent_id: string;
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
  metadata?: Record<string, unknown>;
  tool?: ToolCallData;
  tools?: ToolCallData[];
  extra_data?: ExtraData;
  metrics?: Metrics;
}

/**
 * Run paused event (e.g. tool confirmation required).
 *
 * @public
 */
export interface RunPausedEvent extends BaseAgentRunEvent {
  event: "RunPaused";
  tools?: ToolCallData[];
}

/**
 * Run continued event after pause.
 *
 * @public
 */
export interface RunContinuedEvent extends BaseAgentRunEvent {
  event: "RunContinued";
}

/**
 * Error event during agent run.
 *
 * @public
 */
export interface RunErrorEvent extends BaseAgentRunEvent {
  event: "RunError";
  content: string;
}

/**
 * Run cancelled event.
 *
 * @public
 */
export interface RunCancelledEvent extends BaseAgentRunEvent {
  event: "RunCancelled";
  reason?: string;
}

/**
 * Run output event.
 *
 * @public
 */
export interface RunOutputEvent extends BaseAgentRunEvent {
  event: "RunOutput";
  content?: string | object;
}

// ---------------------------------------------------------------------------
// Hook events
// ---------------------------------------------------------------------------

/**
 * Pre-hook execution started.
 *
 * @public
 */
export interface PreHookStartedEvent extends BaseAgentRunEvent {
  event: "PreHookStarted";
  pre_hook_name?: string;
  run_input?: unknown;
}

/**
 * Pre-hook execution completed.
 *
 * @public
 */
export interface PreHookCompletedEvent extends BaseAgentRunEvent {
  event: "PreHookCompleted";
  pre_hook_name?: string;
  run_input?: unknown;
}

/**
 * Post-hook execution started.
 *
 * @public
 */
export interface PostHookStartedEvent extends BaseAgentRunEvent {
  event: "PostHookStarted";
  post_hook_name?: string;
}

/**
 * Post-hook execution completed.
 *
 * @public
 */
export interface PostHookCompletedEvent extends BaseAgentRunEvent {
  event: "PostHookCompleted";
  post_hook_name?: string;
}

// ---------------------------------------------------------------------------
// Reasoning events
// ---------------------------------------------------------------------------

/**
 * Reasoning started event.
 *
 * @public
 */
export interface ReasoningStartedEvent extends BaseAgentRunEvent {
  event: "ReasoningStarted";
  session_id?: string;
}

/**
 * Reasoning step event.
 *
 * @public
 */
export interface ReasoningStepEvent extends BaseAgentRunEvent {
  event: "ReasoningStep";
  content?: unknown;
  content_type?: string;
  reasoning_content?: string;
  extra_data?: ExtraData;
}

/**
 * Reasoning completed event.
 *
 * @public
 */
export interface ReasoningCompletedEvent extends BaseAgentRunEvent {
  event: "ReasoningCompleted";
  content?: unknown;
  content_type?: string;
  extra_data?: ExtraData;
}

// ---------------------------------------------------------------------------
// Tool call events
// ---------------------------------------------------------------------------

/**
 * Tool call started event.
 *
 * @public
 */
export interface ToolCallStartedEvent extends BaseAgentRunEvent {
  event: "ToolCallStarted";
  tool: ToolCallData;
}

/**
 * Tool call completed event.
 *
 * @public
 */
export interface ToolCallCompletedEvent extends BaseAgentRunEvent {
  event: "ToolCallCompleted";
  tool: ToolCallData;
  content?: unknown;
  images?: ImageData[];
  videos?: VideoData[];
  audio?: AudioData[];
}

// ---------------------------------------------------------------------------
// Memory events
// ---------------------------------------------------------------------------

/**
 * Updating memory event.
 *
 * @public
 */
export interface UpdatingMemoryEvent extends BaseAgentRunEvent {
  event: "UpdatingMemory";
}

/**
 * Memory operation start event.
 *
 * @public
 */
export interface MemoryUpdateStartedEvent extends BaseAgentRunEvent {
  event: "MemoryUpdateStarted";
}

/**
 * Memory operation completion event.
 *
 * @public
 */
export interface MemoryUpdateCompletedEvent extends BaseAgentRunEvent {
  event: "MemoryUpdateCompleted";
}

// ---------------------------------------------------------------------------
// Session summary events
// ---------------------------------------------------------------------------

/**
 * Session summary generation started.
 *
 * @public
 */
export interface SessionSummaryStartedEvent extends BaseAgentRunEvent {
  event: "SessionSummaryStarted";
}

/**
 * Session summary generation completed.
 *
 * @public
 */
export interface SessionSummaryCompletedEvent extends BaseAgentRunEvent {
  event: "SessionSummaryCompleted";
  session_summary?: SessionSummary;
}

// ---------------------------------------------------------------------------
// Parser / output model events
// ---------------------------------------------------------------------------

/**
 * Parser model response started.
 *
 * @public
 */
export interface ParserModelResponseStartedEvent extends BaseAgentRunEvent {
  event: "ParserModelResponseStarted";
}

/**
 * Parser model response completed.
 *
 * @public
 */
export interface ParserModelResponseCompletedEvent extends BaseAgentRunEvent {
  event: "ParserModelResponseCompleted";
}

/**
 * Output model response started.
 *
 * @public
 */
export interface OutputModelResponseStartedEvent extends BaseAgentRunEvent {
  event: "OutputModelResponseStarted";
}

/**
 * Output model response completed.
 *
 * @public
 */
export interface OutputModelResponseCompletedEvent extends BaseAgentRunEvent {
  event: "OutputModelResponseCompleted";
}

// ---------------------------------------------------------------------------
// Custom event
// ---------------------------------------------------------------------------

/**
 * Custom user-defined event.
 *
 * @public
 */
export interface CustomEvent extends BaseAgentRunEvent {
  event: "CustomEvent";
}

// ---------------------------------------------------------------------------
// Discriminated union
// ---------------------------------------------------------------------------

/**
 * Discriminated union of all agent run streaming events (29 types).
 *
 * Use the `event` field to narrow the type:
 * ```typescript
 * switch (event.event) {
 *   case 'RunStarted':
 *     // event is RunStartedEvent
 *     console.log(event.agent_id);
 *     break;
 *   case 'RunContent':
 *     // event is RunContentEvent
 *     process.stdout.write(String(event.content));
 *     break;
 * }
 * ```
 *
 * @public
 */
export type AgentRunEvent =
  | RunStartedEvent
  | RunContentEvent
  | RunContentCompletedEvent
  | RunIntermediateContentEvent
  | RunCompletedEvent
  | RunPausedEvent
  | RunContinuedEvent
  | RunErrorEvent
  | RunCancelledEvent
  | RunOutputEvent
  | PreHookStartedEvent
  | PreHookCompletedEvent
  | PostHookStartedEvent
  | PostHookCompletedEvent
  | ReasoningStartedEvent
  | ReasoningStepEvent
  | ReasoningCompletedEvent
  | ToolCallStartedEvent
  | ToolCallCompletedEvent
  | UpdatingMemoryEvent
  | MemoryUpdateStartedEvent
  | MemoryUpdateCompletedEvent
  | SessionSummaryStartedEvent
  | SessionSummaryCompletedEvent
  | ParserModelResponseStartedEvent
  | ParserModelResponseCompletedEvent
  | OutputModelResponseStartedEvent
  | OutputModelResponseCompletedEvent
  | CustomEvent;
