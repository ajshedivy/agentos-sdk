---
phase: quick
plan: 003
type: execute
wave: 1
depends_on: []
files_modified:
  - src/streaming/events.ts
  - src/streaming/parser.ts
  - src/streaming/stream.ts
  - src/index.ts
  - package.json
  - tests/streaming/events.test.ts
  - tests/streaming/parser.test.ts
  - tests/streaming/stream.test.ts
autonomous: true

must_haves:
  truths:
    - "RunEventType const object exports 28 event name constants"
    - "All 28 typed event interfaces exist with correct discriminant values"
    - "StreamEvent base interface replaces BaseEvent"
    - "AgentRunEvent union includes all 28 event types"
    - "AgentStream.on() provides type-safe overloads for known event types"
    - "parser.ts yields StreamEvent instead of AgentRunEvent"
    - "All existing tests pass after type changes"
    - "package.json version is 0.2.0"
  artifacts:
    - path: "src/streaming/events.ts"
      provides: "StreamEvent base, RunEventType constants, 28 typed event interfaces, supporting data types, AgentRunEvent union"
      contains: "RunEventType"
    - path: "src/streaming/parser.ts"
      provides: "SSE parser with StreamEvent return type"
      contains: "StreamEvent"
    - path: "src/streaming/stream.ts"
      provides: "AgentStream with StreamEvent iteration and type-safe .on() overloads"
      contains: "StreamEvent"
    - path: "src/index.ts"
      provides: "Expanded streaming type exports"
      contains: "RunEventType"
  key_links:
    - from: "src/streaming/stream.ts"
      to: "src/streaming/events.ts"
      via: "imports StreamEvent, AgentRunEvent, and individual event types for .on() overloads"
      pattern: "import.*StreamEvent"
    - from: "src/streaming/parser.ts"
      to: "src/streaming/events.ts"
      via: "imports StreamEvent for generator return type"
      pattern: "import.*StreamEvent"
    - from: "src/index.ts"
      to: "src/streaming/index.ts"
      via: "re-exports all new event types and RunEventType"
      pattern: "RunEventType"
---

<objective>
Expand SDK streaming event type coverage from 5 to 28+ events to match the full Agno server event set. Replace BaseEvent with StreamEvent, add RunEventType constant object, create typed interfaces for all 28 events with supporting data types, update parser and stream return types, and expand exports. Zero runtime behavior changes.

Purpose: Enable SDK consumers to handle all server-emitted event types with full TypeScript type safety, not just the original 5 events.
Output: Complete type-safe streaming event system covering all 28 Agno run events.
</objective>

<execution_context>
@/Users/adamshedivy/.claude/get-shit-done/workflows/execute-plan.md
@/Users/adamshedivy/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/streaming/events.ts (current 5 event types - replace entirely)
@src/streaming/parser.ts (change return type only)
@src/streaming/stream.ts (change iteration type, add .on() overloads)
@src/streaming/index.ts (already re-exports - verify no changes needed)
@src/index.ts (expand streaming exports)
@tests/streaming/events.test.ts (update for new types)
@tests/streaming/parser.test.ts (update type imports)
@tests/streaming/stream.test.ts (update type imports)
@package.json (version bump)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace events.ts with full 28-event type system</name>
  <files>src/streaming/events.ts</files>
  <action>
    Replace the entire contents of src/streaming/events.ts with the expanded type system. The file structure should be:

    1. **StreamEvent base interface** (replaces BaseEvent):
       ```typescript
       export interface StreamEvent {
         event: string;
         created_at: number;
         run_id: string;
         [key: string]: unknown; // Allow extra fields from server
       }
       ```
       Keep `BaseEvent` as a deprecated type alias: `export type BaseEvent = StreamEvent;`

    2. **RunEventType const object** with all 28 event names as string constants:
       ```typescript
       export const RunEventType = {
         RunStarted: "RunStarted",
         RunResponse: "RunResponse",
         RunCompleted: "RunCompleted",
         RunContent: "RunContent",
         RunContentPartStart: "RunContentPartStart",
         RunContentPartDone: "RunContentPartDone",
         ToolCallStarted: "ToolCallStarted",
         ToolCallCompleted: "ToolCallCompleted",
         ReasoningStarted: "ReasoningStarted",
         ReasoningStep: "ReasoningStep",
         ReasoningCompleted: "ReasoningCompleted",
         UpdatingMemory: "UpdatingMemory",
         MemoryUpdateStarted: "MemoryUpdateStarted",
         MemoryUpdateCompleted: "MemoryUpdateCompleted",
         AgentTurnStarted: "AgentTurnStarted",
         AgentTurnCompleted: "AgentTurnCompleted",
         TeamTurnStarted: "TeamTurnStarted",
         TeamTurnCompleted: "TeamTurnCompleted",
         WorkflowStarted: "WorkflowStarted",
         WorkflowCompleted: "WorkflowCompleted",
         RunError: "RunError",
         RunCancelled: "RunCancelled",
         RunPaused: "RunPaused",
         RunResumed: "RunResumed",
         RunInput: "RunInput",
         RunEndStream: "RunEndStream",
         SessionStarted: "SessionStarted",
         SessionEnded: "SessionEnded",
       } as const;
       ```

    3. **Supporting data types** (used in event interfaces):
       ```typescript
       export interface ToolCallData {
         tool_call_id: string;
         tool_name: string;
         tool_args?: Record<string, unknown>;
         tool_result?: unknown;
         tool_error?: string;
       }

       export interface ReasoningStep {
         step: number;
         content: string;
       }

       export interface ExtraData {
         [key: string]: unknown;
       }

       export interface ImageData {
         url?: string;
         base64?: string;
         alt_text?: string;
         mime_type?: string;
       }

       export interface VideoData {
         url?: string;
         base64?: string;
         mime_type?: string;
         duration?: number;
       }

       export interface AudioData {
         url?: string;
         base64?: string;
         mime_type?: string;
         duration?: number;
       }

       export interface ResponseAudio {
         transcript?: string;
         data?: AudioData;
       }

       export interface RunMetrics {
         input_tokens: number;
         output_tokens: number;
         total_tokens: number;
         time_to_first_token?: number;
         duration?: number;
         additional_metrics?: Record<string, number>;
       }
       ```

    4. **28 typed event interfaces** -- each extends StreamEvent and has a literal `event` discriminant field. Keep the existing 5 events backward-compatible (same fields), add the 23 new ones:

       - **RunStartedEvent**: event: "RunStarted", session_id, agent_id, agent_name, model, model_provider (EXISTING - keep same shape)
       - **RunResponseEvent**: event: "RunResponse", content: string, content_type: string, extra_data?: ExtraData
       - **RunCompletedEvent**: event: "RunCompleted", session_id, agent_id, agent_name, content, content_type, metrics?: RunMetrics (EXISTING - update metrics to use RunMetrics type)
       - **RunContentEvent**: event: "RunContent", content: string, content_type: string (EXISTING - keep same shape)
       - **RunContentPartStartEvent**: event: "RunContentPartStart", part_index: number, content_type: string
       - **RunContentPartDoneEvent**: event: "RunContentPartDone", part_index: number, content: string, content_type: string
       - **ToolCallStartedEvent**: event: "ToolCallStarted", tool_call: ToolCallData
       - **ToolCallCompletedEvent**: event: "ToolCallCompleted", tool_call: ToolCallData
       - **ReasoningStartedEvent**: event: "ReasoningStarted"
       - **ReasoningStepEvent**: event: "ReasoningStep", reasoning: ReasoningStep
       - **ReasoningCompletedEvent**: event: "ReasoningCompleted", total_steps: number
       - **UpdatingMemoryEvent**: event: "UpdatingMemory"
       - **MemoryUpdateStartedEvent**: event: "MemoryUpdateStarted" (EXISTING - keep same shape)
       - **MemoryUpdateCompletedEvent**: event: "MemoryUpdateCompleted" (EXISTING - keep same shape)
       - **AgentTurnStartedEvent**: event: "AgentTurnStarted", agent_id: string, agent_name: string
       - **AgentTurnCompletedEvent**: event: "AgentTurnCompleted", agent_id: string, agent_name: string
       - **TeamTurnStartedEvent**: event: "TeamTurnStarted", team_id?: string, team_name?: string
       - **TeamTurnCompletedEvent**: event: "TeamTurnCompleted", team_id?: string, team_name?: string
       - **WorkflowStartedEvent**: event: "WorkflowStarted", workflow_id?: string, workflow_name?: string
       - **WorkflowCompletedEvent**: event: "WorkflowCompleted", workflow_id?: string, workflow_name?: string
       - **RunErrorEvent**: event: "RunError", error: string, error_code?: string
       - **RunCancelledEvent**: event: "RunCancelled", reason?: string
       - **RunPausedEvent**: event: "RunPaused", reason?: string
       - **RunResumedEvent**: event: "RunResumed"
       - **RunInputEvent**: event: "RunInput", input_type: string, prompt?: string
       - **RunEndStreamEvent**: event: "RunEndStream"
       - **SessionStartedEvent**: event: "SessionStarted", session_id: string
       - **SessionEndedEvent**: event: "SessionEnded", session_id: string

       Each interface should have a JSDoc @public tag.

    5. **AgentRunEvent union** -- expand to include all 28 event types:
       ```typescript
       export type AgentRunEvent =
         | RunStartedEvent
         | RunResponseEvent
         | RunCompletedEvent
         | RunContentEvent
         | RunContentPartStartEvent
         | RunContentPartDoneEvent
         | ToolCallStartedEvent
         | ToolCallCompletedEvent
         | ReasoningStartedEvent
         | ReasoningStepEvent
         | ReasoningCompletedEvent
         | UpdatingMemoryEvent
         | MemoryUpdateStartedEvent
         | MemoryUpdateCompletedEvent
         | AgentTurnStartedEvent
         | AgentTurnCompletedEvent
         | TeamTurnStartedEvent
         | TeamTurnCompletedEvent
         | WorkflowStartedEvent
         | WorkflowCompletedEvent
         | RunErrorEvent
         | RunCancelledEvent
         | RunPausedEvent
         | RunResumedEvent
         | RunInputEvent
         | RunEndStreamEvent
         | SessionStartedEvent
         | SessionEndedEvent;
       ```

    Important notes:
    - All existing event interfaces (RunStartedEvent, RunContentEvent, RunCompletedEvent, MemoryUpdateStartedEvent, MemoryUpdateCompletedEvent) must keep their existing fields for backward compatibility.
    - RunCompletedEvent.metrics should use the new RunMetrics type (which is a superset of the old inline type -- same required fields plus optional additional_metrics).
    - The `BaseEvent` alias ensures any consumer code importing BaseEvent still compiles.
    - Add `@deprecated Use StreamEvent instead` JSDoc on BaseEvent alias.
  </action>
  <verify>
    - `npx tsc --noEmit` passes with zero errors
    - The file exports: StreamEvent, BaseEvent, RunEventType, all 28 event interfaces, all supporting data types, AgentRunEvent
  </verify>
  <done>
    events.ts contains StreamEvent base, RunEventType const with 28 entries, 28 typed event interfaces, supporting data types, and expanded AgentRunEvent union. BaseEvent kept as deprecated alias.
  </done>
</task>

<task type="auto">
  <name>Task 2: Update parser.ts, stream.ts, exports, and version</name>
  <files>src/streaming/parser.ts, src/streaming/stream.ts, src/index.ts, package.json</files>
  <action>
    **parser.ts changes (minimal):**
    - Change import: `import type { AgentRunEvent }` to `import type { StreamEvent }`
    - Change return type: `AsyncGenerator<AgentRunEvent>` to `AsyncGenerator<StreamEvent>`
    - Change cast: `as AgentRunEvent` to `as StreamEvent`
    - Update JSDoc to reference StreamEvent instead of AgentRunEvent

    **stream.ts changes:**
    - Add import of `StreamEvent` from events (keep AgentRunEvent import too for backward compat)
    - Add imports of individual event types needed for .on() overloads
    - Change `AsyncIterable<AgentRunEvent>` to `AsyncIterable<StreamEvent>` in class declaration
    - Change `iteratorFn` constructor param type from `() => AsyncGenerator<AgentRunEvent>` to `() => AsyncGenerator<StreamEvent>`
    - Change `AsyncIterator<AgentRunEvent>` to `AsyncIterator<StreamEvent>` in [Symbol.asyncIterator]
    - Change `listeners` Map value type from `Set<(event: AgentRunEvent) => void>` to `Set<(event: StreamEvent) => void>`
    - Update private `emit` method to take `StreamEvent` instead of `AgentRunEvent`

    Add .on() method overloads for type-safe event handling of all 28 known events. The existing generic .on() signature stays as the implementation, but add overload signatures above it:
    ```typescript
    on(eventType: "RunStarted", handler: (event: RunStartedEvent) => void): this;
    on(eventType: "RunResponse", handler: (event: RunResponseEvent) => void): this;
    on(eventType: "RunCompleted", handler: (event: RunCompletedEvent) => void): this;
    // ... all 28 event types ...
    on(eventType: string, handler: (event: StreamEvent) => void): this;  // catch-all for unknown events
    on(eventType: string, handler: (event: any) => void): this {
      // existing implementation unchanged
    }
    ```

    The implementation body of .on() does NOT change -- only the type signatures above it.

    **src/index.ts changes:**
    - Replace the current streaming type export block with expanded exports:
      ```typescript
      // Streaming
      export { AgentStream } from "./streaming";
      export { RunEventType } from "./streaming";
      export type {
        StreamEvent,
        BaseEvent,
        AgentRunEvent,
        // All 28 event interfaces
        RunStartedEvent,
        RunResponseEvent,
        RunCompletedEvent,
        RunContentEvent,
        RunContentPartStartEvent,
        RunContentPartDoneEvent,
        ToolCallStartedEvent,
        ToolCallCompletedEvent,
        ReasoningStartedEvent,
        ReasoningStepEvent,
        ReasoningCompletedEvent,
        UpdatingMemoryEvent,
        MemoryUpdateStartedEvent,
        MemoryUpdateCompletedEvent,
        AgentTurnStartedEvent,
        AgentTurnCompletedEvent,
        TeamTurnStartedEvent,
        TeamTurnCompletedEvent,
        WorkflowStartedEvent,
        WorkflowCompletedEvent,
        RunErrorEvent,
        RunCancelledEvent,
        RunPausedEvent,
        RunResumedEvent,
        RunInputEvent,
        RunEndStreamEvent,
        SessionStartedEvent,
        SessionEndedEvent,
        // Supporting types
        ToolCallData,
        ReasoningStep,
        ExtraData,
        ImageData,
        VideoData,
        AudioData,
        ResponseAudio,
        RunMetrics,
      } from "./streaming";
      ```

    **package.json:**
    - Change `"version": "0.1.2"` to `"version": "0.2.0"`

    **src/streaming/index.ts:**
    - Verify it already does `export * from "./events"` -- if so, no changes needed. If not, ensure all new types are re-exported.
  </action>
  <verify>
    - `npx tsc --noEmit` passes with zero errors
    - `npm run build` succeeds
    - package.json version reads "0.2.0"
  </verify>
  <done>
    parser.ts and stream.ts use StreamEvent types. stream.ts has .on() overloads for all 28 events plus string catch-all. src/index.ts exports all new types and RunEventType value. Version bumped to 0.2.0.
  </done>
</task>

<task type="auto">
  <name>Task 3: Update tests for new type system</name>
  <files>tests/streaming/events.test.ts, tests/streaming/parser.test.ts, tests/streaming/stream.test.ts</files>
  <action>
    **tests/streaming/events.test.ts:**
    - Update imports to include StreamEvent, RunEventType, and a selection of new event types
    - Keep ALL existing tests -- they must still pass (backward compat)
    - Add new test sections:

    ```
    describe("StreamEvent base interface", () => {
      it("has required fields", () => {
        // Create a StreamEvent and verify shape
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

      it("includes all expected event types", () => {
        expect(RunEventType.RunStarted).toBe("RunStarted");
        expect(RunEventType.RunContent).toBe("RunContent");
        expect(RunEventType.RunCompleted).toBe("RunCompleted");
        expect(RunEventType.ToolCallStarted).toBe("ToolCallStarted");
        expect(RunEventType.ToolCallCompleted).toBe("ToolCallCompleted");
        expect(RunEventType.ReasoningStarted).toBe("ReasoningStarted");
        expect(RunEventType.RunError).toBe("RunError");
        expect(RunEventType.RunEndStream).toBe("RunEndStream");
      });
    });

    describe("new event interfaces", () => {
      it("ToolCallStartedEvent has tool_call field", () => {
        // type-compile test with runtime assertion
      });

      it("ReasoningStepEvent has reasoning field", () => {
        // type-compile test with runtime assertion
      });

      it("RunErrorEvent has error field", () => {
        // type-compile test with runtime assertion
      });

      it("expanded AgentRunEvent union narrows all 28 types", () => {
        // Test switch narrowing with a few representative new types
      });
    });
    ```

    **tests/streaming/parser.test.ts:**
    - Change `import type { AgentRunEvent }` to `import type { StreamEvent }` (or add StreamEvent alongside)
    - Update the local type annotations: `const events: AgentRunEvent[]` to `const events: StreamEvent[]`
    - All existing test logic remains identical -- only types change

    **tests/streaming/stream.test.ts:**
    - Change `import type { AgentRunEvent, ... }` to include StreamEvent
    - Update `const collected: AgentRunEvent[]` to `const collected: StreamEvent[]`
    - Keep all existing test logic identical
    - Add one new test for the string-based .on() overload:
      ```
      it("accepts string event type for unknown events", async () => {
        // Register handler with string event name not in the union
        // Verify it still receives events (the catch-all overload)
      });
      ```

    Important: Do NOT delete or modify any existing test assertions. Only change type annotations and add new tests. Every currently passing test must continue to pass.
  </action>
  <verify>
    - `npm test` passes (all existing + new tests)
    - `npx tsc --noEmit` passes
    - Test count increases (new tests added for RunEventType, new interfaces)
  </verify>
  <done>
    All existing streaming tests pass with updated types. New tests verify RunEventType has 28 constants, key-value identity, new event interface shapes, and string-based .on() overload.
  </done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with zero errors (full type system is sound)
- `npm test` passes (all existing 457+ tests pass, new tests pass)
- `npm run build` succeeds (tsup produces valid output)
- `npm run lint` passes (biome check)
- RunEventType has exactly 28 members
- AgentRunEvent union has exactly 28 member types
- StreamEvent is the base interface, BaseEvent is deprecated alias
- No runtime behavior changes in parser.ts or stream.ts (only type annotations)
- package.json version is "0.2.0"
</verification>

<success_criteria>
- Zero TypeScript errors across entire project
- All existing tests pass unchanged (backward compatibility)
- New tests pass for RunEventType constants and new event interfaces
- npm run build produces valid dist output
- SDK consumers can import any of the 28 event types from "@worksofadam/agentos-sdk"
- SDK consumers can use RunEventType.ToolCallStarted etc. as string constants
- AgentStream.on("ToolCallStarted", handler) provides typed handler parameter
- Version is 0.2.0
</success_criteria>

<output>
After completion, create `.planning/quick/003-sdk-streaming-event-types/003-SUMMARY.md`
</output>
