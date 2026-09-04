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
  /** Run id of the agent/team/workflow this tool call started, if any */
  child_run_id?: string | null;
  stop_after_tool_call?: boolean;

  // Human-in-the-loop (HITL) fields, from agno's `ToolExecution`. These are
  // what a `RunRequirement.tool_execution` carries on a paused run and what
  // the agent/team continue routes read back (`confirmed`, answered
  // `user_input_schema` / `user_feedback_schema`, `result`).
  requires_confirmation?: boolean | null;
  /** Set to `true` / `false` to confirm or reject the tool call */
  confirmed?: boolean | null;
  confirmation_note?: string | null;
  requires_user_input?: boolean | null;
  user_input_schema?: UserInputField[] | null;
  user_feedback_schema?: UserFeedbackQuestion[] | null;
  answered?: boolean | null;
  external_execution_required?: boolean | null;
  external_execution_silent?: boolean | null;
  /** `"required"` (blocking) or `"audit"` (non-blocking audit trail) */
  approval_type?: string | null;
  approval_id?: string | null;
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
// Human-in-the-loop (HITL) supporting types
// ---------------------------------------------------------------------------

/**
 * A field the user must fill in to resolve a user-input pause.
 *
 * Wire shape of agno's `UserInputField`: `tools/function.py` for agent/team
 * tool pauses, `workflow/types.py` for workflow step pauses (which adds
 * `required` / `allowed_values`).
 *
 * @public
 */
export interface UserInputField {
  name: string;
  /** `"str"` | `"int"` | `"float"` | `"bool"` | `"list"` | `"dict"` */
  field_type: string;
  description?: string | null;
  /** Set this to answer the field */
  value?: unknown;
  required?: boolean;
  allowed_values?: unknown[] | null;
}

/**
 * One selectable option of a `UserFeedbackQuestion`.
 *
 * @public
 */
export interface UserFeedbackOption {
  label: string;
  description?: string | null;
  selected?: boolean;
}

/**
 * A structured question with predefined options (agno `UserFeedbackQuestion`).
 *
 * @public
 */
export interface UserFeedbackQuestion {
  question: string;
  header?: string | null;
  options?: UserFeedbackOption[];
  multi_select?: boolean;
  /** Set this (option labels) to answer the question */
  selected_options?: string[] | null;
}

/**
 * Requirement to complete a paused agent or team run (agno `RunRequirement`,
 * `run/requirement.py`).
 *
 * Carried by `RunPaused.requirements[]` / `TeamRunPaused.requirements[]` and
 * nested in `StepRequirement.executor_requirements[]` for workflow steps
 * whose agent/team executor paused. The agent and team continue routes read
 * these objects back: resolve the pause on `tool_execution` (`confirmed`,
 * answered `user_input_schema` / `user_feedback_schema`, `result`) — or on
 * the requirement-level mirrors `confirmation`, `user_input_schema`,
 * `user_feedback_schema`, `external_execution_result`, which the server
 * copies onto `tool_execution` when the nested value is unset.
 *
 * agno omits `null` fields when serializing this object.
 *
 * @public
 */
export interface RunRequirement {
  id: string;
  /** ISO-8601 timestamp */
  created_at: string;
  tool_execution?: ToolCallData;
  /** Confirmation decision (`true` confirm / `false` reject) */
  confirmation?: boolean;
  confirmation_note?: string;
  user_input_schema?: UserInputField[];
  user_feedback_schema?: UserFeedbackQuestion[];
  /** Result of an externally executed tool */
  external_execution_result?: string;
  /** Set when the requirement originates from a team member */
  member_agent_id?: string;
  member_agent_name?: string;
  member_run_id?: string;
}

/**
 * Structured task in a team's tasks mode (agno `TaskData`, `run/team.py`).
 *
 * @public
 */
export interface TeamTaskData {
  id: string;
  title: string;
  description: string;
  /** `"pending"` | `"in_progress"` | `"completed"` | `"failed"` | `"blocked"` */
  status: string;
  assignee?: string | null;
  dependencies: string[];
  result?: string | null;
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
 * Input prepared for a workflow step before it paused (agno `StepInput`).
 *
 * @public
 */
export interface StepInput {
  input?: string | Record<string, unknown> | unknown[] | null;
  previous_step_outputs?: Record<string, StepOutput>;
  previous_step_content?: string | null;
  additional_data?: Record<string, unknown> | null;
  images?: unknown[] | null;
  videos?: unknown[] | null;
  audio?: unknown[] | null;
  files?: unknown[] | null;
}

/**
 * Unified requirement for a paused workflow (agno `StepRequirement`,
 * `workflow/types.py`).
 *
 * Carried by `WorkflowPaused.step_requirements[]` (and by `getRun()` on a
 * paused run). `POST /workflows/{id}/runs/{run_id}/continue` reads this
 * array back with the decision stamped on the active (last) entry:
 * `confirmed` for a confirmation or output-review pause, `user_input` for a
 * user-input pause, `selected_choices` for a router pause, or `confirmed` on
 * each `executor_requirements[].tool_execution` for an agent/team tool pause
 * inside a step. Every entry must keep its `step_id`.
 *
 * Unlike `RunRequirement`, agno serializes unset fields as `null`. The
 * executor fields are only present when `requires_executor_input` is true.
 *
 * @public
 */
export interface StepRequirement {
  step_id: string;
  step_name?: string | null;
  step_index?: number | null;
  /**
   * Component that raised the pause: `"Function"` | `"Step"` | `"Steps"` |
   * `"Loop"` | `"Parallel"` | `"Condition"` | `"Router"` | `"Workflow"`
   */
  step_type?: string | null;

  // Confirmation (Step, Loop, Condition, Steps, Router)
  requires_confirmation?: boolean;
  confirmation_message?: string | null;
  /** Set to `true` / `false` to confirm or reject the step */
  confirmed?: boolean | null;
  /** `"skip"` | `"cancel"` | `"else"` | `"retry"` */
  on_reject?: string;

  // User input (Step)
  requires_user_input?: boolean;
  user_input_message?: string | null;
  user_input_schema?: UserInputField[];
  /** Set this (field name to value) to answer a user-input pause */
  user_input?: Record<string, unknown> | null;

  // Route selection (Router)
  requires_route_selection?: boolean;
  available_choices?: string[] | null;
  allow_multiple_selections?: boolean;
  /** Set this to answer a router pause */
  selected_choices?: string[] | null;

  /** The step input prepared before pausing */
  step_input?: StepInput;

  // Executor HITL (agent/team tool-level pause inside a step)
  requires_executor_input?: boolean;
  executor_requirements?: RunRequirement[];
  executor_id?: string | null;
  executor_name?: string | null;
  executor_run_id?: string | null;
  /** `"agent"` | `"team"` */
  executor_type?: string | null;
  executor_session_id?: string | null;

  // Post-execution output review
  requires_output_review?: boolean;
  output_review_message?: string | null;
  /** The executed output available for review */
  step_output?: StepOutput;
  is_post_execution?: boolean;
  /** Feedback for the agent when rejecting with `on_reject: "retry"` */
  rejection_feedback?: string | null;
  /** Human-edited replacement for `step_output` */
  edited_output?: unknown;

  // Retry / timeout
  retry_count?: number;
  max_retries?: number | null;
  /** ISO-8601 timestamp */
  timeout_at?: string | null;
  /** `"cancel"` | `"skip"` | `"approve"` */
  on_timeout?: string;
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

/**
 * Custom user-defined event (a `CustomEvent` subclass yielded from a tool or
 * hook).
 *
 * agno emits the same `event: "CustomEvent"` string for agent, team and
 * workflow custom events (`RunEvent`, `TeamRunEvent` and `WorkflowRunEvent`
 * all define `custom_event = "CustomEvent"`), so one shape carries the
 * optional base fields of all three domains and is a member of every run
 * event union. The user-defined payload arrives as extra keys.
 *
 * @public
 */
export interface CustomEvent
  extends BaseAgentRunEvent,
    BaseTeamRunEvent,
    BaseWorkflowRunEvent {
  event: "CustomEvent";
}
