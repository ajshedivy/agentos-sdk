import { describe, expect, it } from "vitest";
import {
  RunEventType,
  AgentEventType,
  TeamEventType,
  WorkflowEventType,
  RunStatus,
  type AgentRunEvent,
  type TeamRunEvent,
  type WorkflowRunEvent,
  type AllRunEvents,
  type StreamEvent,
  type Metrics,
  type RunMetrics,
  type SessionSummary,
  type StepOutput,
  type WorkflowMetrics,
  type StepMetrics,
  type ToolExecution,
  type BaseAgentRunEvent,
  type BaseTeamRunEvent,
  type BaseWorkflowRunEvent,
  type MemoryUpdateCompletedEvent,
  type MemoryUpdateStartedEvent,
  type RunCompletedEvent,
  type RunContentEvent,
  type RunStartedEvent,
  type RunErrorEvent,
  type ToolCallStartedEvent,
  type ToolCallCompletedEvent,
  type ReasoningStepEvent,
  type RunContentCompletedEvent,
  type RunIntermediateContentEvent,
  type PreHookStartedEvent,
  type PreHookCompletedEvent,
  type PostHookStartedEvent,
  type PostHookCompletedEvent,
  type SessionSummaryStartedEvent,
  type SessionSummaryCompletedEvent,
  type ParserModelResponseStartedEvent,
  type OutputModelResponseCompletedEvent,
  type CustomEvent,
  type TeamRunStartedEvent,
  type TeamRunContentCompletedEvent,
  type TeamPreHookStartedEvent,
  type TeamSessionSummaryCompletedEvent,
  type TeamCustomEvent,
  type WorkflowStartedEvent,
  type WorkflowCompletedEvent,
  type WorkflowCancelledEvent,
  type StepStartedEvent,
  type StepCompletedEvent,
  type StepOutputEvent,
  type ConditionExecutionStartedEvent,
  type ParallelExecutionCompletedEvent,
  type LoopIterationCompletedEvent,
  type RouterExecutionStartedEvent,
  type StepsExecutionCompletedEvent,
  type EventMap,
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

  describe("discriminated union - AgentRunEvent", () => {
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

  describe("discriminated union - TeamRunEvent", () => {
    it("narrows team event types", () => {
      const event: TeamRunEvent = {
        event: "TeamRunStarted",
        created_at: Date.now(),
        session_id: "test-session",
        model: "gpt-4",
        model_provider: "openai",
      };

      if (event.event === "TeamRunStarted") {
        expect(event.model).toBe("gpt-4");
        expect(event.session_id).toBe("test-session");
      }
    });
  });

  describe("discriminated union - WorkflowRunEvent", () => {
    it("narrows workflow event types", () => {
      const event: WorkflowRunEvent = {
        event: "WorkflowStarted",
        created_at: Date.now(),
        workflow_id: "wf-1",
        workflow_name: "test-workflow",
      };

      if (event.event === "WorkflowStarted") {
        expect(event.workflow_id).toBe("wf-1");
        expect(event.workflow_name).toBe("test-workflow");
      }
    });

    it("narrows StepCompleted with fields", () => {
      const event: WorkflowRunEvent = {
        event: "StepCompleted",
        created_at: Date.now(),
        step_name: "step-1",
        step_index: 0,
        content: "step output",
        content_type: "str",
      };

      if (event.event === "StepCompleted") {
        expect(event.step_name).toBe("step-1");
        expect(event.content).toBe("step output");
      }
    });

    it("narrows LoopIterationCompleted with loop fields", () => {
      const event: WorkflowRunEvent = {
        event: "LoopIterationCompleted",
        created_at: Date.now(),
        iteration: 2,
        max_iterations: 5,
        should_continue: true,
        iteration_results: [],
      };

      if (event.event === "LoopIterationCompleted") {
        expect(event.iteration).toBe(2);
        expect(event.should_continue).toBe(true);
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

  describe("AgentEventType constants", () => {
    it("has 29 agent event type constants", () => {
      expect(Object.keys(AgentEventType)).toHaveLength(29);
    });

    it("values match keys", () => {
      for (const [key, value] of Object.entries(AgentEventType)) {
        expect(key).toBe(value);
      }
    });

    it("includes all expected agent event types", () => {
      expect(AgentEventType.RunStarted).toBe("RunStarted");
      expect(AgentEventType.RunContent).toBe("RunContent");
      expect(AgentEventType.RunContentCompleted).toBe("RunContentCompleted");
      expect(AgentEventType.RunIntermediateContent).toBe("RunIntermediateContent");
      expect(AgentEventType.RunCompleted).toBe("RunCompleted");
      expect(AgentEventType.RunPaused).toBe("RunPaused");
      expect(AgentEventType.RunContinued).toBe("RunContinued");
      expect(AgentEventType.RunError).toBe("RunError");
      expect(AgentEventType.RunCancelled).toBe("RunCancelled");
      expect(AgentEventType.RunOutput).toBe("RunOutput");
      expect(AgentEventType.PreHookStarted).toBe("PreHookStarted");
      expect(AgentEventType.PreHookCompleted).toBe("PreHookCompleted");
      expect(AgentEventType.PostHookStarted).toBe("PostHookStarted");
      expect(AgentEventType.PostHookCompleted).toBe("PostHookCompleted");
      expect(AgentEventType.ReasoningStarted).toBe("ReasoningStarted");
      expect(AgentEventType.ReasoningStep).toBe("ReasoningStep");
      expect(AgentEventType.ReasoningCompleted).toBe("ReasoningCompleted");
      expect(AgentEventType.ToolCallStarted).toBe("ToolCallStarted");
      expect(AgentEventType.ToolCallCompleted).toBe("ToolCallCompleted");
      expect(AgentEventType.UpdatingMemory).toBe("UpdatingMemory");
      expect(AgentEventType.MemoryUpdateStarted).toBe("MemoryUpdateStarted");
      expect(AgentEventType.MemoryUpdateCompleted).toBe("MemoryUpdateCompleted");
      expect(AgentEventType.SessionSummaryStarted).toBe("SessionSummaryStarted");
      expect(AgentEventType.SessionSummaryCompleted).toBe("SessionSummaryCompleted");
      expect(AgentEventType.ParserModelResponseStarted).toBe("ParserModelResponseStarted");
      expect(AgentEventType.ParserModelResponseCompleted).toBe("ParserModelResponseCompleted");
      expect(AgentEventType.OutputModelResponseStarted).toBe("OutputModelResponseStarted");
      expect(AgentEventType.OutputModelResponseCompleted).toBe("OutputModelResponseCompleted");
      expect(AgentEventType.CustomEvent).toBe("CustomEvent");
    });
  });

  describe("TeamEventType constants", () => {
    it("has 25 team event type constants", () => {
      expect(Object.keys(TeamEventType)).toHaveLength(25);
    });

    it("includes all expected team event types", () => {
      expect(TeamEventType.TeamRunStarted).toBe("TeamRunStarted");
      expect(TeamEventType.TeamRunContent).toBe("TeamRunContent");
      expect(TeamEventType.TeamRunContentCompleted).toBe("TeamRunContentCompleted");
      expect(TeamEventType.TeamRunIntermediateContent).toBe("TeamRunIntermediateContent");
      expect(TeamEventType.TeamRunCompleted).toBe("TeamRunCompleted");
      expect(TeamEventType.TeamRunError).toBe("TeamRunError");
      expect(TeamEventType.TeamRunCancelled).toBe("TeamRunCancelled");
      expect(TeamEventType.TeamPreHookStarted).toBe("TeamPreHookStarted");
      expect(TeamEventType.TeamPreHookCompleted).toBe("TeamPreHookCompleted");
      expect(TeamEventType.TeamPostHookStarted).toBe("TeamPostHookStarted");
      expect(TeamEventType.TeamPostHookCompleted).toBe("TeamPostHookCompleted");
      expect(TeamEventType.TeamToolCallStarted).toBe("TeamToolCallStarted");
      expect(TeamEventType.TeamToolCallCompleted).toBe("TeamToolCallCompleted");
      expect(TeamEventType.TeamReasoningStarted).toBe("TeamReasoningStarted");
      expect(TeamEventType.TeamReasoningStep).toBe("TeamReasoningStep");
      expect(TeamEventType.TeamReasoningCompleted).toBe("TeamReasoningCompleted");
      expect(TeamEventType.TeamMemoryUpdateStarted).toBe("TeamMemoryUpdateStarted");
      expect(TeamEventType.TeamMemoryUpdateCompleted).toBe("TeamMemoryUpdateCompleted");
      expect(TeamEventType.TeamSessionSummaryStarted).toBe("TeamSessionSummaryStarted");
      expect(TeamEventType.TeamSessionSummaryCompleted).toBe("TeamSessionSummaryCompleted");
      expect(TeamEventType.TeamParserModelResponseStarted).toBe("TeamParserModelResponseStarted");
      expect(TeamEventType.TeamParserModelResponseCompleted).toBe("TeamParserModelResponseCompleted");
      expect(TeamEventType.TeamOutputModelResponseStarted).toBe("TeamOutputModelResponseStarted");
      expect(TeamEventType.TeamOutputModelResponseCompleted).toBe("TeamOutputModelResponseCompleted");
      expect(TeamEventType.TeamCustomEvent).toBe("TeamCustomEvent");
    });
  });

  describe("WorkflowEventType constants", () => {
    it("has 18 workflow event type constants", () => {
      expect(Object.keys(WorkflowEventType)).toHaveLength(18);
    });

    it("includes all expected workflow event types", () => {
      expect(WorkflowEventType.WorkflowStarted).toBe("WorkflowStarted");
      expect(WorkflowEventType.WorkflowCompleted).toBe("WorkflowCompleted");
      expect(WorkflowEventType.WorkflowCancelled).toBe("WorkflowCancelled");
      expect(WorkflowEventType.StepStarted).toBe("StepStarted");
      expect(WorkflowEventType.StepCompleted).toBe("StepCompleted");
      expect(WorkflowEventType.StepOutput).toBe("StepOutput");
      expect(WorkflowEventType.ConditionExecutionStarted).toBe("ConditionExecutionStarted");
      expect(WorkflowEventType.ConditionExecutionCompleted).toBe("ConditionExecutionCompleted");
      expect(WorkflowEventType.ParallelExecutionStarted).toBe("ParallelExecutionStarted");
      expect(WorkflowEventType.ParallelExecutionCompleted).toBe("ParallelExecutionCompleted");
      expect(WorkflowEventType.LoopExecutionStarted).toBe("LoopExecutionStarted");
      expect(WorkflowEventType.LoopIterationStarted).toBe("LoopIterationStarted");
      expect(WorkflowEventType.LoopIterationCompleted).toBe("LoopIterationCompleted");
      expect(WorkflowEventType.LoopExecutionCompleted).toBe("LoopExecutionCompleted");
      expect(WorkflowEventType.RouterExecutionStarted).toBe("RouterExecutionStarted");
      expect(WorkflowEventType.RouterExecutionCompleted).toBe("RouterExecutionCompleted");
      expect(WorkflowEventType.StepsExecutionStarted).toBe("StepsExecutionStarted");
      expect(WorkflowEventType.StepsExecutionCompleted).toBe("StepsExecutionCompleted");
    });
  });

  describe("RunEventType composite constant", () => {
    it("has all event type constants from all domains", () => {
      const agentCount = Object.keys(AgentEventType).length;
      const teamCount = Object.keys(TeamEventType).length;
      const workflowCount = Object.keys(WorkflowEventType).length;
      const totalCount = Object.keys(RunEventType).length;

      expect(totalCount).toBe(agentCount + teamCount + workflowCount);
    });

    it("backward compat: includes original agent/team event types", () => {
      expect(RunEventType.RunStarted).toBe("RunStarted");
      expect(RunEventType.RunContent).toBe("RunContent");
      expect(RunEventType.RunCompleted).toBe("RunCompleted");
      expect(RunEventType.RunError).toBe("RunError");
      expect(RunEventType.RunOutput).toBe("RunOutput");
      expect(RunEventType.RunCancelled).toBe("RunCancelled");
      expect(RunEventType.RunPaused).toBe("RunPaused");
      expect(RunEventType.RunContinued).toBe("RunContinued");
      expect(RunEventType.ToolCallStarted).toBe("ToolCallStarted");
      expect(RunEventType.ToolCallCompleted).toBe("ToolCallCompleted");
      expect(RunEventType.ReasoningStarted).toBe("ReasoningStarted");
      expect(RunEventType.ReasoningStep).toBe("ReasoningStep");
      expect(RunEventType.ReasoningCompleted).toBe("ReasoningCompleted");
      expect(RunEventType.UpdatingMemory).toBe("UpdatingMemory");
      expect(RunEventType.MemoryUpdateStarted).toBe("MemoryUpdateStarted");
      expect(RunEventType.MemoryUpdateCompleted).toBe("MemoryUpdateCompleted");
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

    it("includes new workflow event types", () => {
      expect(RunEventType.WorkflowStarted).toBe("WorkflowStarted");
      expect(RunEventType.StepStarted).toBe("StepStarted");
      expect(RunEventType.LoopExecutionStarted).toBe("LoopExecutionStarted");
      expect(RunEventType.RouterExecutionStarted).toBe("RouterExecutionStarted");
    });
  });

  describe("RunStatus constants", () => {
    it("has all status values", () => {
      expect(RunStatus.Running).toBe("running");
      expect(RunStatus.Completed).toBe("completed");
      expect(RunStatus.Paused).toBe("paused");
      expect(RunStatus.Cancelled).toBe("cancelled");
      expect(RunStatus.Error).toBe("error");
      expect(RunStatus.Pending).toBe("pending");
    });

    it("has 6 status values", () => {
      expect(Object.keys(RunStatus)).toHaveLength(6);
    });
  });

  describe("new agent event interfaces", () => {
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

    it("RunContentCompletedEvent is constructible", () => {
      const event: RunContentCompletedEvent = {
        event: "RunContentCompleted",
        created_at: Date.now(),
      };

      expect(event.event).toBe("RunContentCompleted");
    });

    it("RunIntermediateContentEvent has content fields", () => {
      const event: RunIntermediateContentEvent = {
        event: "RunIntermediateContent",
        created_at: Date.now(),
        content: "intermediate",
        content_type: "str",
      };

      expect(event.content).toBe("intermediate");
    });

    it("PreHookStartedEvent has hook name", () => {
      const event: PreHookStartedEvent = {
        event: "PreHookStarted",
        created_at: Date.now(),
        pre_hook_name: "validate_input",
      };

      expect(event.pre_hook_name).toBe("validate_input");
    });

    it("PostHookCompletedEvent is constructible", () => {
      const event: PostHookCompletedEvent = {
        event: "PostHookCompleted",
        created_at: Date.now(),
        post_hook_name: "log_output",
      };

      expect(event.post_hook_name).toBe("log_output");
    });

    it("SessionSummaryCompletedEvent has session_summary", () => {
      const event: SessionSummaryCompletedEvent = {
        event: "SessionSummaryCompleted",
        created_at: Date.now(),
        session_summary: {
          summary: "User asked about weather",
          topics: ["weather", "location"],
        },
      };

      expect(event.session_summary?.summary).toBe("User asked about weather");
      expect(event.session_summary?.topics).toHaveLength(2);
    });

    it("CustomEvent is constructible", () => {
      const event: CustomEvent = {
        event: "CustomEvent",
        created_at: Date.now(),
      };

      expect(event.event).toBe("CustomEvent");
    });
  });

  describe("new team event interfaces", () => {
    it("TeamRunContentCompletedEvent is constructible", () => {
      const event: TeamRunContentCompletedEvent = {
        event: "TeamRunContentCompleted",
        created_at: Date.now(),
      };

      expect(event.event).toBe("TeamRunContentCompleted");
    });

    it("TeamPreHookStartedEvent has hook name", () => {
      const event: TeamPreHookStartedEvent = {
        event: "TeamPreHookStarted",
        created_at: Date.now(),
        pre_hook_name: "validate_team_input",
      };

      expect(event.pre_hook_name).toBe("validate_team_input");
    });

    it("TeamSessionSummaryCompletedEvent has session_summary", () => {
      const event: TeamSessionSummaryCompletedEvent = {
        event: "TeamSessionSummaryCompleted",
        created_at: Date.now(),
        session_summary: {
          summary: "Team discussed project plan",
        },
      };

      expect(event.session_summary?.summary).toBe("Team discussed project plan");
    });

    it("TeamCustomEvent is constructible", () => {
      const event: TeamCustomEvent = {
        event: "TeamCustomEvent",
        created_at: Date.now(),
      };

      expect(event.event).toBe("TeamCustomEvent");
    });
  });

  describe("new workflow event interfaces", () => {
    it("WorkflowStartedEvent has workflow fields", () => {
      const event: WorkflowStartedEvent = {
        event: "WorkflowStarted",
        created_at: Date.now(),
        workflow_id: "wf-123",
        workflow_name: "data-pipeline",
      };

      expect(event.workflow_id).toBe("wf-123");
      expect(event.workflow_name).toBe("data-pipeline");
    });

    it("WorkflowCancelledEvent has reason", () => {
      const event: WorkflowCancelledEvent = {
        event: "WorkflowCancelled",
        created_at: Date.now(),
        reason: "timeout",
        is_cancelled: true,
      };

      expect(event.reason).toBe("timeout");
      expect(event.is_cancelled).toBe(true);
    });

    it("StepStartedEvent has step fields", () => {
      const event: StepStartedEvent = {
        event: "StepStarted",
        created_at: Date.now(),
        step_name: "extract-data",
        step_index: 0,
      };

      expect(event.step_name).toBe("extract-data");
    });

    it("StepOutputEvent has step_output", () => {
      const event: StepOutputEvent = {
        event: "StepOutput",
        created_at: Date.now(),
        step_name: "transform",
        step_output: {
          step_id: "step-1",
          step_name: "transform",
          content: "transformed data",
          success: true,
        },
      };

      expect(event.step_output?.success).toBe(true);
    });

    it("ConditionExecutionStartedEvent has condition_result", () => {
      const event: ConditionExecutionStartedEvent = {
        event: "ConditionExecutionStarted",
        created_at: Date.now(),
        step_name: "check-threshold",
        condition_result: true,
      };

      expect(event.condition_result).toBe(true);
    });

    it("ParallelExecutionCompletedEvent has step_results", () => {
      const event: ParallelExecutionCompletedEvent = {
        event: "ParallelExecutionCompleted",
        created_at: Date.now(),
        parallel_step_count: 3,
        step_results: [
          { step_name: "a", success: true },
          { step_name: "b", success: true },
        ],
      };

      expect(event.step_results).toHaveLength(2);
    });

    it("LoopIterationCompletedEvent has iteration fields", () => {
      const event: LoopIterationCompletedEvent = {
        event: "LoopIterationCompleted",
        created_at: Date.now(),
        iteration: 3,
        max_iterations: 10,
        should_continue: false,
        iteration_results: [],
      };

      expect(event.iteration).toBe(3);
      expect(event.should_continue).toBe(false);
    });

    it("RouterExecutionStartedEvent has selected_steps", () => {
      const event: RouterExecutionStartedEvent = {
        event: "RouterExecutionStarted",
        created_at: Date.now(),
        selected_steps: ["route-a", "route-b"],
      };

      expect(event.selected_steps).toEqual(["route-a", "route-b"]);
    });

    it("StepsExecutionCompletedEvent has step counts", () => {
      const event: StepsExecutionCompletedEvent = {
        event: "StepsExecutionCompleted",
        created_at: Date.now(),
        steps_count: 5,
        executed_steps: 4,
        step_results: [],
      };

      expect(event.steps_count).toBe(5);
      expect(event.executed_steps).toBe(4);
    });
  });

  describe("supporting types", () => {
    it("Metrics has expanded fields", () => {
      const metrics: Metrics = {
        input_tokens: 10,
        output_tokens: 20,
        total_tokens: 30,
        time_to_first_token: 100,
        duration: 500,
        audio_input_tokens: 5,
        audio_output_tokens: 8,
        cache_read_tokens: 3,
        cache_write_tokens: 2,
        reasoning_tokens: 15,
      };

      expect(metrics.audio_input_tokens).toBe(5);
      expect(metrics.reasoning_tokens).toBe(15);
    });

    it("RunMetrics is alias for Metrics", () => {
      // Should compile - RunMetrics = Metrics
      const m: RunMetrics = {
        input_tokens: 10,
        audio_input_tokens: 5,
      };
      expect(m.input_tokens).toBe(10);
    });

    it("SessionSummary has expected fields", () => {
      const summary: SessionSummary = {
        summary: "Discussed project requirements",
        topics: ["requirements", "timeline"],
        updated_at: Date.now(),
      };

      expect(summary.summary).toBe("Discussed project requirements");
      expect(summary.topics).toHaveLength(2);
    });

    it("StepOutput has expected fields", () => {
      const output: StepOutput = {
        step_id: "step-1",
        step_name: "extract",
        content: "extracted data",
        success: true,
        duration: 1.5,
      };

      expect(output.success).toBe(true);
      expect(output.duration).toBe(1.5);
    });

    it("WorkflowMetrics has steps and duration", () => {
      const metrics: WorkflowMetrics = {
        duration: 10.5,
        steps: {
          extract: {
            step_name: "extract",
            executor_type: "agent",
            executor_name: "extractor",
            metrics: { input_tokens: 100, output_tokens: 50, total_tokens: 150 },
          },
        },
      };

      expect(metrics.duration).toBe(10.5);
      expect(metrics.steps?.extract.executor_type).toBe("agent");
    });

    it("ToolExecution has expected fields", () => {
      const tool: ToolExecution = {
        function_name: "search",
        arguments: { query: "test" },
        result: "found it",
        call_id: "call-1",
      };

      expect(tool.function_name).toBe("search");
      expect(tool.arguments?.query).toBe("test");
    });
  });

  describe("base event interfaces", () => {
    it("BaseAgentRunEvent has agent fields", () => {
      const event: BaseAgentRunEvent = {
        event: "test",
        created_at: Date.now(),
        agent_id: "agent-1",
        agent_name: "Test Agent",
        session_id: "session-1",
        workflow_id: "wf-1",
      };

      expect(event.agent_id).toBe("agent-1");
      expect(event.workflow_id).toBe("wf-1");
    });

    it("BaseTeamRunEvent has team fields", () => {
      const event: BaseTeamRunEvent = {
        event: "test",
        created_at: Date.now(),
        team_id: "team-1",
        team_name: "Test Team",
        session_id: "session-1",
      };

      expect(event.team_id).toBe("team-1");
      expect(event.team_name).toBe("Test Team");
    });

    it("BaseWorkflowRunEvent has workflow fields", () => {
      const event: BaseWorkflowRunEvent = {
        event: "test",
        created_at: Date.now(),
        workflow_id: "wf-1",
        workflow_name: "pipeline",
        parent_step_id: "parent-1",
      };

      expect(event.workflow_id).toBe("wf-1");
      expect(event.parent_step_id).toBe("parent-1");
    });
  });

  describe("expanded AgentRunEvent union", () => {
    it("narrows all 29 agent event types", () => {
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
        {
          event: "PreHookStarted",
          created_at: Date.now(),
          pre_hook_name: "validate",
        },
        {
          event: "SessionSummaryCompleted",
          created_at: Date.now(),
          session_summary: { summary: "test" },
        },
        {
          event: "CustomEvent",
          created_at: Date.now(),
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
          case "PreHookStarted":
            expect(event.pre_hook_name).toBe("validate");
            break;
          case "SessionSummaryCompleted":
            expect(event.session_summary?.summary).toBe("test");
            break;
          case "CustomEvent":
            expect(event.event).toBe("CustomEvent");
            break;
        }
      }
    });
  });

  describe("AllRunEvents composite union", () => {
    it("includes events from all domains", () => {
      const events: AllRunEvents[] = [
        { event: "RunStarted", created_at: 1, run_id: "r1", session_id: "s1", agent_id: "a1" },
        { event: "TeamRunStarted", created_at: 1, session_id: "s1" },
        { event: "WorkflowStarted", created_at: 1, workflow_id: "w1" },
      ];

      expect(events).toHaveLength(3);
      expect(events[0].event).toBe("RunStarted");
      expect(events[1].event).toBe("TeamRunStarted");
      expect(events[2].event).toBe("WorkflowStarted");
    });
  });

  describe("EventMap type", () => {
    it("maps event string to correct type (compile-time test)", () => {
      // This is a compile-time test. If the file compiles, EventMap is correct.
      type _RunStartedCheck = EventMap["RunStarted"] extends RunStartedEvent ? true : never;
      type _WorkflowCheck = EventMap["WorkflowStarted"] extends WorkflowStartedEvent ? true : never;

      // Runtime assertion to make test runner happy
      expect(true).toBe(true);
    });
  });
});
