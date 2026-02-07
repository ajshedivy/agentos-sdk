/**
 * Workflow streaming event interfaces (18 event types).
 *
 * @packageDocumentation
 */

import type {
  AudioData,
  BaseWorkflowRunEvent,
  ImageData,
  ResponseAudio,
  StepOutput,
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
 * Discriminated union of all workflow run streaming events (18 types).
 *
 * @public
 */
export type WorkflowRunEvent =
  | WorkflowStartedEvent
  | WorkflowCompletedEvent
  | WorkflowCancelledEvent
  | StepStartedEvent
  | StepCompletedEvent
  | StepOutputEvent
  | ConditionExecutionStartedEvent
  | ConditionExecutionCompletedEvent
  | ParallelExecutionStartedEvent
  | ParallelExecutionCompletedEvent
  | LoopExecutionStartedEvent
  | LoopIterationStartedEvent
  | LoopIterationCompletedEvent
  | LoopExecutionCompletedEvent
  | RouterExecutionStartedEvent
  | RouterExecutionCompletedEvent
  | StepsExecutionStartedEvent
  | StepsExecutionCompletedEvent;
