import { describe, expect, it, vi } from "vitest";
import type {
  StreamEvent,
  RunCompletedEvent,
  RunContentEvent,
  RunStartedEvent,
} from "../../src/streaming/events";
import { AgentStream } from "../../src/streaming/stream";

/**
 * Create mock Response with SSE body.
 */
function createMockSSEResponse(
  events: Array<{ event: string; data: object }>,
): Response {
  const encoder = new TextEncoder();
  const sseText = events
    .map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`)
    .join("");

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(sseText));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}

/**
 * Sample events for tests.
 */
const sampleEvents: Array<{ event: string; data: object }> = [
  {
    event: "RunStarted",
    data: {
      created_at: 1000,
      run_id: "run-1",
      session_id: "sess-1",
      agent_id: "agent-1",
      agent_name: "Test Agent",
      model: "gpt-4",
      model_provider: "openai",
    },
  },
  {
    event: "RunContent",
    data: {
      created_at: 1001,
      run_id: "run-1",
      content: "Hello",
      content_type: "text/plain",
    },
  },
  {
    event: "RunContent",
    data: {
      created_at: 1002,
      run_id: "run-1",
      content: " world",
      content_type: "text/plain",
    },
  },
  {
    event: "RunCompleted",
    data: {
      created_at: 1003,
      run_id: "run-1",
      session_id: "sess-1",
      agent_id: "agent-1",
      agent_name: "Test Agent",
      content: "Hello world!",
      content_type: "text/plain",
      metrics: {
        input_tokens: 10,
        output_tokens: 5,
        total_tokens: 15,
        time_to_first_token: 100,
        duration: 500,
      },
    },
  },
];

describe("AgentStream", () => {
  describe("AsyncIterable interface", () => {
    it("iterates through all events in order", async () => {
      const response = createMockSSEResponse(sampleEvents);
      const controller = new AbortController();
      const stream = AgentStream.fromSSEResponse(response, controller);

      const collected: StreamEvent[] = [];
      for await (const event of stream) {
        collected.push(event);
      }

      expect(collected).toHaveLength(4);
      expect(collected[0].event).toBe("RunStarted");
      expect(collected[1].event).toBe("RunContent");
      expect(collected[2].event).toBe("RunContent");
      expect(collected[3].event).toBe("RunCompleted");
    });

    it("throws error when consumed twice", async () => {
      const response = createMockSSEResponse(sampleEvents);
      const controller = new AbortController();
      const stream = AgentStream.fromSSEResponse(response, controller);

      // First iteration consumes the stream
      const collected: StreamEvent[] = [];
      for await (const event of stream) {
        collected.push(event);
      }

      expect(collected).toHaveLength(4);

      // Second iteration should throw
      await expect(async () => {
        for await (const _event of stream) {
          // Should not execute
        }
      }).rejects.toThrow("Stream has already been consumed");
    });

    it("handles empty stream", async () => {
      const response = createMockSSEResponse([]);
      const controller = new AbortController();
      const stream = AgentStream.fromSSEResponse(response, controller);

      const collected: StreamEvent[] = [];
      for await (const event of stream) {
        collected.push(event);
      }

      expect(collected).toHaveLength(0);
    });

    it("yields correctly typed events", async () => {
      const response = createMockSSEResponse(sampleEvents);
      const controller = new AbortController();
      const stream = AgentStream.fromSSEResponse(response, controller);

      for await (const event of stream) {
        if (event.event === "RunStarted") {
          // TypeScript should narrow type
          const started = event as RunStartedEvent;
          expect(started.agent_name).toBe("Test Agent");
          expect(started.model).toBe("gpt-4");
        } else if (event.event === "RunContent") {
          const content = event as RunContentEvent;
          expect(content.content).toBeDefined();
          expect(content.content_type).toBe("text/plain");
        } else if (event.event === "RunCompleted") {
          const completed = event as RunCompletedEvent;
          expect(completed.content).toBe("Hello world!");
          expect(completed.metrics?.total_tokens).toBe(15);
        }
      }
    });
  });

  describe("Event emitter interface", () => {
    it("calls registered handler for matching events", async () => {
      const response = createMockSSEResponse(sampleEvents);
      const controller = new AbortController();
      const stream = AgentStream.fromSSEResponse(response, controller);

      const contentChunks: string[] = [];
      await stream
        .on("RunContent", (e) => {
          contentChunks.push(e.content);
        })
        .start();

      expect(contentChunks).toEqual(["Hello", " world"]);
    });

    it("supports multiple handlers for same event type", async () => {
      const response = createMockSSEResponse(sampleEvents);
      const controller = new AbortController();
      const stream = AgentStream.fromSSEResponse(response, controller);

      const chunks1: string[] = [];
      const chunks2: string[] = [];

      await stream
        .on("RunContent", (e) => {
          chunks1.push(e.content);
        })
        .on("RunContent", (e) => {
          chunks2.push(e.content);
        })
        .start();

      expect(chunks1).toEqual(["Hello", " world"]);
      expect(chunks2).toEqual(["Hello", " world"]);
    });

    it("handler receives correctly typed event", async () => {
      const response = createMockSSEResponse(sampleEvents);
      const controller = new AbortController();
      const stream = AgentStream.fromSSEResponse(response, controller);

      let startedEvent: RunStartedEvent | null = null;
      let completedEvent: RunCompletedEvent | null = null;

      await stream
        .on("RunStarted", (e) => {
          startedEvent = e;
        })
        .on("RunCompleted", (e) => {
          completedEvent = e;
        })
        .start();

      expect(startedEvent).not.toBeNull();
      expect(startedEvent?.agent_name).toBe("Test Agent");
      expect(startedEvent?.model_provider).toBe("openai");

      expect(completedEvent).not.toBeNull();
      expect(completedEvent?.content).toBe("Hello world!");
      expect(completedEvent?.metrics?.input_tokens).toBe(10);
    });

    it("non-matching events don't trigger handlers", async () => {
      const response = createMockSSEResponse(sampleEvents);
      const controller = new AbortController();
      const stream = AgentStream.fromSSEResponse(response, controller);

      const startedCount = vi.fn();

      await stream.on("RunStarted", startedCount).start();

      // Only 1 RunStarted event in sample data
      expect(startedCount).toHaveBeenCalledTimes(1);
    });

    it("handler errors don't break iteration", async () => {
      const response = createMockSSEResponse(sampleEvents);
      const controller = new AbortController();
      const stream = AgentStream.fromSSEResponse(response, controller);

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const contentChunks: string[] = [];

      await stream
        .on("RunContent", () => {
          throw new Error("Handler error");
        })
        .on("RunContent", (e) => {
          // This handler should still execute
          contentChunks.push(e.content);
        })
        .start();

      // Second handler should have received both events
      expect(contentChunks).toEqual(["Hello", " world"]);

      // Error should have been logged
      expect(errorSpy).toHaveBeenCalledTimes(2);

      errorSpy.mockRestore();
    });

    it("supports chaining multiple event types", async () => {
      const response = createMockSSEResponse(sampleEvents);
      const controller = new AbortController();
      const stream = AgentStream.fromSSEResponse(response, controller);

      let started = false;
      const content: string[] = [];
      let completed = false;

      await stream
        .on("RunStarted", () => {
          started = true;
        })
        .on("RunContent", (e) => {
          content.push(e.content);
        })
        .on("RunCompleted", () => {
          completed = true;
        })
        .start();

      expect(started).toBe(true);
      expect(content).toEqual(["Hello", " world"]);
      expect(completed).toBe(true);
    });
  });

  describe("Cancellation", () => {
    it("abort() sets controller.signal.aborted to true", async () => {
      const response = createMockSSEResponse(sampleEvents);
      const controller = new AbortController();
      const stream = AgentStream.fromSSEResponse(response, controller);

      expect(stream.aborted).toBe(false);
      expect(controller.signal.aborted).toBe(false);

      stream.abort();

      expect(stream.aborted).toBe(true);
      expect(controller.signal.aborted).toBe(true);
    });

    it("aborted getter reflects controller state", async () => {
      const response = createMockSSEResponse(sampleEvents);
      const controller = new AbortController();
      const stream = AgentStream.fromSSEResponse(response, controller);

      expect(stream.aborted).toBe(false);

      controller.abort();

      expect(stream.aborted).toBe(true);
    });

    it("iteration stops when aborted", async () => {
      const response = createMockSSEResponse(sampleEvents);
      const controller = new AbortController();
      const stream = AgentStream.fromSSEResponse(response, controller);

      const collected: StreamEvent[] = [];

      for await (const event of stream) {
        collected.push(event);
        if (event.event === "RunContent") {
          // Abort after first content event
          stream.abort();
        }
      }

      // Should have RunStarted and first RunContent, but not second RunContent or RunCompleted
      expect(collected.length).toBeLessThan(4);
      expect(collected[0].event).toBe("RunStarted");
      expect(collected[1].event).toBe("RunContent");
    });
  });

  describe("Factory method", () => {
    it("fromSSEResponse creates valid stream", async () => {
      const response = createMockSSEResponse(sampleEvents);
      const controller = new AbortController();
      const stream = AgentStream.fromSSEResponse(response, controller);

      expect(stream).toBeInstanceOf(AgentStream);
      expect(stream.controller).toBe(controller);

      const collected: StreamEvent[] = [];
      for await (const event of stream) {
        collected.push(event);
      }

      expect(collected).toHaveLength(4);
    });

    it("throws on null response body", async () => {
      const response = new Response(null);
      const controller = new AbortController();
      const stream = AgentStream.fromSSEResponse(response, controller);

      await expect(async () => {
        for await (const _event of stream) {
          // Should not execute
        }
      }).rejects.toThrow("Response body is null");
    });
  });

  describe("String-based event handler", () => {
    it("accepts string event type for unknown events", async () => {
      // Create a stream with a custom event type not in the RunEventType union
      const customEvents = [
        {
          event: "CustomEvent",
          data: {
            created_at: 1000,
            run_id: "run-1",
            custom_field: "custom_value",
          },
        },
      ];

      const response = createMockSSEResponse(customEvents);
      const controller = new AbortController();
      const stream = AgentStream.fromSSEResponse(response, controller);

      const receivedEvents: StreamEvent[] = [];

      // Use string literal for custom event type (catch-all overload)
      await stream
        .on("CustomEvent", (event) => {
          receivedEvents.push(event);
        })
        .start();

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0].event).toBe("CustomEvent");
      expect((receivedEvents[0] as any).custom_field).toBe("custom_value");
    });
  });
});
