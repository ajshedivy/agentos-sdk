# @worksofadam/agentos-sdk

[![npm version](https://img.shields.io/npm/v/@worksofadam/agentos-sdk.svg)](https://www.npmjs.com/package/@worksofadam/agentos-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

TypeScript SDK for the AgentOS HTTP API. Run agents, teams, and workflows with streaming responses in under 5 lines of code.

## Quick Start

```typescript
import { AgentOSClient } from '@worksofadam/agentos-sdk';

const client = new AgentOSClient({
  baseUrl: 'http://localhost:7777', // required
  apiKey: 'your-api-key',           // optional; the SDK reads no environment variables
});
const stream = await client.agents.runStream('agent-id', { message: 'Hello!' });
for await (const event of stream) {
  if (event.event === 'RunContent') console.log(event.content);
}
```

## Installation

```bash
# npm
npm install @worksofadam/agentos-sdk

# yarn
yarn add @worksofadam/agentos-sdk

# pnpm
pnpm add @worksofadam/agentos-sdk
```

## Usage Examples

### Agents

**List all agents:**
```typescript
const client = new AgentOSClient({ baseUrl: 'http://localhost:7777', apiKey: 'your-api-key' });
const agents = await client.agents.list();
console.log(agents);
```

**Run an agent (non-streaming):**
```typescript
const result = await client.agents.run('agent-id', {
  message: 'What is the weather today?',
  sessionId: 'session-123',
  userId: 'user-456'
});
console.log(result);
```

**Run an agent with streaming (iterator pattern):**
```typescript
const stream = await client.agents.runStream('agent-id', {
  message: 'Tell me a story',
  sessionId: 'session-123'
});

for await (const event of stream) {
  switch (event.event) {
    case 'RunStarted':
      console.log('Run started:', event.run_id);
      break;
    case 'RunContent':
      console.log('Content:', event.content);
      break;
    case 'RunCompleted':
      console.log('Completed:', event.metrics);
      break;
  }
}
```

**Continue a paused agent run:**
```typescript
// After agent requests tool execution
const toolResults = JSON.stringify([
  { tool_call_id: 'call_123', output: 'Tool result' }
]);

const stream = await client.agents.continue('agent-id', 'run-id', {
  tools: toolResults,
  sessionId: 'session-123',
  stream: true  // default: true, set false for non-streaming
});

for await (const event of stream) {
  console.log(event);
}
```

**Cancel a running agent:**
```typescript
await client.agents.cancel('agent-id', 'run-id');
```

### Teams

**List all teams:**
```typescript
const teams = await client.teams.list();
console.log(teams);
```

**Run a team with streaming (event emitter pattern):**
```typescript
const stream = await client.teams.runStream('team-id', {
  message: 'Analyze this data',
  sessionId: 'session-123'
});

await stream
  .on('RunStarted', (event) => {
    console.log('Team run started:', event.run_id);
  })
  .on('RunContent', (event) => {
    console.log('Content:', event.content);
  })
  .on('RunCompleted', (event) => {
    console.log('Metrics:', event.metrics);
  })
  .start();
```

### Workflows

**List all workflows:**
```typescript
const workflows = await client.workflows.list();
console.log(workflows);
```

**Run a workflow:**
```typescript
const result = await client.workflows.run('workflow-id', {
  message: 'Start the process',
  sessionId: 'session-123'
});
console.log(result);
```

**Continue a paused workflow run:**
```typescript
// The paused run (WorkflowPaused event or getRun()) carries step_requirements[];
// the LAST entry is the active pause. Stamp the decision on it and send the
// whole array back: the server replaces its stored list with what you send.
// (Agents take `tools`, teams take `requirements`; workflows differ.)
const reqs = paused.step_requirements;
reqs[reqs.length - 1].confirmed = true; // or user_input / selected_choices

const stream = await client.workflows.continue('workflow-id', paused.run_id, {
  stepRequirements: JSON.stringify(reqs),
  sessionId: paused.session_id
});
```

### Sessions

**Create a new session:**
```typescript
const session = await client.sessions.create({
  userId: 'user-123',
  agentId: 'agent-456',
  sessionName: 'Customer Support Chat'
});
console.log(session.id);
```

**List sessions with filtering:**
```typescript
const sessions = await client.sessions.list({
  userId: 'user-123',
  agentId: 'agent-456'
});
console.log(sessions);
```

**Get runs for a session:**
```typescript
const runs = await client.sessions.getRuns('session-id');
console.log(runs);
```

### Memories

**List memories with filtering:**
```typescript
const memories = await client.memories.list({
  userId: 'user-123',
  topics: ['preferences', 'history']
});
console.log(memories);
```

**Create a memory:**
```typescript
const memory = await client.memories.create({
  memory: 'User prefers dark mode',
  userId: 'user-123',
  topics: ['preferences']
});
console.log(memory);
```

**Search memories:**
```typescript
const results = await client.memories.list({
  userId: 'user-123',
  query: 'dark mode'
});
console.log(results);
```

### Knowledge

**Upload a file to knowledge base:**
```typescript
// From file path (Node.js only)
const content = await client.knowledge.upload({
  file: '/path/to/document.pdf',
  name: 'Product Documentation',
  description: 'Latest product specs',
  metadata: { version: '2.1' }
});

// From Buffer
import { readFileSync } from 'fs';
const buffer = readFileSync('/path/to/document.pdf');
const content = await client.knowledge.upload({
  file: buffer,
  name: 'Product Documentation'
});

// From URL
const content = await client.knowledge.upload({
  url: 'https://example.com/document.pdf',
  name: 'External Document'
});

// From text content
const content = await client.knowledge.upload({
  textContent: 'This is important information...',
  name: 'Text Note',
  description: 'Quick note'
});
```

**Upload multiple files:**
```typescript
const files = [
  '/path/to/doc1.pdf',
  '/path/to/doc2.pdf'
];

for (const filePath of files) {
  await client.knowledge.upload({ file: filePath });
}
```

**Search knowledge base:**
```typescript
const results = await client.knowledge.search('product features', {
  searchType: 'hybrid',  // 'vector' | 'keyword' | 'hybrid'
  maxResults: 10,
  filters: { category: 'documentation' }
});

for (const result of results.data) {
  console.log(result.content, result.score);
}
```

**Check upload processing status:**
```typescript
const status = await client.knowledge.getStatus('content-id');
if (status.status === 'completed') {
  console.log('Processing complete');
} else if (status.status === 'processing') {
  console.log('Still processing...');
}
```

### Traces

**List traces with filtering:**
```typescript
const traces = await client.traces.list({
  runId: 'run-123',
  sessionId: 'session-456',
  limit: 50
});
console.log(traces);
```

### Metrics

**Get metrics:**
```typescript
// GetMetricsOptions: startingDate / endingDate (YYYY-MM-DD), userId, dbId.
// There is no session filter; GET /metrics aggregates per day.
const metrics = await client.metrics.get({
  startingDate: '2024-01-01',
  endingDate: '2024-01-31',
  userId: 'user-123'
});
console.log(metrics);
```

**Refresh metrics:**
```typescript
await client.metrics.refresh();
```

## Streaming

The SDK provides two patterns for consuming streaming responses:

### Async Iterator Pattern

Best for sequential processing of events:

```typescript
const stream = await client.agents.runStream('agent-id', {
  message: 'Hello!'
});

for await (const event of stream) {
  // Type-safe event handling
  switch (event.event) {
    case 'RunStarted':
      console.log('Started:', event.run_id);
      break;
    case 'RunContent':
      process.stdout.write(event.content);
      break;
    case 'RunCompleted':
      console.log('\nDone! Metrics:', event.metrics);
      break;
    case 'MemoryUpdateStarted':
      console.log('Updating memories...');
      break;
    case 'MemoryUpdateCompleted':
      console.log('Memories updated');
      break;
  }
}
```

### Event Emitter Pattern

Best for parallel event handling with multiple listeners:

```typescript
const stream = await client.teams.runStream('team-id', {
  message: 'Process this data'
});

await stream
  .on('RunStarted', (event) => {
    console.log('Run ID:', event.run_id);
  })
  .on('RunContent', (event) => {
    // Build up response content
    responseBuffer += event.content;
  })
  .on('RunCompleted', (event) => {
    console.log('Final metrics:', event.metrics);
    saveMetrics(event.metrics);
  })
  .on('MemoryUpdateCompleted', (event) => {
    console.log('Memories synced');
  })
  .start();
```

### Stream Cancellation

All streams support cancellation via AbortController:

```typescript
const stream = await client.agents.runStream('agent-id', {
  message: 'Long running task...'
});

// Cancel after 5 seconds
setTimeout(() => {
  stream.controller.abort();
  console.log('Stream cancelled');
}, 5000);

try {
  for await (const event of stream) {
    console.log(event);
  }
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Stream was cancelled');
  }
}
```

### Run Errors

A run that fails after the stream has started does not raise an HTTP error:
the server ends the stream with a `RunError` event (`TeamRunError` for teams,
`WorkflowError` for workflows, where the message field is `error` rather than
`content`). On agno >= 3.0 that event carries the same machine-readable
identity agno puts in HTTP error bodies (`error_type` / `error_id`, e.g.
`"model_provider_error"`), so you can branch on the failure kind instead of
matching the message text:

```typescript
for await (const event of stream) {
  if (event.event === 'RunError') {
    if (event.error_type === 'model_provider_error') {
      console.error('Model provider rejected the request:', event.content);
    } else {
      console.error('Run failed:', event.error_type ?? 'unknown', event.content);
    }
  }
}
```

`error_type`, `error_id` and `additional_data` are `undefined` on servers older
than agno 3.0. Non-streaming runs report the same failures as a 200 response
with `status: "ERROR"` and the message in `content`, so the stream event is the
only place the identity is exposed.

## File Uploads

The SDK supports multiple file input formats for maximum flexibility:

### Supported File Types

```typescript
import type { FileInput, Image, Audio, Video, FileType } from '@worksofadam/agentos-sdk';

// FileInput accepts:
// - string: File path (Node.js only - read into a File for upload)
// - Buffer: In-memory binary data
// - ReadStream: Node.js file stream (read into a File via its backing path)
// - Blob: Browser Blob or Node.js Blob
// - File: Browser File object
```

### Upload Files with Agent Runs

```typescript
// Single image from file path (Node.js only)
const result = await client.agents.run('agent-id', {
  message: 'What is in this image?',
  images: ['/path/to/photo.jpg']
});

// Multiple files from Buffers
import { readFileSync } from 'fs';
const image1 = readFileSync('/path/to/photo1.jpg');
const image2 = readFileSync('/path/to/photo2.jpg');

const result = await client.agents.run('agent-id', {
  message: 'Compare these images',
  images: [image1, image2]
});

// Mixed media types
const result = await client.agents.run('agent-id', {
  message: 'Analyze this multimedia content',
  images: ['/path/to/screenshot.png'],
  audio: [audioBuffer],
  videos: ['/path/to/demo.mp4'],
  files: ['/path/to/document.pdf']
});
```

### Advanced File Handling

For advanced use cases, use the `normalizeFileInput` utility:

```typescript
import { normalizeFileInput } from '@worksofadam/agentos-sdk';

// Normalize any file input to a FormData-compatible value
const normalized = normalizeFileInput('/path/to/file.pdf', 'document.pdf');
// Returns: Blob | File (a File preserving the filename when available)
```

### Runtime Limitations

**Node.js:**
- All file input types supported
- File paths and file-backed `ReadStream`s read into a `File` (filename preserved)
- `Buffer` converted to `Blob` for FormData compatibility

**Browser (future support):**
- File paths NOT supported (no filesystem access)
- `Blob` and `File` objects work natively
- `Buffer` converted to `Blob`
- `ReadStream` NOT available in browsers

## Error Handling

The SDK provides typed error classes for precise error handling:

```typescript
import {
  APIError,
  AuthenticationError,
  BadRequestError,
  NotFoundError,
  RateLimitError,
  InternalServerError,
  RemoteServerUnavailableError,
  UnprocessableEntityError
} from '@worksofadam/agentos-sdk';

try {
  const result = await client.agents.run('agent-id', {
    message: 'Hello!'
  });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key:', error.message);
  } else if (error instanceof NotFoundError) {
    console.error('Agent not found:', error.message);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded. Retry after:', error.message);
  } else if (error instanceof BadRequestError) {
    console.error('Invalid request:', error.message);
  } else if (error instanceof InternalServerError) {
    console.error('Server error:', error.message);
    console.error('Request ID:', error.requestId);
  } else if (error instanceof APIError) {
    console.error('API error:', error.status, error.message);
  } else {
    console.error('Network error:', error);
  }
}
```

### Error Properties

All API errors extend `APIError` and include:

- `status`: HTTP status code
- `message`: Error message from API
- `requestId`: X-Request-ID header value (for support)
- `body`: Raw response body

## TypeScript

The SDK is written in TypeScript and provides full type safety:

```typescript
import type {
  AgentOSClient,
  RunOptions,
  StreamRunOptions,
  AgentRunEvent,
  components,
  paths
} from '@worksofadam/agentos-sdk';

// All resource methods are fully typed
const result = await client.agents.run('agent-id', {
  message: 'Hello',
  sessionId: 'optional-session',
  // TypeScript will error if you pass invalid options
});

// Event types are discriminated unions for type-safe handling
for await (const event of stream) {
  if (event.event === 'RunContent') {
    // TypeScript knows event.content exists here
    console.log(event.content);
  }
}

// Access generated OpenAPI types
type AgentResponse = components['schemas']['AgentResponse'];
type ListAgentsPath = paths['/agents']['get'];
```

### Generated Types from OpenAPI

The SDK generates TypeScript types directly from the AgentOS OpenAPI specification:

- Capture the spec from a running AgentOS: `curl -s $BASE_URL/openapi.json`,
  written to `openapi.json` as JSON with 2-space indentation. **Capture from a
  stack that also mounts the auth, models, registry and agent-builder routers**
  (an ixora stack does) — a stock agno AgentOS does not serve `/auth/*`,
  `GET /models`, `/registry/*`, `/toolsets*` or `POST /agents:apply`, and
  capturing from one drops the schemas that `src/resources/auth.ts`,
  `models.ts` and `registry.ts` reference, so `npm run typecheck` then fails on
  hand-written code that was never touched.
- Run `npm run generate:types` to regenerate types from `openapi.json`
- Types are committed to git in `src/generated/types.ts`
- All resource methods use generated types for request/response bodies

One normalization is applied to the captured spec by hand and must be reapplied
after each capture: agno 3.0.0 gives both `GET /config` and
`GET /components/{component_id}/configs/{version}` the `operation_id` `get_config`,
which makes `openapi-typescript` emit a duplicate `operations` key and fails
`npm run typecheck`. The second one is renamed to `get_config_version` (the name
of its handler) in `openapi.json`.

## API Reference

### AgentOSClient

**Constructor:**
```typescript
new AgentOSClient(options: AgentOSClientOptions)
```

**Options** (`AgentOSClientOptions`):
- `baseUrl: string` - Base URL of the AgentOS server (required; the constructor throws without it)
- `apiKey?: string` - API key sent as a `Bearer` token. The SDK reads no environment variables; pass the value yourself
- `timeout?: number` - Request timeout in milliseconds (default: 30000)
- `maxRetries?: number` - Maximum retry attempts for transient failures (default: 2)
- `headers?: Record<string, string>` - Extra headers sent with every request

`client.version` exposes the SDK version (also sent as `User-Agent: agentos-sdk/<version>`); it is read from `package.json` at build time.

**Methods:**
- `getConfig(): Promise<ConfigResponse>` - Get server configuration (`components['schemas']['ConfigResponse']`)
- `health(): Promise<HealthStatus>` - Check API health status

### Resource Namespaces

All resource operations are accessed via namespaced properties:

- `client.agents` - Agent operations
- `client.teams` - Team operations
- `client.workflows` - Workflow operations
- `client.sessions` - Session management
- `client.memories` - Memory operations
- `client.knowledge` - Knowledge base operations
- `client.traces` - Trace retrieval
- `client.metrics` - Metrics retrieval

### Common Methods

Most resources support these methods:

- `list(options?)` - List all resources
- `get(id)` - Get resource by ID
- `run(id, options)` - Execute resource (non-streaming)
- `runStream(id, options)` - Execute resource (streaming)
- `continue(id, runId, options)` - Continue paused execution
- `cancel(id, runId)` - Cancel running execution

See TypeScript types for complete method signatures and options.

## Requirements

- **Node.js 18.0.0 or higher**
  - Note: `fetch` is experimental in Node.js 18, stable in Node.js 21+
  - For Node.js 18, consider using `--experimental-fetch` flag or upgrade to Node.js 21+
- **TypeScript 5.0 or higher** (for TypeScript projects)

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

For more information, visit the [AgentOS Documentation](https://docs.agno.com).
