/**
 * Base event interface shared by all streaming events.
 *
 * @public
 */
export interface BaseEvent {
  created_at: number;
  run_id: string;
}

/**
 * Initial event sent when agent run starts.
 *
 * @public
 */
export interface RunStartedEvent extends BaseEvent {
  event: "RunStarted";
  session_id: string;
  agent_id: string;
  agent_name: string;
  model: string;
  model_provider: string;
}

/**
 * Content chunks streamed during agent execution.
 *
 * @public
 */
export interface RunContentEvent extends BaseEvent {
  event: "RunContent";
  content: string;
  content_type: string;
}

/**
 * Final event with complete response and metrics.
 *
 * @public
 */
export interface RunCompletedEvent extends BaseEvent {
  event: "RunCompleted";
  session_id: string;
  agent_id: string;
  agent_name: string;
  content: string;
  content_type: string;
  metrics?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    time_to_first_token?: number;
    duration?: number;
  };
}

/**
 * Memory operation start event.
 *
 * @public
 */
export interface MemoryUpdateStartedEvent extends BaseEvent {
  event: "MemoryUpdateStarted";
}

/**
 * Memory operation completion event.
 *
 * @public
 */
export interface MemoryUpdateCompletedEvent extends BaseEvent {
  event: "MemoryUpdateCompleted";
}

/**
 * Discriminated union of all agent run streaming events.
 *
 * Use the `event` field to narrow the type:
 * ```typescript
 * switch (event.event) {
 *   case 'RunStarted':
 *     // event is RunStartedEvent
 *     console.log(event.agent_name);
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
  | MemoryUpdateStartedEvent
  | MemoryUpdateCompletedEvent;
