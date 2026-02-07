/**
 * Shared types, base events, and supporting interfaces for streaming events.
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Base event
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// RunStatus
// ---------------------------------------------------------------------------

/**
 * Constants for run status values.
 *
 * @public
 */
export const RunStatus = {
  Running: "running",
  Completed: "completed",
  Paused: "paused",
  Cancelled: "cancelled",
  Error: "error",
  Pending: "pending",
} as const;

/**
 * Union type of all possible run status values.
 *
 * @public
 */
export type RunStatus = (typeof RunStatus)[keyof typeof RunStatus];

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

/**
 * Expanded metrics data structure with full provider parity.
 *
 * @public
 */
export interface Metrics {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  time_to_first_token?: number;
  duration?: number;
  audio_input_tokens?: number;
  audio_output_tokens?: number;
  cache_read_tokens?: number;
  cache_write_tokens?: number;
  reasoning_tokens?: number;
  provider_metrics?: Record<string, unknown>;
  additional_metrics?: Record<string, unknown>;
}

/**
 * @deprecated Use Metrics instead
 * @public
 */
export type RunMetrics = Metrics;

// ---------------------------------------------------------------------------
// Supporting data types
// ---------------------------------------------------------------------------

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
 * Tool execution data from the Agno Python SDK.
 *
 * @public
 */
export interface ToolExecution {
  function_name: string;
  arguments?: Record<string, unknown>;
  result?: string | null;
  call_id?: string;
  tool_call_error?: boolean;
  metrics?: { time?: number; duration?: number };
  created_at?: number;
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
 * Session summary data structure.
 *
 * @public
 */
export interface SessionSummary {
  summary: string;
  topics?: string[];
  updated_at?: number;
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

// ---------------------------------------------------------------------------
// Workflow supporting types
// ---------------------------------------------------------------------------

/**
 * Step output from a workflow step execution.
 *
 * @public
 */
export interface StepOutput {
  step_id?: string;
  step_name?: string;
  step_index?: number | [number, number];
  step_type?: string;
  content?: string | object;
  content_type?: string;
  images?: ImageData[];
  videos?: VideoData[];
  audio?: AudioData[];
  response_audio?: ResponseAudio;
  success?: boolean;
  error?: string;
  stop?: boolean;
  created_at?: number;
  duration?: number;
  metrics?: Metrics;
  metadata?: Record<string, unknown>;
  executor_type?: string;
  executor_name?: string;
}

/**
 * Step-level metrics for workflow execution.
 *
 * @public
 */
export interface StepMetrics {
  step_name: string;
  executor_type: string;
  executor_name: string;
  metrics?: Metrics;
}

/**
 * Workflow-level metrics including step breakdown.
 *
 * @public
 */
export interface WorkflowMetrics {
  steps?: Record<string, StepMetrics>;
  duration?: number;
}

// ---------------------------------------------------------------------------
// Base event interfaces per domain
// ---------------------------------------------------------------------------

/**
 * Base interface for agent run events.
 * All agent events extend this with domain-specific fields.
 *
 * @public
 */
export interface BaseAgentRunEvent extends StreamEvent {
  agent_id?: string;
  agent_name?: string;
  session_id?: string;
  workflow_id?: string;
  workflow_run_id?: string;
  step_id?: string;
  step_name?: string;
  step_index?: number;
  content?: unknown;
}

/**
 * Base interface for team run events.
 * All team events extend this with domain-specific fields.
 *
 * @public
 */
export interface BaseTeamRunEvent extends StreamEvent {
  team_id?: string;
  team_name?: string;
  session_id?: string;
  workflow_id?: string;
  workflow_run_id?: string;
  step_id?: string;
  step_name?: string;
  step_index?: number;
  content?: unknown;
}

/**
 * Base interface for workflow run events.
 * All workflow events extend this with domain-specific fields.
 *
 * @public
 */
export interface BaseWorkflowRunEvent extends StreamEvent {
  workflow_id?: string;
  workflow_name?: string;
  session_id?: string;
  step_id?: string;
  parent_step_id?: string;
}
