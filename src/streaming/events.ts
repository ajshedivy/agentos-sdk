/**
 * Base event interface shared by all streaming events.
 *
 * @public
 */
export interface StreamEvent {
  event: string;
  created_at: number;
  run_id?: string;
  [key: string]: unknown;
}

/**
 * @deprecated Use StreamEvent instead
 * @public
 */
export type BaseEvent = StreamEvent;

/**
 * Constants for all streaming event types.
 *
 * @public
 */
export const RunEventType = {
  // Core lifecycle
  RunStarted: 'RunStarted',
  RunContent: 'RunContent',
  RunCompleted: 'RunCompleted',
  RunError: 'RunError',
  RunOutput: 'RunOutput',
  RunCancelled: 'RunCancelled',
  RunPaused: 'RunPaused',
  RunContinued: 'RunContinued',

  // Tool calls
  ToolCallStarted: 'ToolCallStarted',
  ToolCallCompleted: 'ToolCallCompleted',

  // Reasoning
  ReasoningStarted: 'ReasoningStarted',
  ReasoningStep: 'ReasoningStep',
  ReasoningCompleted: 'ReasoningCompleted',

  // Memory
  UpdatingMemory: 'UpdatingMemory',
  MemoryUpdateStarted: 'MemoryUpdateStarted',
  MemoryUpdateCompleted: 'MemoryUpdateCompleted',

  // Team variants
  TeamRunStarted: 'TeamRunStarted',
  TeamRunContent: 'TeamRunContent',
  TeamRunCompleted: 'TeamRunCompleted',
  TeamRunError: 'TeamRunError',
  TeamRunCancelled: 'TeamRunCancelled',
  TeamToolCallStarted: 'TeamToolCallStarted',
  TeamToolCallCompleted: 'TeamToolCallCompleted',
  TeamReasoningStarted: 'TeamReasoningStarted',
  TeamReasoningStep: 'TeamReasoningStep',
  TeamReasoningCompleted: 'TeamReasoningCompleted',
  TeamMemoryUpdateStarted: 'TeamMemoryUpdateStarted',
  TeamMemoryUpdateCompleted: 'TeamMemoryUpdateCompleted',
} as const;

// Supporting data types

/**
 * Tool call data structure.
 *
 * @public
 */
export interface ToolCallData {
  tool_call_id: string;
  tool_name: string;
  tool_args: Record<string, unknown>;
  content?: string | null;
  result?: string | null;
  role?: string;
  tool_call_error?: boolean;
  metrics?: { time?: number; duration?: number };
  created_at: number;
}

/**
 * Reasoning step data structure.
 *
 * @public
 */
export interface ReasoningStep {
  title: string;
  action?: string;
  result: string;
  reasoning: string;
  confidence?: number;
  next_action?: string;
}

/**
 * Extra data passed with events.
 *
 * @public
 */
export interface ExtraData {
  reasoning_steps?: ReasoningStep[];
  reasoning_messages?: ReasoningMessage[];
  references?: ReferenceData[];
}

/**
 * Reasoning message structure.
 *
 * @public
 */
export interface ReasoningMessage {
  role: string;
  content: string | null;
  tool_call_id?: string;
  tool_name?: string;
  tool_args?: Record<string, unknown>;
  tool_call_error?: boolean;
  metrics?: { time: number };
  created_at?: number;
}

/**
 * Reference data from knowledge base.
 *
 * @public
 */
export interface ReferenceData {
  query: string;
  references: Reference[];
  time?: number;
}

/**
 * Individual reference from knowledge base.
 *
 * @public
 */
export interface Reference {
  content: string;
  meta_data: Record<string, unknown>;
  name: string;
}

/**
 * Image data structure.
 *
 * @public
 */
export interface ImageData {
  revised_prompt: string;
  url: string;
}

/**
 * Video data structure.
 *
 * @public
 */
export interface VideoData {
  id: number;
  eta: number;
  url: string;
}

/**
 * Audio data structure.
 *
 * @public
 */
export interface AudioData {
  base64_audio?: string;
  mime_type?: string;
  url?: string;
  id?: string;
  content?: string;
  channels?: number;
  sample_rate?: number;
}

/**
 * Response audio structure.
 *
 * @public
 */
export interface ResponseAudio {
  id?: string;
  content?: string;
  transcript?: string;
  channels?: number;
  sample_rate?: number;
}

/**
 * Run metrics data structure.
 *
 * @public
 */
export interface RunMetrics {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  time_to_first_token?: number;
  duration?: number;
}

/**
 * Optional common fields for run response events.
 *
 * @public
 */
export interface RunResponseFields {
  content?: string | object;
  content_type?: string;
  event_data?: object;
  metrics?: object;
  model?: string;
  run_id?: string;
  agent_id?: string;
  session_id?: string;
  created_at: number;
}

// Event interfaces - Core lifecycle

/**
 * Initial event sent when agent run starts.
 *
 * @public
 */
export interface RunStartedEvent extends StreamEvent {
  event: 'RunStarted';
  session_id: string;
  agent_id: string;
  run_id: string;
}

/**
 * Content chunks streamed during agent execution.
 *
 * @public
 */
export interface RunContentEvent extends StreamEvent {
  event: 'RunContent';
  content: string | object;
  content_type: string;
  tool?: ToolCallData;
  tools?: ToolCallData[];
  extra_data?: ExtraData;
  images?: ImageData[];
  videos?: VideoData[];
  audio?: AudioData[];
  response_audio?: ResponseAudio;
}

/**
 * Final event with complete response and metrics.
 *
 * @public
 */
export interface RunCompletedEvent extends StreamEvent {
  event: 'RunCompleted';
  content: string | object;
  content_type: string;
  session_id: string;
  agent_id: string;
  tool?: ToolCallData;
  tools?: ToolCallData[];
  extra_data?: ExtraData;
  images?: ImageData[];
  videos?: VideoData[];
  response_audio?: ResponseAudio;
  metrics?: RunMetrics;
}

/**
 * Error event during agent run.
 *
 * @public
 */
export interface RunErrorEvent extends StreamEvent {
  event: 'RunError';
  content: string;
}

/**
 * Run output event.
 *
 * @public
 */
export interface RunOutputEvent extends StreamEvent {
  event: 'RunOutput';
  content?: string | object;
}

/**
 * Run cancelled event.
 *
 * @public
 */
export interface RunCancelledEvent extends StreamEvent {
  event: 'RunCancelled';
}

/**
 * Run paused event.
 *
 * @public
 */
export interface RunPausedEvent extends StreamEvent {
  event: 'RunPaused';
}

/**
 * Run continued event.
 *
 * @public
 */
export interface RunContinuedEvent extends StreamEvent {
  event: 'RunContinued';
}

// Event interfaces - Tool calls

/**
 * Tool call started event.
 *
 * @public
 */
export interface ToolCallStartedEvent extends StreamEvent {
  event: 'ToolCallStarted';
  tool: ToolCallData;
}

/**
 * Tool call completed event.
 *
 * @public
 */
export interface ToolCallCompletedEvent extends StreamEvent {
  event: 'ToolCallCompleted';
  tool: ToolCallData;
}

// Event interfaces - Reasoning

/**
 * Reasoning started event.
 *
 * @public
 */
export interface ReasoningStartedEvent extends StreamEvent {
  event: 'ReasoningStarted';
  session_id?: string;
}

/**
 * Reasoning step event.
 *
 * @public
 */
export interface ReasoningStepEvent extends StreamEvent {
  event: 'ReasoningStep';
  extra_data?: ExtraData;
}

/**
 * Reasoning completed event.
 *
 * @public
 */
export interface ReasoningCompletedEvent extends StreamEvent {
  event: 'ReasoningCompleted';
  extra_data?: ExtraData;
}

// Event interfaces - Memory

/**
 * Updating memory event.
 *
 * @public
 */
export interface UpdatingMemoryEvent extends StreamEvent {
  event: 'UpdatingMemory';
}

/**
 * Memory operation start event.
 *
 * @public
 */
export interface MemoryUpdateStartedEvent extends StreamEvent {
  event: 'MemoryUpdateStarted';
}

/**
 * Memory operation completion event.
 *
 * @public
 */
export interface MemoryUpdateCompletedEvent extends StreamEvent {
  event: 'MemoryUpdateCompleted';
}

// Event interfaces - Team variants

/**
 * Team run started event.
 *
 * @public
 */
export interface TeamRunStartedEvent extends StreamEvent {
  event: 'TeamRunStarted';
  session_id: string;
}

/**
 * Team run content event.
 *
 * @public
 */
export interface TeamRunContentEvent extends StreamEvent {
  event: 'TeamRunContent';
  content: string | object;
  content_type: string;
  tool?: ToolCallData;
  tools?: ToolCallData[];
  extra_data?: ExtraData;
  images?: ImageData[];
  videos?: VideoData[];
  audio?: AudioData[];
  response_audio?: ResponseAudio;
}

/**
 * Team run completed event.
 *
 * @public
 */
export interface TeamRunCompletedEvent extends StreamEvent {
  event: 'TeamRunCompleted';
  content: string | object;
  content_type: string;
  tool?: ToolCallData;
  tools?: ToolCallData[];
  extra_data?: ExtraData;
  images?: ImageData[];
  videos?: VideoData[];
  response_audio?: ResponseAudio;
  metrics?: RunMetrics;
}

/**
 * Team run error event.
 *
 * @public
 */
export interface TeamRunErrorEvent extends StreamEvent {
  event: 'TeamRunError';
  content: string;
}

/**
 * Team run cancelled event.
 *
 * @public
 */
export interface TeamRunCancelledEvent extends StreamEvent {
  event: 'TeamRunCancelled';
}

/**
 * Team tool call started event.
 *
 * @public
 */
export interface TeamToolCallStartedEvent extends StreamEvent {
  event: 'TeamToolCallStarted';
  tool: ToolCallData;
}

/**
 * Team tool call completed event.
 *
 * @public
 */
export interface TeamToolCallCompletedEvent extends StreamEvent {
  event: 'TeamToolCallCompleted';
  tool: ToolCallData;
}

/**
 * Team reasoning started event.
 *
 * @public
 */
export interface TeamReasoningStartedEvent extends StreamEvent {
  event: 'TeamReasoningStarted';
  session_id?: string;
}

/**
 * Team reasoning step event.
 *
 * @public
 */
export interface TeamReasoningStepEvent extends StreamEvent {
  event: 'TeamReasoningStep';
  extra_data?: ExtraData;
}

/**
 * Team reasoning completed event.
 *
 * @public
 */
export interface TeamReasoningCompletedEvent extends StreamEvent {
  event: 'TeamReasoningCompleted';
  extra_data?: ExtraData;
}

/**
 * Team memory update started event.
 *
 * @public
 */
export interface TeamMemoryUpdateStartedEvent extends StreamEvent {
  event: 'TeamMemoryUpdateStarted';
}

/**
 * Team memory update completed event.
 *
 * @public
 */
export interface TeamMemoryUpdateCompletedEvent extends StreamEvent {
  event: 'TeamMemoryUpdateCompleted';
}

/**
 * Discriminated union of all agent run streaming events.
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
 *     process.stdout.write(event.content);
 *     break;
 * }
 * ```
 *
 * @public
 */
export type AgentRunEvent =
  | RunStartedEvent
  | RunContentEvent
  | RunCompletedEvent
  | RunErrorEvent
  | RunOutputEvent
  | RunCancelledEvent
  | RunPausedEvent
  | RunContinuedEvent
  | ToolCallStartedEvent
  | ToolCallCompletedEvent
  | ReasoningStartedEvent
  | ReasoningStepEvent
  | ReasoningCompletedEvent
  | UpdatingMemoryEvent
  | MemoryUpdateStartedEvent
  | MemoryUpdateCompletedEvent
  | TeamRunStartedEvent
  | TeamRunContentEvent
  | TeamRunCompletedEvent
  | TeamRunErrorEvent
  | TeamRunCancelledEvent
  | TeamToolCallStartedEvent
  | TeamToolCallCompletedEvent
  | TeamReasoningStartedEvent
  | TeamReasoningStepEvent
  | TeamReasoningCompletedEvent
  | TeamMemoryUpdateStartedEvent
  | TeamMemoryUpdateCompletedEvent;
