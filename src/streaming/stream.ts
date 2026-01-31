import type { AgentRunEvent } from "./events";
import { parseSSEResponse } from "./parser";

/**
 * Stream of agent run events with dual consumption patterns.
 *
 * Supports two ways to consume events:
 * 1. Async iteration: `for await (const event of stream) { ... }`
 * 2. Event handlers: `stream.on('RunContent', handler).start()`
 *
 * @example Async iteration
 * ```typescript
 * const stream = await client.agents.runStream('agent-id', { message: 'Hi' });
 * for await (const event of stream) {
 *   if (event.event === 'RunContent') {
 *     console.log(event.content);
 *   }
 * }
 * ```
 *
 * @example Event handlers
 * ```typescript
 * const stream = await client.agents.runStream('agent-id', { message: 'Hi' });
 * await stream
 *   .on('RunContent', e => console.log(e.content))
 *   .on('RunCompleted', e => console.log('Done:', e.metrics))
 *   .start();
 * ```
 *
 * @public
 */
export class AgentStream implements AsyncIterable<AgentRunEvent> {
  readonly controller: AbortController;
  private consumed = false;
  private listeners = new Map<string, Set<(event: AgentRunEvent) => void>>();

  /**
   * @internal Use AgentStream.fromSSEResponse() to create instances
   */
  constructor(
    private iteratorFn: () => AsyncGenerator<AgentRunEvent>,
    controller: AbortController,
  ) {
    this.controller = controller;
  }

  /**
   * Create AgentStream from SSE Response.
   *
   * @param response - Fetch Response with text/event-stream body
   * @param controller - AbortController for stream cancellation
   * @returns AgentStream instance
   *
   * @public
   */
  static fromSSEResponse(
    response: Response,
    controller: AbortController,
  ): AgentStream {
    return new AgentStream(
      () => parseSSEResponse(response, controller),
      controller,
    );
  }

  /**
   * AsyncIterable implementation for for-await-of loops.
   * Can only be iterated once. Throws if already consumed.
   *
   * @public
   */
  [Symbol.asyncIterator](): AsyncIterator<AgentRunEvent> {
    if (this.consumed) {
      throw new Error(
        "Stream has already been consumed. " +
          "AgentStream can only be iterated once.",
      );
    }
    this.consumed = true;
    return this.iteratorFn();
  }

  /**
   * Register event handler for specific event type.
   * Chainable - returns this for fluent API.
   *
   * @param eventType - Event type to listen for (e.g., 'RunContent')
   * @param handler - Callback function for matching events
   *
   * @public
   */
  on<K extends AgentRunEvent["event"]>(
    eventType: K,
    handler: (event: Extract<AgentRunEvent, { event: K }>) => void,
  ): this {
    let handlers = this.listeners.get(eventType);
    if (!handlers) {
      handlers = new Set();
      this.listeners.set(eventType, handlers);
    }
    handlers.add(handler as (event: AgentRunEvent) => void);
    return this;
  }

  /**
   * Start consuming stream and dispatching events to handlers.
   * Must be called after registering handlers with .on().
   *
   * @returns Promise that resolves when stream completes
   *
   * @public
   */
  async start(): Promise<void> {
    for await (const event of this) {
      this.emit(event);
    }
  }

  /**
   * Abort the stream. Signals cancellation to the underlying fetch.
   *
   * @public
   */
  abort(): void {
    this.controller.abort();
  }

  /**
   * Check if stream has been aborted.
   *
   * @public
   */
  get aborted(): boolean {
    return this.controller.signal.aborted;
  }

  /**
   * Dispatch event to registered handlers.
   *
   * @internal
   */
  private emit(event: AgentRunEvent): void {
    const handlers = this.listeners.get(event.event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (error) {
          // Log but don't rethrow - don't break iteration on handler error
          console.error("Event handler error:", error);
        }
      }
    }
  }
}
