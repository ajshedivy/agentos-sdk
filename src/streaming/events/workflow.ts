/**
 * Workflow streaming event interfaces (30 event types).
 *
 * @packageDocumentation
 */

import type {
  AudioData,
  BaseWorkflowRunEvent,
  ImageData,
  ResponseAudio,
  RunRequirement,
  StepOutput,
  StepRequirement,
  UserInputField,
  VideoData,
} from "./shared";

// ---------------------------------------------------------------------------
// Lifecycle events
// ---------------------------------------------------------------------------

/**
 * Workflow started event.
 *
 * @public
 */
export interface WorkflowStartedEvent extends BaseWorkflowRunEvent {
  event: "WorkflowStarted";
}

/**
 * Workflow completed event.
 *
 * @public
 */
export interface WorkflowCompletedEvent extends BaseWorkflowRunEvent {
  event: "WorkflowCompleted";
}

/**
 * Workflow paused for human input (HITL, agno >= 3.0).
 *
 * Carries the full paused state so a client can build a continue call from
 * this one event: `step_requirements` is the array `workflows.continue()`
 * sends back as `stepRequirements`, with the active (last) entry resolved.
 * Emitted after the step-level pause event (`StepPaused`,
 * `StepExecutorPaused`, `StepOutputReview` or `RouterPaused`).
 *
 * @public
 */
export interface WorkflowPausedEvent extends BaseWorkflowRunEvent {
  event: "WorkflowPaused";
  /** Run status of the paused run: `"PAUSED"` */
  status?: string;
  paused_step_index?: number;
  paused_step_name?: string;
  /** `"step"` (step-level pause) or `"executor"` (agent/team tool pause inside a step) */
  pause_kind?: string;
  /** Requirements to resolve before the run can continue */
  step_requirements?: StepRequirement[];
  /** Outputs of the steps that already ran; nested lists hold parallel / loop iteration results */
  step_results?: (StepOutput | StepOutput[])[];
  /** Serialized agno `RunOutput` / `TeamRunOutput` / `WorkflowRunOutput` of the executed steps */
  step_executor_runs?: Record<string, unknown>[];
  content?: string | object;
  metadata?: Record<string, unknown>;
}

/**
 * Workflow error event.
 *
 * The workflow-level counterpart of the agent `RunError` event. Note the
 * message field is `error`, not `content`. Carries the same agno >= 3.0
 * failure identity (`error_type` / `error_id`); see `RunErrorEvent`.
 *
 * @public
 */
export interface WorkflowErrorEvent extends BaseWorkflowRunEvent {
  event: "WorkflowError";
  error?: string;
  /** Machine-readable failure kind (agno >= 3.0), e.g. `"model_provider_error"` */
  error_type?: string;
  /** Stable error identifier (agno >= 3.0); agno currently mirrors `error_type` */
  error_id?: string;
  /** Extra structured context attached by the raising exception */
  additional_data?: Record<string, unknown>;
}

/**
 * Workflow cancelled event.
 *
 * @public
 */
export interface WorkflowCancelledEvent extends BaseWorkflowRunEvent {
  event: "WorkflowCancelled";
  reason?: string;
  is_cancelled?: boolean;
}

// ---------------------------------------------------------------------------
// Workflow agent events
// ---------------------------------------------------------------------------

/**
 * The workflow agent started (before it decides whether to run the
 * workflow or answer directly).
 *
 * @public
 */
export interface WorkflowAgentStartedEvent extends BaseWorkflowRunEvent {
  event: "WorkflowAgentStarted";
}

/**
 * The workflow agent completed (after running the workflow or answering
 * directly).
 *
 * @public
 */
export interface WorkflowAgentCompletedEvent extends BaseWorkflowRunEvent {
  event: "WorkflowAgentCompleted";
  content?: string | object;
}

// ---------------------------------------------------------------------------
// Step events
// ---------------------------------------------------------------------------

/**
 * Step started event.
 *
 * @public
 */
export interface StepStartedEvent extends BaseWorkflowRunEvent {
  event: "StepStarted";
  step_name?: string;
  step_index?: number | [number, number];
}

/**
 * Step completed event.
 *
 * @public
 */
export interface StepCompletedEvent extends BaseWorkflowRunEvent {
  event: "StepCompleted";
  step_name?: string;
  step_index?: number | [number, number];
  content?: string | object;
  content_type?: string;
  images?: ImageData[];
  videos?: VideoData[];
  audio?: AudioData[];
  response_audio?: ResponseAudio;
  step_response?: StepOutput;
}

/**
 * Step paused for confirmation or user input (step-level HITL). The
 * matching `StepRequirement` arrives on the `WorkflowPaused` event that
 * follows.
 *
 * @public
 */
export interface StepPausedEvent extends BaseWorkflowRunEvent {
  event: "StepPaused";
  step_name?: string;
  step_index?: number | [number, number];
  requires_confirmation: boolean;
  confirmation_message?: string;
  requires_user_input: boolean;
  user_input_message?: string;
  user_input_schema?: UserInputField[];
}

/**
 * Paused step resumed after its step-level HITL was resolved.
 *
 * @public
 */
export interface StepContinuedEvent extends BaseWorkflowRunEvent {
  event: "StepContinued";
  step_name?: string;
  step_index?: number | [number, number];
}

/**
 * A step's agent/team executor paused for tool-level HITL.
 *
 * @public
 */
export interface StepExecutorPausedEvent extends BaseWorkflowRunEvent {
  event: "StepExecutorPaused";
  step_name?: string;
  step_index?: number | [number, number];
  executor_id?: string;
  executor_name?: string;
  executor_run_id?: string;
  /** `"agent"` | `"team"` */
  executor_type?: string;
  /** Unresolved requirements of the paused executor run */
  executor_requirements?: RunRequirement[];
}

/**
 * Paused executor resumed after its tool-level HITL was resolved.
 *
 * @public
 */
export interface StepExecutorContinuedEvent extends BaseWorkflowRunEvent {
  event: "StepExecutorContinued";
  step_name?: string;
  step_index?: number | [number, number];
  executor_id?: string;
  executor_name?: string;
  executor_run_id?: string;
  /** `"agent"` | `"team"` */
  executor_type?: string;
}

/**
 * Step output requires human review before the workflow continues. The
 * output itself is on the `WorkflowPaused` event's `step_requirements[]`
 * (`step_output`).
 *
 * @public
 */
export interface StepOutputReviewEvent extends BaseWorkflowRunEvent {
  event: "StepOutputReview";
  step_name?: string;
  step_index?: number | [number, number];
  output_review_message?: string;
  requires_output_review: boolean;
}

/**
 * Step execution failed.
 *
 * @public
 */
export interface StepErrorEvent extends BaseWorkflowRunEvent {
  event: "StepError";
  step_name?: string;
  step_index?: number | [number, number];
  error?: string;
}

/**
 * Step output event.
 *
 * @public
 */
export interface StepOutputEvent extends BaseWorkflowRunEvent {
  event: "StepOutput";
  step_name?: string;
  step_index?: number | [number, number];
  step_output?: StepOutput;
  content?: string | object;
  images?: ImageData[];
  videos?: VideoData[];
  audio?: AudioData[];
  success?: boolean;
  error?: string;
  stop?: boolean;
}

// ---------------------------------------------------------------------------
// Condition events
// ---------------------------------------------------------------------------

/**
 * Condition execution started event.
 *
 * @public
 */
export interface ConditionExecutionStartedEvent extends BaseWorkflowRunEvent {
  event: "ConditionExecutionStarted";
  step_name?: string;
  step_index?: number | [number, number];
  condition_result?: boolean;
}

/**
 * Condition execution completed event.
 *
 * @public
 */
export interface ConditionExecutionCompletedEvent extends BaseWorkflowRunEvent {
  event: "ConditionExecutionCompleted";
  step_name?: string;
  step_index?: number | [number, number];
  condition_result?: boolean;
  executed_steps?: number;
  step_results?: StepOutput[];
}

/**
 * Condition paused event.
 *
 * agno 3.0.0 declares this value in `WorkflowRunEvent` but defines no event
 * dataclass for it and never emits it; a condition's confirmation pause is
 * reported as `StepPaused` + `WorkflowPaused` instead. Typed with the base
 * fields only so that the constant and the union stay complete.
 *
 * @public
 */
export interface ConditionPausedEvent extends BaseWorkflowRunEvent {
  event: "ConditionPaused";
}

// ---------------------------------------------------------------------------
// Parallel execution events
// ---------------------------------------------------------------------------

/**
 * Parallel execution started event.
 *
 * @public
 */
export interface ParallelExecutionStartedEvent extends BaseWorkflowRunEvent {
  event: "ParallelExecutionStarted";
  step_name?: string;
  step_index?: number | [number, number];
  parallel_step_count?: number;
}

/**
 * Parallel execution completed event.
 *
 * @public
 */
export interface ParallelExecutionCompletedEvent extends BaseWorkflowRunEvent {
  event: "ParallelExecutionCompleted";
  step_name?: string;
  step_index?: number | [number, number];
  parallel_step_count?: number;
  step_results?: StepOutput[];
}

// ---------------------------------------------------------------------------
// Loop events
// ---------------------------------------------------------------------------

/**
 * Loop execution started event.
 *
 * @public
 */
export interface LoopExecutionStartedEvent extends BaseWorkflowRunEvent {
  event: "LoopExecutionStarted";
  step_name?: string;
  step_index?: number | [number, number];
  max_iterations?: number;
}

/**
 * Loop iteration started event.
 *
 * @public
 */
export interface LoopIterationStartedEvent extends BaseWorkflowRunEvent {
  event: "LoopIterationStarted";
  step_name?: string;
  step_index?: number | [number, number];
  iteration?: number;
  max_iterations?: number;
}

/**
 * Loop iteration completed event.
 *
 * @public
 */
export interface LoopIterationCompletedEvent extends BaseWorkflowRunEvent {
  event: "LoopIterationCompleted";
  step_name?: string;
  step_index?: number | [number, number];
  iteration?: number;
  max_iterations?: number;
  iteration_results?: StepOutput[];
  should_continue?: boolean;
}

/**
 * Loop execution completed event.
 *
 * @public
 */
export interface LoopExecutionCompletedEvent extends BaseWorkflowRunEvent {
  event: "LoopExecutionCompleted";
  step_name?: string;
  step_index?: number | [number, number];
  total_iterations?: number;
  max_iterations?: number;
  all_results?: StepOutput[][];
}

// ---------------------------------------------------------------------------
// Router events
// ---------------------------------------------------------------------------

/**
 * Router execution started event.
 *
 * @public
 */
export interface RouterExecutionStartedEvent extends BaseWorkflowRunEvent {
  event: "RouterExecutionStarted";
  step_name?: string;
  step_index?: number | [number, number];
  selected_steps?: string[];
}

/**
 * Router execution completed event.
 *
 * @public
 */
export interface RouterExecutionCompletedEvent extends BaseWorkflowRunEvent {
  event: "RouterExecutionCompleted";
  step_name?: string;
  step_index?: number | [number, number];
  selected_steps?: string[];
  executed_steps?: number;
  step_results?: StepOutput[];
}

/**
 * Router paused for the user to pick a route (HITL). The selection is sent
 * back as `selected_choices` on the matching `StepRequirement` of the
 * `WorkflowPaused` event that follows.
 *
 * @public
 */
export interface RouterPausedEvent extends BaseWorkflowRunEvent {
  event: "RouterPaused";
  step_name?: string;
  step_index?: number | [number, number];
  /** Route names the user can choose from */
  available_choices: string[];
  user_input_message?: string;
  allow_multiple_selections: boolean;
}

// ---------------------------------------------------------------------------
// Steps group events
// ---------------------------------------------------------------------------

/**
 * Steps group execution started event.
 *
 * @public
 */
export interface StepsExecutionStartedEvent extends BaseWorkflowRunEvent {
  event: "StepsExecutionStarted";
  step_name?: string;
  step_index?: number | [number, number];
  steps_count?: number;
}

/**
 * Steps group execution completed event.
 *
 * @public
 */
export interface StepsExecutionCompletedEvent extends BaseWorkflowRunEvent {
  event: "StepsExecutionCompleted";
  step_name?: string;
  step_index?: number | [number, number];
  steps_count?: number;
  executed_steps?: number;
  step_results?: StepOutput[];
}

// ---------------------------------------------------------------------------
// Discriminated union
// ---------------------------------------------------------------------------

/**
 * Discriminated union of all workflow run streaming events (30 types).
 *
 * @public
 */
export type WorkflowRunEvent =
  | WorkflowStartedEvent
  | WorkflowCompletedEvent
  | WorkflowPausedEvent
  | WorkflowErrorEvent
  | WorkflowCancelledEvent
  | WorkflowAgentStartedEvent
  | WorkflowAgentCompletedEvent
  | StepStartedEvent
  | StepCompletedEvent
  | StepPausedEvent
  | StepContinuedEvent
  | StepExecutorPausedEvent
  | StepExecutorContinuedEvent
  | StepOutputReviewEvent
  | StepErrorEvent
  | StepOutputEvent
  | ConditionExecutionStartedEvent
  | ConditionExecutionCompletedEvent
  | ConditionPausedEvent
  | ParallelExecutionStartedEvent
  | ParallelExecutionCompletedEvent
  | LoopExecutionStartedEvent
  | LoopIterationStartedEvent
  | LoopIterationCompletedEvent
  | LoopExecutionCompletedEvent
  | RouterExecutionStartedEvent
  | RouterExecutionCompletedEvent
  | RouterPausedEvent
  | StepsExecutionStartedEvent
  | StepsExecutionCompletedEvent;
