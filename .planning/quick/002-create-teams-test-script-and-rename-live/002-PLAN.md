---
phase: quick
plan: 002
type: execute
wave: 1
depends_on: []
files_modified:
  - examples/live-test.ts
  - examples/test-agents.ts
  - examples/test-teams.ts
autonomous: true

must_haves:
  truths:
    - "examples/test-agents.ts exists and contains the renamed agents live test"
    - "examples/test-teams.ts exists and tests teams API"
    - "examples/live-test.ts no longer exists"
  artifacts:
    - path: "examples/test-agents.ts"
      provides: "Renamed agents live test script"
    - path: "examples/test-teams.ts"
      provides: "Teams API live test script"
  key_links:
    - from: "examples/test-teams.ts"
      to: "src/resources/teams.ts"
      via: "client.teams API calls"
---

<objective>
Create a teams test script following the pattern of examples/live-test.ts, and rename the existing live-test.ts to test-agents.ts.

Purpose: Establish separate live test scripts for agents and teams resources
Output: Two test scripts (test-agents.ts, test-teams.ts) with the old live-test.ts removed
</objective>

<execution_context>
@/Users/adamshedivy/.claude/get-shit-done/workflows/execute-plan.md
@/Users/adamshedivy/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@examples/live-test.ts (current agents test - rename to test-agents.ts)
@src/resources/teams.ts (teams resource API for reference)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rename live-test.ts to test-agents.ts</name>
  <files>examples/live-test.ts, examples/test-agents.ts</files>
  <action>
    Use git mv to rename examples/live-test.ts to examples/test-agents.ts.
    Update the header comment in the file to say "Agents Live Test Script" instead of "Live SDK Test Script".
    The file tests agents, so the name should reflect that.
  </action>
  <verify>
    - ls examples/ shows test-agents.ts and no live-test.ts
    - git status shows rename detected
  </verify>
  <done>live-test.ts renamed to test-agents.ts with updated header comment</done>
</task>

<task type="auto">
  <name>Task 2: Create test-teams.ts following the agents test pattern</name>
  <files>examples/test-teams.ts</files>
  <action>
    Create examples/test-teams.ts following the pattern established in test-agents.ts (formerly live-test.ts).

    The script should:
    1. Initialize AgentOSClient with localhost:7777
    2. Test health endpoint (same as agents test)
    3. List teams via client.teams.list()
    4. List sessions (same as agents test)
    5. Test streaming run with client.teams.runStream() if teams available
    6. Test non-streaming run with client.teams.run() if teams available

    Key differences from agents test:
    - Use client.teams.list() instead of client.agents.list()
    - Use client.teams.runStream() instead of client.agents.runStream()
    - Use client.teams.run() instead of client.agents.run()
    - Update console messages to reference "team(s)" instead of "agent(s)"
    - Header comment should say "Teams Live Test Script"

    Keep the same structure:
    - Error handling with APIError, NotFoundError, InternalServerError
    - Streaming event handling (RunStarted, RunContent, RunCompleted, MemoryUpdateStarted, MemoryUpdateCompleted)
    - Summary at the end
  </action>
  <verify>
    - File exists at examples/test-teams.ts
    - TypeScript compiles: npx tsc --noEmit examples/test-teams.ts
    - Contains client.teams.list(), client.teams.runStream(), client.teams.run()
  </verify>
  <done>test-teams.ts created with full teams API test coverage matching agents test pattern</done>
</task>

<task type="auto">
  <name>Task 3: Update package.json scripts (if needed)</name>
  <files>package.json</files>
  <action>
    Check if package.json has a test:live script. If it references live-test.ts, update it.

    Consider adding:
    - "test:agents": "node --experimental-strip-types examples/test-agents.ts"
    - "test:teams": "node --experimental-strip-types examples/test-teams.ts"

    Or keep the existing script name and update path, depending on current setup.
  </action>
  <verify>
    - npm run test:agents (or equivalent) runs without "file not found" error
    - npm run test:teams (or equivalent) runs without "file not found" error
  </verify>
  <done>Package.json scripts updated to reference renamed/new test files</done>
</task>

</tasks>

<verification>
- git status shows: renamed examples/live-test.ts -> examples/test-agents.ts, new file examples/test-teams.ts
- Both test files compile: npx tsc --noEmit examples/test-agents.ts examples/test-teams.ts
- npm scripts for running tests work (may fail at runtime if no server, but should not fail to start)
</verification>

<success_criteria>
- examples/live-test.ts no longer exists
- examples/test-agents.ts exists with agents test code
- examples/test-teams.ts exists with teams test code following same pattern
- Both files compile without TypeScript errors
- package.json scripts updated appropriately
</success_criteria>

<output>
After completion, create `.planning/quick/002-create-teams-test-script-and-rename-live/002-SUMMARY.md`
</output>
