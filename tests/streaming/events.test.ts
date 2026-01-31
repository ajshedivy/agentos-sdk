import { describe, expect, it } from "vitest";
import type {
  AgentRunEvent,
  MemoryUpdateCompletedEvent,
  MemoryUpdateStartedEvent,
  RunCompletedEvent,
  RunContentEvent,
  RunStartedEvent,
} from "../../src/streaming/events";

describe("streaming event types", () => {
  describe("exports", () => {
    it("exports all event types", () => {
      // Type-only test - if this compiles, all types are exported
      const started: RunStartedEvent = {
        event: "RunStarted",
        created_at: Date.now(),
        run_id: "test-run",
        session_id: "test-session",
        agent_id: "test-agent",
        agent_name: "Test Agent",
        model: "gpt-4",
        model_provider: "openai",
      };

      const content: RunContentEvent = {
        event: "RunContent",
        created_at: Date.now(),
        run_id: "test-run",
        content: "Hello",
        content_type: "text/plain",
      };

      const completed: RunCompletedEvent = {
        event: "RunCompleted",
        created_at: Date.now(),
        run_id: "test-run",
        session_id: "test-session",
        agent_id: "test-agent",
        agent_name: "Test Agent",
        content: "Complete response",
        content_type: "text/plain",
      };

      const memoryStarted: MemoryUpdateStartedEvent = {
        event: "MemoryUpdateStarted",
        created_at: Date.now(),
        run_id: "test-run",
      };

      const memoryCompleted: MemoryUpdateCompletedEvent = {
        event: "MemoryUpdateCompleted",
        created_at: Date.now(),
        run_id: "test-run",
      };

      expect(started.event).toBe("RunStarted");
      expect(content.event).toBe("RunContent");
      expect(completed.event).toBe("RunCompleted");
      expect(memoryStarted.event).toBe("MemoryUpdateStarted");
      expect(memoryCompleted.event).toBe("MemoryUpdateCompleted");
    });
  });

  describe("discriminated union", () => {
    it("narrows types in switch statement", () => {
      const events: AgentRunEvent[] = [
        {
          event: "RunStarted",
          created_at: Date.now(),
          run_id: "test-run",
          session_id: "test-session",
          agent_id: "test-agent",
          agent_name: "Test Agent",
          model: "gpt-4",
          model_provider: "openai",
        },
        {
          event: "RunContent",
          created_at: Date.now(),
          run_id: "test-run",
          content: "Hello",
          content_type: "text/plain",
        },
        {
          event: "RunCompleted",
          created_at: Date.now(),
          run_id: "test-run",
          session_id: "test-session",
          agent_id: "test-agent",
          agent_name: "Test Agent",
          content: "Complete",
          content_type: "text/plain",
          metrics: {
            input_tokens: 10,
            output_tokens: 20,
            total_tokens: 30,
          },
        },
      ];

      for (const event of events) {
        switch (event.event) {
          case "RunStarted":
            // Type narrowed to RunStartedEvent
            expect(event.agent_name).toBe("Test Agent");
            expect(event.model).toBe("gpt-4");
            break;
          case "RunContent":
            // Type narrowed to RunContentEvent
            expect(event.content).toBe("Hello");
            expect(event.content_type).toBe("text/plain");
            break;
          case "RunCompleted":
            // Type narrowed to RunCompletedEvent
            expect(event.content).toBe("Complete");
            expect(event.metrics?.total_tokens).toBe(30);
            break;
          case "MemoryUpdateStarted":
          case "MemoryUpdateCompleted":
            // These won't execute in this test
            break;
        }
      }
    });

    it("narrows types with type guards", () => {
      const event: AgentRunEvent = {
        event: "RunContent",
        created_at: Date.now(),
        run_id: "test-run",
        content: "Test content",
        content_type: "text/plain",
      };

      if (event.event === "RunContent") {
        // Type narrowed to RunContentEvent
        expect(event.content).toBe("Test content");
        expect(event.content_type).toBe("text/plain");
      }
    });
  });

  describe("optional metrics field", () => {
    it("allows RunCompletedEvent without metrics", () => {
      const completed: RunCompletedEvent = {
        event: "RunCompleted",
        created_at: Date.now(),
        run_id: "test-run",
        session_id: "test-session",
        agent_id: "test-agent",
        agent_name: "Test Agent",
        content: "Complete",
        content_type: "text/plain",
      };

      expect(completed.metrics).toBeUndefined();
    });

    it("allows RunCompletedEvent with partial metrics", () => {
      const completed: RunCompletedEvent = {
        event: "RunCompleted",
        created_at: Date.now(),
        run_id: "test-run",
        session_id: "test-session",
        agent_id: "test-agent",
        agent_name: "Test Agent",
        content: "Complete",
        content_type: "text/plain",
        metrics: {
          input_tokens: 10,
          output_tokens: 20,
          total_tokens: 30,
          // time_to_first_token and duration omitted
        },
      };

      expect(completed.metrics?.total_tokens).toBe(30);
      expect(completed.metrics?.time_to_first_token).toBeUndefined();
    });
  });
});
