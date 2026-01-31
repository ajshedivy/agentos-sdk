# Architecture Research: TypeScript API SDK

**Domain:** TypeScript SDK for RESTful API with streaming support
**Researched:** 2026-01-31
**Confidence:** HIGH

## Standard Architecture

Modern TypeScript API SDKs follow a layered architecture with clear separation of concerns. Based on analysis of production SDKs (OpenAI, Stripe, Azure) and industry standards, the canonical pattern is:

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Public API Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Client     │  │   Resources  │  │  Streaming   │       │
│  │ (entry point)│  │ (namespaced) │  │   Wrappers   │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │                │
├─────────┴─────────────────┴─────────────────┴────────────────┤
│                      Core Layer                              │
│  ┌────────────────────────────────────────────────────┐      │
│  │           HTTP Client (Request/Response)           │      │
│  └───────────────────────┬────────────────────────────┘      │
│  ┌────────────┐  ┌───────┴────────┐  ┌──────────────┐       │
│  │   Error    │  │   Serializer/  │  │   SSE/Stream │       │
│  │  Handler   │  │   Deserializer │  │    Parser    │       │
│  └────────────┘  └────────────────┘  └──────────────┘       │
├─────────────────────────────────────────────────────────────┤
│                      Type Layer                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Models  │  │  Errors  │  │ Responses│  │ Options  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Client** | Main entry point, config holder, resource aggregator | Single class with resource properties, accepts config in constructor |
| **Resource** | Encapsulates endpoints for a logical grouping (e.g., agents, sessions) | Class with methods matching API operations (list, get, create, delete) |
| **HTTP Client** | Makes requests, handles auth, retries, base URL | Wraps fetch/axios, adds auth headers, manages timeouts |
| **Error Handler** | Translates HTTP errors to typed exceptions | Catches responses, creates specific error classes (NotFoundError, ValidationError) |
| **Streaming Handler** | Parses SSE, provides async iterator + event emitter interfaces | EventSource polyfill or custom SSE parser, exposes dual interfaces |
| **Serializer** | Converts TypeScript types to API format | Handles multipart/form-data for file uploads, JSON serialization |
| **Type Definitions** | Generated from OpenAPI spec, covers all request/response shapes | Auto-generated .d.ts files, manually maintained for custom types |

## Recommended Project Structure

```
agentos-sdk/
├── src/
│   ├── index.ts                    # Public API exports
│   ├── client.ts                   # Main Client class
│   ├── resources/                  # Resource implementations
│   │   ├── agents.ts               # client.agents.*
│   │   ├── teams.ts                # client.teams.*
│   │   ├── workflows.ts            # client.workflows.*
│   │   ├── sessions.ts             # client.sessions.*
│   │   ├── knowledge.ts            # client.knowledge.*
│   │   ├── memories.ts             # client.memories.*
│   │   ├── traces.ts               # client.traces.*
│   │   ├── evals.ts                # client.evals.*
│   │   └── base.ts                 # Shared resource base class
│   ├── core/                       # Core infrastructure
│   │   ├── http.ts                 # HTTP client wrapper
│   │   ├── streaming.ts            # SSE parsing & dual interfaces
│   │   ├── errors.ts               # Error class hierarchy
│   │   └── uploads.ts              # File upload handling
│   ├── types/                      # Type definitions
│   │   ├── generated/              # Auto-generated from OpenAPI
│   │   │   ├── agents.ts
│   │   │   ├── teams.ts
│   │   │   └── ...
│   │   ├── client.ts               # Client configuration types
│   │   ├── resources.ts            # Resource operation types
│   │   └── streaming.ts            # Streaming types
│   └── _test/                      # Internal test utilities
│       ├── mocks.ts                # Mock client for testing
│       └── fixtures.ts             # Test data
├── tests/                          # Test files (mirrors src/)
│   ├── unit/                       # Fast unit tests
│   │   ├── resources/
│   │   └── core/
│   └── integration/                # Integration tests against real API
│       └── e2e.integration.test.ts
├── examples/                       # Example code for documentation
│   ├── basic-usage.ts
│   ├── streaming.ts
│   └── file-uploads.ts
├── dist/                           # Build output (gitignored)
│   ├── esm/                        # ES modules
│   └── cjs/                        # CommonJS
├── package.json                    # Dual package config
└── tsconfig.json                   # TypeScript configuration
```

### Structure Rationale

- **resources/:** One file per resource namespace matches API structure, makes discoverability easy
- **core/:** Reusable infrastructure isolated from domain logic, easier to test and evolve
- **types/generated/:** Separate auto-generated types from manual types, prevents accidental edits
- **_test/:** Prefix with underscore keeps internal test utilities out of public API
- **tests/:** Separate from src/ prevents shipping test code in the bundle
- **dist/esm + dist/cjs:** Dual package output for maximum compatibility (Node.js CJS + modern ESM + browsers)

## Architectural Patterns

### Pattern 1: Resource-Based Client

**What:** Organize API methods into resource namespaces mirroring the API structure.

**When to use:** Always for REST APIs with logical resource groupings. Industry standard for SDKs (Stripe, OpenAI, Azure).

**Trade-offs:**
- **Pro:** Excellent discoverability, autocomplete shows available operations
- **Pro:** Mirrors REST API mental model
- **Con:** Slightly more code than flat namespace
- **Con:** Requires careful resource boundary definition

**Example:**
```typescript
// Client instantiation
const client = new AgentOSClient({ apiKey: 'sk_...' });

// Resource-based method calls
const agent = await client.agents.create({ name: 'Helper' });
const run = await client.agents.run(agent.id, { input: 'Hello' });

// Resources are instantiated internally
class AgentOSClient {
  public readonly agents: Agents;
  public readonly teams: Teams;

  constructor(config: ClientConfig) {
    const http = new HTTPClient(config);
    this.agents = new Agents(http);
    this.teams = new Teams(http);
  }
}
```

### Pattern 2: Dual Streaming Interface

**What:** Provide BOTH async iterator and event emitter interfaces for SSE streams.

**When to use:** When streaming is a core feature and users have different preferences.

**Trade-offs:**
- **Pro:** Flexibility — modern async/await AND familiar event patterns
- **Pro:** async iterators preferred for new code, events for compatibility
- **Con:** More surface area to test
- **Con:** Two ways to do the same thing (but intentional)

**Example:**
```typescript
// Async iterator pattern (modern, recommended)
const stream = await client.agents.run(id, { input: 'Hi', stream: true });
for await (const chunk of stream) {
  console.log(chunk.delta);
}

// Event emitter pattern (familiar, compatible)
const stream = await client.agents.run(id, { input: 'Hi', stream: true });
stream.on('data', (chunk) => console.log(chunk.delta));
stream.on('error', (err) => console.error(err));
stream.on('end', () => console.log('Done'));

// Implementation
class StreamWrapper implements AsyncIterable<Chunk> {
  private eventEmitter = new EventEmitter();

  // Async iterator interface
  async *[Symbol.asyncIterator](): AsyncIterator<Chunk> {
    for await (const event of this.parseSSE()) {
      yield event.data;
    }
  }

  // Event emitter interface
  on(event: string, handler: Function) {
    this.eventEmitter.on(event, handler);
  }
}
```

### Pattern 3: Typed Error Hierarchy

**What:** Subclass Error for each HTTP status code with structured error information.

**When to use:** Always. Better DX than catching generic errors and checking properties.

**Trade-offs:**
- **Pro:** Type-safe error handling with instanceof checks
- **Pro:** Better IDE support for catch blocks
- **Con:** More classes to maintain
- **Con:** Users need to know which errors to catch

**Example:**
```typescript
// Error class hierarchy
class AgentOSError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly requestId?: string,
    public readonly headers?: Record<string, string>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ValidationError extends AgentOSError {
  constructor(message: string, public readonly errors: ValidationIssue[]) {
    super(message, 422);
  }
}

class NotFoundError extends AgentOSError {
  constructor(resource: string, id: string) {
    super(`${resource} ${id} not found`, 404);
  }
}

// Usage
try {
  await client.agents.get('invalid-id');
} catch (err) {
  if (err instanceof NotFoundError) {
    console.log('Agent not found');
  } else if (err instanceof ValidationError) {
    console.log('Validation errors:', err.errors);
  } else {
    throw err; // Re-throw unknown errors
  }
}
```

### Pattern 4: Flexible File Upload Input

**What:** Accept multiple file input types (path string, Buffer, Stream, File) and normalize internally.

**When to use:** When SDK supports file uploads and users have different file sources.

**Trade-offs:**
- **Pro:** Developer convenience — users provide what's natural for their context
- **Pro:** Works in Node (paths, Buffers) and browsers (File objects)
- **Con:** More complex serialization logic
- **Con:** Need to handle content-type detection differently per input type

**Example:**
```typescript
// Flexible input types
type FileInput = string | Buffer | ReadStream | File | Blob;

interface UploadOptions {
  file: FileInput;
  filename?: string;
  contentType?: string;
}

// Usage: all of these work
await client.knowledge.upload({ file: '/path/to/doc.pdf' });
await client.knowledge.upload({ file: fs.readFileSync('doc.pdf') });
await client.knowledge.upload({ file: fs.createReadStream('doc.pdf') });
await client.knowledge.upload({ file: browserFileInput.files[0] });

// Implementation normalizes input
async function normalizeFile(input: FileInput): Promise<FormDataFile> {
  if (typeof input === 'string') {
    // Path string: read file, detect content-type from extension
    return {
      data: await fs.promises.readFile(input),
      filename: path.basename(input),
      contentType: mime.lookup(input)
    };
  } else if (Buffer.isBuffer(input)) {
    // Buffer: use as-is, require explicit filename
    return { data: input };
  } else if (input instanceof File) {
    // Browser File: extract name and type
    return {
      data: await input.arrayBuffer(),
      filename: input.name,
      contentType: input.type
    };
  }
  // ... handle other types
}
```

### Pattern 5: Options Bags for Configuration

**What:** Use object parameters instead of positional arguments for methods with >2 parameters.

**When to use:** Always for methods with optional parameters or complex configuration.

**Trade-offs:**
- **Pro:** Self-documenting code, clear what each option does
- **Pro:** Easy to add new options without breaking changes
- **Pro:** Required/optional distinction clear in TypeScript
- **Con:** Slightly more verbose than positional args

**Example:**
```typescript
// Good: options bag
await client.agents.run(agentId, {
  input: 'Hello',
  stream: true,
  sessionId: 'session-123',
  abortSignal: controller.signal
});

// Bad: positional arguments
await client.agents.run(
  agentId,
  'Hello',
  true,
  'session-123',
  controller.signal
);

// Type definition
interface RunOptions {
  input: string;
  stream?: boolean;
  sessionId?: string;
  abortSignal?: AbortSignal;
}
```

## Data Flow

### Request Flow (Non-Streaming)

```
User Code
    ↓
client.agents.create({ name: 'Agent' })
    ↓
Resource.create() validates & serializes
    ↓
HTTPClient.post('/agents', payload, options)
    ↓
Adds auth header (Bearer token)
    ↓
fetch() makes HTTP request
    ↓
Response arrives
    ↓
HTTPClient checks status
    ↓ (if error)
ErrorHandler.fromResponse() → throw NotFoundError / ValidationError / etc
    ↓ (if success)
Deserialize JSON body
    ↓
Return typed response to user
```

### Streaming Flow

```
User Code
    ↓
stream = await client.agents.run(id, { stream: true })
    ↓
Resource.run() detects stream: true
    ↓
HTTPClient.stream('/agents/:id/run', payload)
    ↓
fetch() with streaming response
    ↓
StreamingHandler.fromResponse(response)
    ↓
Creates StreamWrapper with dual interfaces
    ↓
[Async Iterator Path]              [Event Emitter Path]
    ↓                                    ↓
for await (const chunk of stream)   stream.on('data', ...)
    ↓                                    ↓
Parse SSE events                    Parse SSE events
    ↓                                    ↓
Yield chunk to iterator             Emit 'data' event
    ↓                                    ↓
User processes chunk                User processes chunk
    ↓                                    ↓
Stream ends → iteration complete    Emit 'end' event
```

### File Upload Flow

```
User Code
    ↓
client.knowledge.upload({ file: '/path/to/file.pdf' })
    ↓
Resource.upload() receives FileInput
    ↓
Uploads.normalize(fileInput)
    ↓ (detect input type)
[Path String] → read file, detect content-type from extension
[Buffer] → use as-is, require explicit filename
[Stream] → pipe to form data
[File/Blob] → extract name and type
    ↓
Create FormData with normalized file
    ↓
HTTPClient.post('/knowledge/upload', formData)
    ↓
Set Content-Type: multipart/form-data
    ↓
Upload via fetch()
    ↓
Return upload response
```

### Key Data Flows

1. **Authentication Flow:** API key stored in ClientConfig → HTTPClient adds Bearer header to all requests → Server validates token
2. **Error Propagation:** HTTP error response → ErrorHandler checks status → Create specific error subclass → Throw to user code
3. **Type Safety Flow:** User calls method → TypeScript validates args against types → Generated types ensure correct shape → Response deserialized to typed object

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1K requests/day | Standard architecture works fine, no special considerations |
| 1K-100K requests/day | Add request queuing if rate limits are hit, consider connection pooling |
| 100K+ requests/day | Users should implement their own caching layer, the SDK stays simple |

### Scaling Priorities

For an SDK (not a service), scaling is about user flexibility, not SDK complexity.

1. **First bottleneck:** Rate limits hit → Document rate limit handling, provide hooks for retry logic, but don't build complex backoff into SDK
2. **Second bottleneck:** Large response payloads → Support pagination properly, provide streaming responses where possible
3. **Third bottleneck:** Many concurrent requests → Document connection pooling, but Node fetch handles this natively

**Philosophy:** Keep SDK simple. Power users will add their own retry/caching/pooling. Provide hooks, not built-in complexity.

## Anti-Patterns

### Anti-Pattern 1: Flat Namespace

**What people do:**
```typescript
const client = new AgentOSClient({ apiKey: 'sk_...' });
await client.createAgent({ name: 'Agent' });
await client.runAgent(agentId, { input: 'Hi' });
await client.createTeam({ name: 'Team' });
await client.runTeam(teamId, { input: 'Hi' });
// ... 40+ methods on one object
```

**Why it's wrong:**
- Poor discoverability: 40+ methods in autocomplete
- Naming conflicts require verbose prefixes (createAgent, createTeam, createWorkflow...)
- Doesn't mirror API structure, harder to map SDK → API docs

**Do this instead:**
```typescript
const client = new AgentOSClient({ apiKey: 'sk_...' });
await client.agents.create({ name: 'Agent' });
await client.agents.run(agentId, { input: 'Hi' });
await client.teams.create({ name: 'Team' });
await client.teams.run(teamId, { input: 'Hi' });
// Resources group related operations, much clearer
```

### Anti-Pattern 2: Streaming with Only One Interface

**What people do:** Provide ONLY async iterators OR ONLY event emitters.

**Why it's wrong:**
- Limits flexibility: some users prefer async/await, others prefer events
- async iterators are modern but unfamiliar to some developers
- Event emitters are familiar but clunky with async/await

**Do this instead:** Support BOTH interfaces on the same stream object. Users choose based on their preference.

### Anti-Pattern 3: Generic Error Objects

**What people do:**
```typescript
throw new Error('API request failed with status 404');

// User has to parse error message
try {
  await client.agents.get('invalid');
} catch (err) {
  if (err.message.includes('404')) {
    // Handle not found
  }
}
```

**Why it's wrong:**
- No type safety in error handling
- Brittle string parsing
- Can't access structured error info (request ID, validation errors)

**Do this instead:**
```typescript
throw new NotFoundError('Agent', 'invalid-id', { requestId: 'req_123' });

// Type-safe error handling
try {
  await client.agents.get('invalid');
} catch (err) {
  if (err instanceof NotFoundError) {
    console.log('Agent not found, request ID:', err.requestId);
  }
}
```

### Anti-Pattern 4: Overly Complex File Upload API

**What people do:** Require users to manually construct FormData or multipart bodies.

**Why it's wrong:**
- Poor DX: users have to understand multipart encoding
- Different APIs in Node vs browser
- Error-prone content-type detection

**Do this instead:** Accept simple file inputs and handle complexity internally:
```typescript
// Simple API, SDK handles complexity
await client.knowledge.upload({
  file: '/path/to/file.pdf' // SDK reads, detects type, creates FormData
});
```

### Anti-Pattern 5: Dual Package with .mjs/.cjs Extensions

**What people do:** Output files with .mjs and .cjs extensions to distinguish module types.

**Why it's wrong:**
- TypeScript module resolution struggles with mixed extensions
- Some bundlers have issues with .mjs/.cjs
- Nested package.json approach is cleaner

**Do this instead:**
```
dist/
├── esm/
│   ├── package.json    # { "type": "module" }
│   └── index.js        # ES module with .js extension
└── cjs/
    ├── package.json    # { "type": "commonjs" }
    └── index.js        # CommonJS with .js extension
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| AgentOS API | REST + SSE | Base URL configurable, default to https://api.agno.dev |
| OpenAPI Spec | Type generation | Fetch /openapi.json, generate types with openapi-typescript or @hey-api/openapi-ts |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Client ↔ Resources | Direct method calls | Client instantiates resources with shared HTTP client |
| Resources ↔ HTTP Client | Request/response objects | Resources call http.get/post/etc, HTTP client handles auth/errors |
| HTTP Client ↔ Streaming Handler | Response streams | HTTP client passes streaming responses to streaming handler for SSE parsing |
| Streaming Handler ↔ User Code | Dual interfaces | StreamWrapper implements both AsyncIterable and EventEmitter |

### Build-Time Dependencies

| Tool | Purpose | Notes |
|------|---------|-------|
| TypeScript | Compilation | Use tsc with dual output (ESM + CJS) or tsup for bundling |
| openapi-typescript or @hey-api/openapi-ts | Type generation | Generate types from OpenAPI spec, commit to repo |
| Vitest | Testing | Modern, fast, native ESM/TypeScript support |
| tsup (optional) | Bundling | Alternative to tsc for simpler dual package builds |

## Browser vs Node.js Considerations

### Runtime Differences

| Feature | Node.js | Browser | Solution |
|---------|---------|---------|----------|
| File system | fs module available | No file system access | Check if fs exists, throw helpful error in browser |
| fetch() | Built-in (Node 18+) | Built-in | Use native fetch everywhere |
| FormData | Built-in (Node 18+) | Built-in | Use native FormData everywhere |
| AbortController | Built-in | Built-in | Use for cancellation in both |
| EventSource | Not built-in | Built-in | Use polyfill or custom SSE parser |

### Implementation Strategy

**Core:** Write platform-agnostic code using fetch/FormData/AbortController.

**Platform-specific:** Isolate platform-specific code (file system access) and provide clear error messages when unavailable.

```typescript
// File upload helper
async function readFile(input: FileInput): Promise<Buffer | ArrayBuffer> {
  if (typeof input === 'string') {
    // Path string only works in Node
    if (typeof fs === 'undefined') {
      throw new Error('File paths are only supported in Node.js. Use File or Blob in browser.');
    }
    return await fs.promises.readFile(input);
  }
  // Buffer/File/Blob work everywhere
  return input;
}
```

## Build Order & Dependencies

### Component Build Order

Build from core outward to ensure dependencies are available:

1. **Types (generated)** — Generate from OpenAPI spec first, everything depends on these
2. **Core (errors, http, streaming, uploads)** — Infrastructure layer, no dependencies on resources
3. **Resources (agents, teams, workflows, etc.)** — Depend on core and types
4. **Client** — Depends on resources and core
5. **Public API (index.ts)** — Exports client and types

### Dependency Graph

```
index.ts
  ↓ exports
Client
  ↓ instantiates
Resources (agents, teams, workflows...)
  ↓ uses
Core (http, streaming, errors, uploads)
  ↓ uses
Types (generated + manual)
```

### Suggested Implementation Order for Phases

**Phase 1: Foundation**
1. Project setup (package.json, tsconfig, build)
2. Core types (ClientConfig, BaseOptions)
3. HTTP client (fetch wrapper, auth)
4. Error classes (hierarchy)

**Phase 2: Basic Resources**
5. Single resource (e.g., agents) with basic operations (get, list, create)
6. Client class with single resource
7. Basic tests

**Phase 3: Streaming**
8. SSE parser
9. StreamWrapper with dual interfaces
10. Streaming tests
11. Add streaming to resources

**Phase 4: File Uploads**
12. File normalization helper
13. FormData construction
14. Upload tests
15. Add upload methods to resources

**Phase 5: Complete API Coverage**
16. All remaining resources
17. Full endpoint coverage
18. Integration tests

**Phase 6: Publishing & DX**
19. Dual package build (ESM + CJS)
20. Examples
21. Documentation
22. Publish to npm

## Testing Strategy

### Test Structure

```
tests/
├── unit/
│   ├── core/
│   │   ├── http.test.ts           # HTTP client unit tests
│   │   ├── errors.test.ts         # Error class tests
│   │   ├── streaming.test.ts      # SSE parsing tests
│   │   └── uploads.test.ts        # File normalization tests
│   └── resources/
│       ├── agents.test.ts         # Agent resource tests with mocks
│       └── teams.test.ts          # Team resource tests with mocks
└── integration/
    └── e2e.integration.test.ts    # Real API integration tests
```

### Testing Patterns

**Unit tests:** Mock HTTP client, test resource logic in isolation.

```typescript
// Mock HTTP client
const mockHttp = {
  get: vi.fn().mockResolvedValue({ id: 'agent-1', name: 'Agent' }),
  post: vi.fn(),
  // ...
};

const agents = new Agents(mockHttp);
const agent = await agents.get('agent-1');
expect(mockHttp.get).toHaveBeenCalledWith('/agents/agent-1');
```

**Integration tests:** Hit real API (or local dev server), test end-to-end flows.

```typescript
// Real API integration test
const client = new AgentOSClient({
  apiKey: process.env.AGENTOS_API_KEY,
  baseUrl: 'http://localhost:8000'
});

const agent = await client.agents.create({ name: 'Test Agent' });
expect(agent.id).toBeDefined();

await client.agents.delete(agent.id);
```

**Testing priorities:**
1. Core infrastructure (HTTP, errors, streaming) — heavy unit test coverage
2. Each resource — unit tests with mocks, ensure correct API calls
3. Integration tests — smoke tests for critical flows, not exhaustive

### Test Framework: Vitest

**Why Vitest:** In 2026, Vitest is the preferred choice for TypeScript SDKs:
- Native ESM/TypeScript support (no Babel/ts-jest setup)
- 10-20x faster than Jest on large codebases
- Out-of-box support for modern syntax
- Compatible with Jest API (easy migration)

**Configuration:**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

## Sources

### TypeScript SDK Best Practices
- [TypeScript Best Practices for Large-Scale Web Applications in 2026](https://johal.in/typescript-best-practices-for-large-scale-web-applications-in-2026/)
- [Azure SDK TypeScript Design Guidelines](https://azure.github.io/azure-sdk/typescript_design.html)
- [The Right Way to Build a TypeScript SDK](https://hsnice16.medium.com/the-right-way-to-build-a-typescript-sdk-75657476bc95)

### OpenAPI Code Generation
- [hey-api/openapi-ts - Production-ready SDK Generator](https://github.com/hey-api/openapi-ts)
- [OpenAPI TypeScript Documentation](https://openapi-ts.dev/)

### Streaming Implementation
- [Async Iterators in Azure SDK for JavaScript/TypeScript](https://devblogs.microsoft.com/azure-sdk/async-iterators-in-the-azure-sdk-for-javascript-typescript/)
- [better-sse - Server-Sent Events Library](https://www.npmjs.com/package/better-sse)
- [Asynchronously Iterating Over Event Emitters in TypeScript](https://dev.to/redjohnsh/asynchronously-iterating-over-event-emitters-in-typescript-with-async-generators-3mk)

### Error Handling
- [How to Build a REST API with TypeScript in 2026](https://encore.dev/articles/build-rest-api-typescript-2026)
- [Building a Type-Safe API Client in TypeScript](https://dev.to/limacodes/building-a-type-safe-api-client-in-typescript-beyond-axios-vs-fetch-4a3i)

### Dual Package Support
- [Supporting CommonJS and ESM with TypeScript and Node](https://evertpot.com/universal-commonjs-esm-typescript-packages/)
- [How to Build Dual Package npm from TypeScript](https://tduyng.com/blog/dual-package-typescript/)
- [TypeScript in 2025 with ESM and CJS npm Publishing](https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing)

### Testing
- [Vitest vs Jest 30: Why 2026 is the Year of Browser-Native Testing](https://dev.to/dataformathub/vitest-vs-jest-30-why-2026-is-the-year-of-browser-native-testing-2fgb)
- [Testing in 2026: Jest, React Testing Library, and Full Stack Testing Strategies](https://www.nucamp.co/blog/testing-in-2026-jest-react-testing-library-and-full-stack-testing-strategies)

### Real-World SDK Examples
- [OpenAI Node.js SDK](https://github.com/openai/openai-node)
- [Stripe Node.js SDK](https://github.com/stripe/stripe-node)

---
*Architecture research for: AgentOS TypeScript SDK*
*Researched: 2026-01-31*
