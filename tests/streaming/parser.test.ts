import { describe, expect, it } from "vitest";
import type { AgentRunEvent } from "../../src/streaming/events";
import { parseSSEResponse } from "../../src/streaming/parser";

/**
 * Create a mock SSE stream from event data.
 */
function createSSEStream(
  events: Array<{ event: string; data: object }>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const sseText = events
    .map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`)
    .join("");

  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(sseText));
      controller.close();
    },
  });
}

/**
 * Create a mock Response with SSE body.
 */
function createMockResponse(body: ReadableStream<Uint8Array> | null): Response {
  return {
    body,
    headers: new Headers({ "content-type": "text/event-stream" }),
    ok: true,
    status: 200,
  } as Response;
}

describe("parseSSEResponse", () => {
  it("yields single SSE event with correct shape", async () => {
    const stream = createSSEStream([
      {
        event: "RunStarted",
        data: {
          created_at: 1234567890,
          run_id: "run-123",
          session_id: "session-456",
          agent_id: "agent-789",
          agent_name: "Test Agent",
          model: "gpt-4",
          model_provider: "openai",
        },
      },
    ]);

    const response = createMockResponse(stream);
    const controller = new AbortController();
    const parser = parseSSEResponse(response, controller);

    const events: AgentRunEvent[] = [];
    for await (const event of parser) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      event: "RunStarted",
      created_at: 1234567890,
      run_id: "run-123",
      session_id: "session-456",
      agent_id: "agent-789",
      agent_name: "Test Agent",
      model: "gpt-4",
      model_provider: "openai",
    });
  });

  it("yields multiple events in order", async () => {
    const stream = createSSEStream([
      {
        event: "RunStarted",
        data: {
          created_at: 1000,
          run_id: "run-1",
          session_id: "session-1",
          agent_id: "agent-1",
          agent_name: "Agent",
          model: "gpt-4",
          model_provider: "openai",
        },
      },
      {
        event: "RunContent",
        data: {
          created_at: 2000,
          run_id: "run-1",
          content: "Hello",
          content_type: "text/plain",
        },
      },
      {
        event: "RunContent",
        data: {
          created_at: 3000,
          run_id: "run-1",
          content: " world",
          content_type: "text/plain",
        },
      },
      {
        event: "RunCompleted",
        data: {
          created_at: 4000,
          run_id: "run-1",
          session_id: "session-1",
          agent_id: "agent-1",
          agent_name: "Agent",
          content: "Hello world",
          content_type: "text/plain",
        },
      },
    ]);

    const response = createMockResponse(stream);
    const controller = new AbortController();
    const parser = parseSSEResponse(response, controller);

    const events: AgentRunEvent[] = [];
    for await (const event of parser) {
      events.push(event);
    }

    expect(events).toHaveLength(4);
    expect(events[0].event).toBe("RunStarted");
    expect(events[1].event).toBe("RunContent");
    expect(events[2].event).toBe("RunContent");
    expect(events[3].event).toBe("RunCompleted");

    // Verify order by timestamps
    expect(events.map((e) => e.created_at)).toEqual([1000, 2000, 3000, 4000]);
  });

  it("respects abort signal", async () => {
    const stream = createSSEStream([
      {
        event: "RunContent",
        data: {
          created_at: 1000,
          run_id: "run-1",
          content: "First",
          content_type: "text/plain",
        },
      },
      {
        event: "RunContent",
        data: {
          created_at: 2000,
          run_id: "run-1",
          content: "Second",
          content_type: "text/plain",
        },
      },
    ]);

    const response = createMockResponse(stream);
    const controller = new AbortController();
    const parser = parseSSEResponse(response, controller);

    const events: AgentRunEvent[] = [];
    let count = 0;

    for await (const event of parser) {
      events.push(event);
      count++;

      // Abort after first event
      if (count === 1) {
        controller.abort();
      }
    }

    // Should only get first event due to abort
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("RunContent");
    if (events[0].event === "RunContent") {
      expect(events[0].content).toBe("First");
    }
  });

  it("throws on null response body", async () => {
    const response = createMockResponse(null);
    const controller = new AbortController();

    await expect(async () => {
      const parser = parseSSEResponse(response, controller);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _event of parser) {
        // Should not reach here
      }
    }).rejects.toThrow("Response body is null");
  });

  it("skips events without data field", async () => {
    const encoder = new TextEncoder();
    // Create SSE stream with comment (no data field)
    const sseText =
      ": This is a comment\n\n" +
      'event: RunContent\ndata: {"created_at":1000,"run_id":"run-1","content":"Hello","content_type":"text/plain"}\n\n' +
      ": Another comment\n\n";

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sseText));
        controller.close();
      },
    });

    const response = createMockResponse(stream);
    const controller = new AbortController();
    const parser = parseSSEResponse(response, controller);

    const events: AgentRunEvent[] = [];
    for await (const event of parser) {
      events.push(event);
    }

    // Should only get the RunContent event, not comments
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("RunContent");
  });

  it("aborts controller on completion", async () => {
    const stream = createSSEStream([
      {
        event: "RunContent",
        data: {
          created_at: 1000,
          run_id: "run-1",
          content: "Test",
          content_type: "text/plain",
        },
      },
    ]);

    const response = createMockResponse(stream);
    const controller = new AbortController();
    const parser = parseSSEResponse(response, controller);

    expect(controller.signal.aborted).toBe(false);

    // Consume all events
    for await (const _event of parser) {
      // Process events
    }

    // Controller should be aborted after completion
    expect(controller.signal.aborted).toBe(true);
  });

  it("aborts controller on error", async () => {
    // Create stream that will cause JSON parse error
    const encoder = new TextEncoder();
    const sseText = "event: RunContent\ndata: {invalid json}\n\n";

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sseText));
        controller.close();
      },
    });

    const response = createMockResponse(stream);
    const controller = new AbortController();
    const parser = parseSSEResponse(response, controller);

    expect(controller.signal.aborted).toBe(false);

    await expect(async () => {
      for await (const _event of parser) {
        // Should throw before yielding
      }
    }).rejects.toThrow();

    // Controller should be aborted even on error
    expect(controller.signal.aborted).toBe(true);
  });

  it("handles event without explicit event field (defaults to message)", async () => {
    const encoder = new TextEncoder();
    // SSE event without "event:" line defaults to "message"
    const sseText =
      'data: {"created_at":1000,"run_id":"run-1","content":"Hello","content_type":"text/plain"}\n\n';

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sseText));
        controller.close();
      },
    });

    const response = createMockResponse(stream);
    const controller = new AbortController();
    const parser = parseSSEResponse(response, controller);

    const events: AgentRunEvent[] = [];
    for await (const event of parser) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    // Should default to 'message' when event field not specified
    expect(events[0].event).toBe("message");
  });
});
