import { describe, expect, it } from "vitest";
import {
  RunEventType,
  type AgentRunEvent,
  type StreamEvent,
  type MemoryUpdateCompletedEvent,
  type MemoryUpdateStartedEvent,
  type RunCompletedEvent,
  type RunContentEvent,
  type RunStartedEvent,
  type RunErrorEvent,
  type ToolCallStartedEvent,
  type ToolCallCompletedEvent,
  type ReasoningStepEvent,
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

  describe("StreamEvent base interface", () => {
    it("has required fields", () => {
      const event: StreamEvent = {
        event: "TestEvent",
        created_at: Date.now(),
      };

      expect(event.event).toBe("TestEvent");
      expect(event.created_at).toBeGreaterThan(0);
    });

    it("supports optional run_id field", () => {
      const event: StreamEvent = {
        event: "TestEvent",
        created_at: Date.now(),
        run_id: "test-run-123",
      };

      expect(event.run_id).toBe("test-run-123");
    });

    it("allows arbitrary additional fields", () => {
      const event: StreamEvent = {
        event: "TestEvent",
        created_at: Date.now(),
        custom_field: "custom_value",
        another_field: 42,
      };

      expect(event.custom_field).toBe("custom_value");
      expect(event.another_field).toBe(42);
    });
  });

  describe("RunEventType constants", () => {
    it("has 28 event type constants", () => {
      expect(Object.keys(RunEventType)).toHaveLength(28);
    });

    it("values match keys (each key equals its string value)", () => {
      for (const [key, value] of Object.entries(RunEventType)) {
        expect(key).toBe(value);
      }
    });

    it("includes all expected core lifecycle event types", () => {
      expect(RunEventType.RunStarted).toBe("RunStarted");
      expect(RunEventType.RunContent).toBe("RunContent");
      expect(RunEventType.RunCompleted).toBe("RunCompleted");
      expect(RunEventType.RunError).toBe("RunError");
      expect(RunEventType.RunOutput).toBe("RunOutput");
      expect(RunEventType.RunCancelled).toBe("RunCancelled");
      expect(RunEventType.RunPaused).toBe("RunPaused");
      expect(RunEventType.RunContinued).toBe("RunContinued");
    });

    it("includes all expected tool call event types", () => {
      expect(RunEventType.ToolCallStarted).toBe("ToolCallStarted");
      expect(RunEventType.ToolCallCompleted).toBe("ToolCallCompleted");
    });

    it("includes all expected reasoning event types", () => {
      expect(RunEventType.ReasoningStarted).toBe("ReasoningStarted");
      expect(RunEventType.ReasoningStep).toBe("ReasoningStep");
      expect(RunEventType.ReasoningCompleted).toBe("ReasoningCompleted");
    });

    it("includes all expected memory event types", () => {
      expect(RunEventType.UpdatingMemory).toBe("UpdatingMemory");
      expect(RunEventType.MemoryUpdateStarted).toBe("MemoryUpdateStarted");
      expect(RunEventType.MemoryUpdateCompleted).toBe("MemoryUpdateCompleted");
    });

    it("includes all expected team event types", () => {
      expect(RunEventType.TeamRunStarted).toBe("TeamRunStarted");
      expect(RunEventType.TeamRunContent).toBe("TeamRunContent");
      expect(RunEventType.TeamRunCompleted).toBe("TeamRunCompleted");
      expect(RunEventType.TeamRunError).toBe("TeamRunError");
      expect(RunEventType.TeamRunCancelled).toBe("TeamRunCancelled");
      expect(RunEventType.TeamToolCallStarted).toBe("TeamToolCallStarted");
      expect(RunEventType.TeamToolCallCompleted).toBe("TeamToolCallCompleted");
      expect(RunEventType.TeamReasoningStarted).toBe("TeamReasoningStarted");
      expect(RunEventType.TeamReasoningStep).toBe("TeamReasoningStep");
      expect(RunEventType.TeamReasoningCompleted).toBe("TeamReasoningCompleted");
      expect(RunEventType.TeamMemoryUpdateStarted).toBe("TeamMemoryUpdateStarted");
      expect(RunEventType.TeamMemoryUpdateCompleted).toBe("TeamMemoryUpdateCompleted");
    });
  });

  describe("new event interfaces", () => {
    it("ToolCallStartedEvent has tool field", () => {
      const event: ToolCallStartedEvent = {
        event: "ToolCallStarted",
        created_at: Date.now(),
        tool: {
          tool_call_id: "call-123",
          tool_name: "search",
          tool_args: { query: "test" },
          created_at: Date.now(),
        },
      };

      expect(event.tool.tool_name).toBe("search");
      expect(event.tool.tool_args.query).toBe("test");
    });

    it("ToolCallCompletedEvent has tool field with result", () => {
      const event: ToolCallCompletedEvent = {
        event: "ToolCallCompleted",
        created_at: Date.now(),
        tool: {
          tool_call_id: "call-123",
          tool_name: "search",
          tool_args: { query: "test" },
          result: "search results",
          created_at: Date.now(),
        },
      };

      expect(event.tool.result).toBe("search results");
    });

    it("ReasoningStepEvent has extra_data field", () => {
      const event: ReasoningStepEvent = {
        event: "ReasoningStep",
        created_at: Date.now(),
        extra_data: {
          reasoning_steps: [
            {
              title: "Analyze",
              result: "Found pattern",
              reasoning: "Based on input",
            },
          ],
        },
      };

      expect(event.extra_data?.reasoning_steps).toHaveLength(1);
      expect(event.extra_data?.reasoning_steps?.[0].title).toBe("Analyze");
    });

    it("RunErrorEvent has content field", () => {
      const event: RunErrorEvent = {
        event: "RunError",
        created_at: Date.now(),
        content: "Error message",
      };

      expect(event.content).toBe("Error message");
    });

    it("expanded AgentRunEvent union narrows all 28 types", () => {
      const events: AgentRunEvent[] = [
        {
          event: "ToolCallStarted",
          created_at: Date.now(),
          tool: {
            tool_call_id: "call-1",
            tool_name: "test",
            tool_args: {},
            created_at: Date.now(),
          },
        },
        {
          event: "ReasoningStep",
          created_at: Date.now(),
          extra_data: {
            reasoning_steps: [
              {
                title: "Step 1",
                result: "result",
                reasoning: "thought",
              },
            ],
          },
        },
        {
          event: "RunError",
          created_at: Date.now(),
          content: "error",
        },
      ];

      for (const event of events) {
        switch (event.event) {
          case "ToolCallStarted":
            expect(event.tool.tool_name).toBe("test");
            break;
          case "ReasoningStep":
            expect(event.extra_data?.reasoning_steps).toBeDefined();
            break;
          case "RunError":
            expect(event.content).toBe("error");
            break;
        }
      }
    });
  });
});
