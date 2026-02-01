---
phase: quick
plan: 001
type: execute
wave: 1
depends_on: []
files_modified:
  - examples/live-test.ts
  - package.json
autonomous: true

must_haves:
  truths:
    - "Developer can run a sample script against live AgentOS instance"
    - "Script tests multiple SDK resources (health, agents, sessions)"
    - "Script demonstrates both streaming and non-streaming patterns"
  artifacts:
    - path: "examples/live-test.ts"
      provides: "Live SDK testing script"
      min_lines: 80
  key_links:
    - from: "examples/live-test.ts"
      to: "src/index.ts"
      via: "import from compiled dist or ts-node"
      pattern: "import.*AgentOSClient"
---

<objective>
Create a sample TypeScript script that connects to a live AgentOS instance at http://localhost:7777 and exercises basic SDK features including health checks, listing resources, and running agents with streaming.

Purpose: Provide developers with a practical script to verify SDK functionality against a real AgentOS server, demonstrating best practices for client initialization, error handling, and streaming consumption.

Output: Runnable examples/live-test.ts script with npm script for easy execution.
</objective>

<execution_context>
@/Users/adamshedivy/.claude/get-shit-done/workflows/execute-plan.md
@/Users/adamshedivy/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/index.ts
@src/client.ts
@README.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create examples directory and live-test.ts script</name>
  <files>examples/live-test.ts</files>
  <action>
Create examples/live-test.ts that demonstrates live SDK testing:

1. Client setup:
   - Import AgentOSClient and error types from the SDK (use relative path to dist or compiled output)
   - Configure client with baseUrl: 'http://localhost:7777' (no apiKey needed for local dev)
   - Add console logging for each step

2. Health check:
   - Call client.health() and log the response
   - Wrap in try/catch to handle connection failures gracefully

3. List resources:
   - Call client.agents.list() and log count + first agent if exists
   - Call client.sessions.list() and log count
   - Handle empty responses gracefully

4. Streaming run (if agent exists):
   - If agents are available, run client.agents.runStream() with a test message
   - Use async iterator pattern to consume events
   - Log each event type (RunStarted, RunContent, RunCompleted)
   - Handle errors (e.g., agent not ready, no model configured)

5. Error handling:
   - Demonstrate catching APIError and specific error types
   - Log request IDs for debugging
   - Exit with appropriate status codes (0 for success, 1 for failures)

Script should be self-documenting with clear console.log statements explaining each step.
Use TypeScript with explicit types. Handle the case where AgentOS server is not running.
  </action>
  <verify>npx tsc examples/live-test.ts --noEmit --esModuleInterop --moduleResolution node --target es2022 --module esnext --skipLibCheck</verify>
  <done>examples/live-test.ts exists, compiles without errors, and contains health check, resource listing, and streaming demonstration</done>
</task>

<task type="auto">
  <name>Task 2: Add npm script for running the live test</name>
  <files>package.json</files>
  <action>
Add a script to package.json for running the live test:

"test:live": "npx tsx examples/live-test.ts"

Note: Using tsx (TypeScript execute) to run the TypeScript file directly without separate compilation step. tsx is zero-config and works with the existing project setup.

If tsx is not installed, add it to devDependencies.
  </action>
  <verify>npm run test:live --help (should show the script exists, even if it fails due to no server)</verify>
  <done>package.json contains test:live script, tsx is available (either existing or added as devDependency)</done>
</task>

</tasks>

<verification>
1. Script compiles: `npx tsc examples/live-test.ts --noEmit --esModuleInterop --moduleResolution node --target es2022 --module esnext --skipLibCheck`
2. Script exists with proper structure: `head -50 examples/live-test.ts`
3. npm script added: `grep "test:live" package.json`
4. (Optional) If AgentOS is running: `npm run test:live` executes without crash
</verification>

<success_criteria>
- examples/live-test.ts exists with 80+ lines demonstrating SDK usage
- Script imports from SDK correctly
- Script handles connection failures gracefully (server not running case)
- Script demonstrates health check, list operations, and streaming pattern
- npm run test:live script is available in package.json
</success_criteria>

<output>
After completion, create `.planning/quick/001-create-sample-script-for-live-sdk-testin/001-SUMMARY.md`
</output>
