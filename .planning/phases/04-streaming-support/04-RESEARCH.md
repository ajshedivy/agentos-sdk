# Phase 4: Streaming Support - Research

**Researched:** 2026-01-31
**Domain:** Server-Sent Events (SSE) streaming with dual async iterator and event emitter interfaces
**Confidence:** HIGH

## Summary

Phase 4 implements SSE streaming for agent runs with dual consumption patterns: async iterators (`for await...of`) and event emitters (`.on('content', ...)`). The AgentOS API uses standard SSE format with typed events like `RunStarted`, `RunContent`, `MemoryUpdateStarted`, `MemoryUpdateCompleted`, and `RunCompleted`.

The research reveals that modern SSE parsing is well-supported via lightweight libraries like `eventsource-parser` (8.8M weekly downloads) or `parse-sse`. The Anthropic SDK pattern of a `Stream<T>` class implementing `AsyncIterable<T>` with an internal async generator is the industry standard. For the event emitter pattern, wrapping the iterator with typed `.on()` methods provides a familiar API for developers who prefer callback-based patterns.

HTTP/2 resolves the browser's 6-connection limit per domain, so SSE connection pooling is not a concern for modern deployments. The SDK should document this requirement for users running behind HTTP/1.1 proxies.

**Primary recommendation:** Use `eventsource-parser` for SSE parsing, implement a `AgentStream` class with `[Symbol.asyncIterator]()` for async iteration, and add typed `.on()` event handlers via an internal event emitter.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| eventsource-parser | ^3.0.0 | SSE message parsing | 8.8M weekly downloads, used by OpenAI/Anthropic SDKs, streaming TransformStream API |
| Native fetch | Built-in | HTTP streaming | Node 18+ has native fetch with ReadableStream support |
| Native AbortController | Built-in | Stream cancellation | Web standard, works in Node 18+ and browsers |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | - | - | No additional dependencies needed - native APIs suffice |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| eventsource-parser | parse-sse | parse-sse is smaller but eventsource-parser has TransformStream API |
| eventsource-parser | @microsoft/fetch-event-source | More features but larger (auto-reconnect, page visibility) - overkill for SDK |
| eventsource-parser | fetch-event-stream | Smaller (741b) but less mature, fewer downloads |
| Custom EventEmitter | mitt/emittery | External dependency vs inline implementation; SDK only needs typed .on() |

**Installation:**
```bash
npm install eventsource-parser
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── streaming/
│   ├── stream.ts         # AgentStream class (AsyncIterable + events)
│   ├── parser.ts         # SSE parsing utilities
│   ├── events.ts         # Typed event definitions
│   └── index.ts          # Public exports
├── resources/
│   └── agents.ts         # runStream(), continue(), cancel()
└── types.ts              # StreamOptions, event types
```

### Pattern 1: Stream Class with AsyncIterable
**What:** A `Stream<T>` class that implements `AsyncIterable<T>` via `[Symbol.asyncIterator]()`
**When to use:** Always - this is the core streaming abstraction
**Example:**
```typescript
// Source: Anthropic SDK pattern (verified)
export class AgentStream implements AsyncIterable<AgentRunEvent> {
  readonly controller: AbortController;
  private consumed = false;

  constructor(
    private iterator: () => AsyncIterator<AgentRunEvent>,
    controller: AbortController,
  ) {
    this.controller = controller;
  }

  [Symbol.asyncIterator](): AsyncIterator<AgentRunEvent> {
    if (this.consumed) {
      throw new Error('Stream already consumed. Use .tee() to split.');
    }
    this.consumed = true;
    return this.iterator();
  }

  abort(): void {
    this.controller.abort();
  }
}
```

### Pattern 2: Async Generator for SSE Parsing
**What:** Use async generator functions to yield parsed events from SSE stream
**When to use:** Internal implementation of stream iterator
**Example:**
```typescript
// Source: eventsource-parser documentation + Anthropic SDK pattern
import { EventSourceParserStream } from 'eventsource-parser/stream';

async function* parseSSEResponse(
  response: Response,
  controller: AbortController
): AsyncGenerator<AgentRunEvent> {
  const eventStream = response.body!
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream());

  try {
    for await (const event of eventStream) {
      if (controller.signal.aborted) break;

      // Skip comments and pings
      if (!event.data || event.event === 'ping') continue;

      const data = JSON.parse(event.data);
      yield {
        type: event.event ?? 'message',
        ...data
      } as AgentRunEvent;
    }
  } finally {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  }
}
```

### Pattern 3: Event Emitter Wrapper
**What:** Add `.on('eventType', callback)` methods to stream for familiar event-driven API
**When to use:** Alongside async iterator for developers who prefer callback patterns
**Example:**
```typescript
type EventHandler<T> = (event: T) => void;

class AgentStream implements AsyncIterable<AgentRunEvent> {
  private listeners = new Map<string, Set<EventHandler<unknown>>>();

  on<K extends AgentRunEvent['type']>(
    eventType: K,
    handler: EventHandler<Extract<AgentRunEvent, { type: K }>>
  ): this {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler as EventHandler<unknown>);
    return this;
  }

  // Start iteration and emit events
  async start(): Promise<void> {
    for await (const event of this) {
      const handlers = this.listeners.get(event.type);
      if (handlers) {
        for (const handler of handlers) {
          handler(event);
        }
      }
    }
  }
}
```

### Pattern 4: Discriminated Union for Event Types
**What:** Use TypeScript discriminated unions for type-safe event handling
**When to use:** All event type definitions
**Example:**
```typescript
// Source: OpenAI/Strands SDK patterns (verified)
interface RunStartedEvent {
  type: 'RunStarted';
  created_at: number;
  run_id: string;
  session_id: string;
  agent_id: string;
  agent_name: string;
  model: string;
  model_provider: string;
}

interface RunContentEvent {
  type: 'RunContent';
  created_at: number;
  run_id: string;
  content: string;
  content_type: string;
}

interface RunCompletedEvent {
  type: 'RunCompleted';
  created_at: number;
  run_id: string;
  session_id: string;
  agent_id: string;
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

// Discriminated union
type AgentRunEvent =
  | RunStartedEvent
  | RunContentEvent
  | RunCompletedEvent
  | MemoryUpdateStartedEvent
  | MemoryUpdateCompletedEvent;
```

### Anti-Patterns to Avoid
- **EventSource API for POST requests:** EventSource only supports GET. Use fetch with ReadableStream.
- **Manual SSE parsing:** Don't regex-parse SSE - use eventsource-parser for spec compliance.
- **Synchronous event iteration:** Never block on stream consumption - always async.
- **Ignoring AbortController:** Always wire up cancellation to prevent resource leaks.
- **Re-iterating consumed stream:** Throw error on second iteration; provide `.tee()` if needed.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE parsing | Custom regex parser | eventsource-parser | Handles buffering, multi-line data, chunking, spec compliance |
| Stream cancellation | Custom cleanup logic | AbortController | Web standard, automatic cleanup, signal propagation |
| Typed events | Generic object types | Discriminated unions | TypeScript narrows types automatically in switch/if |
| Async iteration | Promise chains | AsyncIterator protocol | Native `for await...of` support, better memory |

**Key insight:** SSE parsing looks trivial ("just split on double newline") but edge cases abound: multi-line `data:` fields, comments, reconnection with `id:`, chunked responses across message boundaries. Libraries handle all this.

## Common Pitfalls

### Pitfall 1: Not Handling Partial Chunks
**What goes wrong:** SSE messages arrive in chunks that may split mid-message
**Why it happens:** TCP/HTTP chunking doesn't respect SSE message boundaries
**How to avoid:** Use eventsource-parser which buffers until complete messages
**Warning signs:** Truncated events, JSON parse errors on partial data

### Pitfall 2: Memory Leaks from Unclosed Streams
**What goes wrong:** Stream resources not released when component unmounts or on error
**Why it happens:** Missing cleanup in finally blocks, not calling abort()
**How to avoid:** Always use try/finally with abort(), pass AbortSignal through
**Warning signs:** Growing memory usage, "stream already locked" errors

### Pitfall 3: Browser 6-Connection Limit (HTTP/1.1)
**What goes wrong:** Multiple tabs/streams exhaust connection limit, blocking new requests
**Why it happens:** HTTP/1.1 browsers limit concurrent connections per domain to 6
**How to avoid:** Require HTTP/2 (multiplexes connections), document limitation
**Warning signs:** Requests hanging indefinitely, only affecting users with many tabs

### Pitfall 4: Consuming Stream Twice
**What goes wrong:** Second `for await...of` loop fails silently or throws
**Why it happens:** Response body and ReadableStream are one-time readable
**How to avoid:** Track `consumed` flag, throw clear error, provide `.tee()` method
**Warning signs:** Empty iteration, mysterious "body already used" errors

### Pitfall 5: Not Distinguishing User Abort from Errors
**What goes wrong:** User cancellation treated as error, shown as failure
**Why it happens:** AbortError thrown like other errors
**How to avoid:** Check `error.name === 'AbortError'` and handle gracefully
**Warning signs:** "Request cancelled" shown as error to user

### Pitfall 6: Blocking on Event Handlers
**What goes wrong:** Slow `.on()` handler blocks stream iteration
**Why it happens:** Synchronous event emission waits for handler completion
**How to avoid:** Don't await handler results, or use queueMicrotask for handlers
**Warning signs:** Stream appears to pause, events bunch up

## Code Examples

Verified patterns from official sources:

### Create Streaming Request
```typescript
// Source: Existing SDK pattern + eventsource-parser docs
async function createStreamingRequest(
  url: string,
  body: FormData,
  headers: Record<string, string>,
  signal?: AbortSignal
): Promise<Response> {
  // Remove Content-Type for FormData (browser sets boundary)
  const { 'Content-Type': _, ...headersWithoutContentType } = headers;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...headersWithoutContentType,
      Accept: 'text/event-stream',
    },
    body,
    signal,
  });

  if (!response.ok) {
    throw await createErrorFromResponse(response);
  }

  if (!response.body) {
    throw new Error('Response body is null');
  }

  return response;
}
```

### Stream Class with Dual Interface
```typescript
// Source: Anthropic SDK pattern (adapted)
export class AgentStream implements AsyncIterable<AgentRunEvent> {
  readonly controller: AbortController;
  private consumed = false;
  private listeners = new Map<string, Set<(event: AgentRunEvent) => void>>();

  constructor(
    private iteratorFn: () => AsyncIterator<AgentRunEvent>,
    controller: AbortController,
  ) {
    this.controller = controller;
  }

  // AsyncIterable implementation
  [Symbol.asyncIterator](): AsyncIterator<AgentRunEvent> {
    if (this.consumed) {
      throw new Error('Stream already consumed');
    }
    this.consumed = true;
    return this.iteratorFn();
  }

  // Event emitter pattern
  on(eventType: string, handler: (event: AgentRunEvent) => void): this {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);
    return this;
  }

  // Consume stream and emit events
  async collect(): Promise<AgentRunEvent[]> {
    const events: AgentRunEvent[] = [];
    for await (const event of this) {
      events.push(event);
      this.emit(event);
    }
    return events;
  }

  private emit(event: AgentRunEvent): void {
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (e) {
          console.error('Event handler error:', e);
        }
      }
    }
  }

  // Cancellation
  abort(): void {
    this.controller.abort();
  }

  get aborted(): boolean {
    return this.controller.signal.aborted;
  }
}
```

### AgentsResource.runStream() Method
```typescript
// Source: Existing SDK pattern + streaming research
async runStream(
  agentId: string,
  options: StreamRunOptions
): Promise<AgentStream> {
  const formData = new FormData();
  formData.append('message', options.message);
  formData.append('stream', 'true');

  if (options.sessionId) formData.append('session_id', options.sessionId);
  if (options.userId) formData.append('user_id', options.userId);

  const controller = new AbortController();
  const url = `${this.baseUrl}/agents/${encodeURIComponent(agentId)}/runs`;

  const response = await this.client.requestStream(
    'POST',
    `/agents/${encodeURIComponent(agentId)}/runs`,
    { body: formData, signal: controller.signal }
  );

  return AgentStream.fromSSEResponse(response, controller);
}
```

### Cancel Running Agent
```typescript
// Source: OpenAPI spec + existing SDK pattern
async cancel(agentId: string, runId: string): Promise<void> {
  await this.client.request<void>(
    'POST',
    `/agents/${encodeURIComponent(agentId)}/runs/${encodeURIComponent(runId)}/cancel`
  );
}
```

### Continue Paused Run
```typescript
// Source: OpenAPI spec (Body_continue_agent_run schema)
interface ContinueOptions {
  tools: string;  // JSON string of tool results
  sessionId?: string;
  userId?: string;
  stream?: boolean;
}

async continue(
  agentId: string,
  runId: string,
  options: ContinueOptions
): Promise<AgentStream | unknown> {
  const formData = new FormData();
  formData.append('tools', options.tools);
  formData.append('stream', String(options.stream ?? true));

  if (options.sessionId) formData.append('session_id', options.sessionId);
  if (options.userId) formData.append('user_id', options.userId);

  if (options.stream !== false) {
    // Return stream for streaming mode
    const controller = new AbortController();
    const response = await this.client.requestStream(
      'POST',
      `/agents/${encodeURIComponent(agentId)}/runs/${encodeURIComponent(runId)}/continue`,
      { body: formData, signal: controller.signal }
    );
    return AgentStream.fromSSEResponse(response, controller);
  } else {
    // Return result for non-streaming mode
    return this.client.request(
      'POST',
      `/agents/${encodeURIComponent(agentId)}/runs/${encodeURIComponent(runId)}/continue`,
      { body: formData }
    );
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| EventSource API | fetch + ReadableStream | 2020+ | Enables POST, custom headers, typed events |
| Manual SSE parsing | eventsource-parser | 2023+ | Spec compliance, edge case handling |
| Callback hell | Async iterators | ES2018 | Cleaner code, `for await...of` syntax |
| Single interface | Dual iterator + events | 2024+ | Developer choice, framework flexibility |

**Deprecated/outdated:**
- **EventSource browser API**: Only supports GET, no custom headers, limited error handling
- **node-fetch polyfill**: Node 18+ has native fetch with streaming support
- **Manual SSE regex parsing**: Error-prone, doesn't handle chunking or multi-line data

## Open Questions

Things that couldn't be fully resolved:

1. **Exact event types from API**
   - What we know: RunStarted, RunContent, RunCompleted, MemoryUpdateStarted, MemoryUpdateCompleted from examples
   - What's unclear: Complete list of all possible events (ToolCallStarted? Error events?)
   - Recommendation: Start with documented events, add as discovered during implementation

2. **Stream reconnection behavior**
   - What we know: eventsource-parser supports `id` field for reconnection
   - What's unclear: Does AgentOS API support reconnection via Last-Event-ID header?
   - Recommendation: Implement basic reconnection support, test against real API

3. **Backpressure handling**
   - What we know: ReadableStream handles backpressure automatically
   - What's unclear: Optimal buffer sizes, handling slow consumers
   - Recommendation: Use defaults, monitor in production

## Sources

### Primary (HIGH confidence)
- [eventsource-parser npm](https://www.npmjs.com/package/eventsource-parser) - TransformStream API, usage patterns
- [Anthropic SDK streaming.ts](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/src/core/streaming.ts) - Stream class pattern, AsyncIterable implementation
- AgentOS OpenAPI spec (local: openapi.json) - Event examples, endpoint definitions

### Secondary (MEDIUM confidence)
- [MDN Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) - SSE format, browser limits
- [OpenAI Agents SDK Streaming](https://openai.github.io/openai-agents-js/guides/streaming/) - Event type patterns
- [Strands SDK AgentStreamEvent](https://strandsagents.com/latest/documentation/docs/api-reference/typescript/types/AgentStreamEvent.html) - Discriminated union patterns

### Tertiary (LOW confidence)
- [Chrome bug: 6 connection limit](https://bugs.chromium.org/p/chromium/issues/detail?id=275955) - HTTP/2 workaround confirmed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - eventsource-parser is established, native fetch supported
- Architecture: HIGH - Anthropic/OpenAI SDK patterns are well-documented
- Pitfalls: MEDIUM - some based on community experience, need validation
- Event types: MEDIUM - derived from OpenAPI examples, may be incomplete

**Research date:** 2026-01-31
**Valid until:** 2026-03-01 (30 days - streaming patterns are stable)
