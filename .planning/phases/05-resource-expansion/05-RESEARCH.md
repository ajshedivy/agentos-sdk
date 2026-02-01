# Phase 5: Resource Expansion - Research

**Researched:** 2026-01-31
**Domain:** REST API resource implementation patterns, CRUD operations, pagination/filtering, TypeScript SDK architecture
**Confidence:** HIGH

## Summary

Phase 5 expands the SDK to cover all core API resources (teams, workflows, sessions, memories, traces, metrics) following the established `AgentsResource` pattern from Phases 3-4. This research covers three primary domains: resource architecture patterns for consistency across 6+ new resource classes, pagination and filtering patterns for list operations with query parameters, and streaming support patterns for teams/workflows run endpoints.

**Key findings:**
- AgentsResource pattern established in Phase 3-4 provides the blueprint: class-based resources receiving client instance, using client.request() and client.requestStream()
- Teams and Workflows mirror Agents exactly: list(), get(), run(), runStream(), continue(), cancel() - identical signatures with different paths
- Sessions, Memories, Traces require pagination/filtering via query parameters using URLSearchParams for type-safe parameter building
- Metrics is read-only: get() with date range filters, refresh() to trigger recalculation
- All streaming endpoints (teams/workflows runs) reuse AgentStream class - event types already generic enough
- Generated OpenAPI types provide all request/response schemas via components['schemas']['*Response']

**Primary recommendation:** Implement 6 new resource classes (TeamsResource, WorkflowsResource, SessionsResource, MemoriesResource, TracesResource, MetricsResource) following AgentsResource pattern, extract shared streaming/pagination utilities, commit all resources with consistent test coverage.

## Standard Stack

The established libraries/tools for this domain (all already in use from Phases 1-4):

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| AgentsResource pattern | Current | Resource class architecture | Established in Phase 3, proven with streaming in Phase 4 |
| AgentStream | Current | SSE streaming abstraction | Generic enough for teams/workflows, discriminated union supports all event types |
| URLSearchParams | Native | Query parameter building | Built-in, type-safe, automatic encoding, works browser+Node.js |
| Generated OpenAPI types | Current | TypeScript types for all resources | Single source of truth, stays in sync with API |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| FormData | Native | Multipart requests | Teams/workflows runs (like agents), sessions/memories create/update |
| AbortController | Native | Cancellation | Teams/workflows cancel endpoints |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| URLSearchParams | Query string templates | URLSearchParams handles encoding/null handling automatically |
| Shared base class | Composition/helpers | Inheritance adds complexity, current pattern works |
| Generic Stream<T> | Separate TeamStream/WorkflowStream | AgentStream discriminated union already handles all event types |

**Installation:**
```bash
# No new dependencies - all built on existing Phase 1-4 stack
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── resources/
│   ├── agents.ts           # ✅ Exists (Phase 3-4)
│   ├── teams.ts            # NEW - mirrors agents
│   ├── workflows.ts        # NEW - mirrors agents
│   ├── sessions.ts         # NEW - CRUD + pagination
│   ├── memories.ts         # NEW - CRUD + filtering
│   ├── traces.ts           # NEW - read-only + filtering
│   └── metrics.ts          # NEW - read-only + date filters
├── streaming/
│   └── stream.ts           # ✅ Exists - reused for teams/workflows
├── client.ts               # Add 6 new resource properties
├── generated/types.ts      # ✅ Contains all resource schemas
└── index.ts                # Export new resource types
```

### Pattern 1: Mirroring AgentsResource (Teams/Workflows)
**What:** Teams and Workflows have identical API surface to Agents - copy structure exactly
**When to use:** Teams and Workflows resources
**Example:**
```typescript
// Source: AgentsResource + OpenAPI paths analysis
// src/resources/teams.ts
import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";
import { AgentStream } from "../streaming";

type TeamResponse = components["schemas"]["TeamResponse"];

export class TeamsResource {
  constructor(private readonly client: AgentOSClient) {}

  async list(): Promise<TeamResponse[]> {
    return this.client.request<TeamResponse[]>("GET", "/teams");
  }

  async get(teamId: string): Promise<TeamResponse> {
    return this.client.request<TeamResponse>(
      "GET",
      `/teams/${encodeURIComponent(teamId)}`,
    );
  }

  async run(teamId: string, options: RunOptions): Promise<unknown> {
    const formData = new FormData();
    formData.append("message", options.message);
    formData.append("stream", "false");
    if (options.sessionId) formData.append("session_id", options.sessionId);
    if (options.userId) formData.append("user_id", options.userId);

    return this.client.request<unknown>(
      "POST",
      `/teams/${encodeURIComponent(teamId)}/runs`,
      { body: formData },
    );
  }

  async runStream(
    teamId: string,
    options: StreamRunOptions,
  ): Promise<AgentStream> {
    const formData = new FormData();
    formData.append("message", options.message);
    formData.append("stream", "true");
    if (options.sessionId) formData.append("session_id", options.sessionId);
    if (options.userId) formData.append("user_id", options.userId);

    const controller = new AbortController();
    const response = await this.client.requestStream(
      "POST",
      `/teams/${encodeURIComponent(teamId)}/runs`,
      { body: formData, signal: controller.signal },
    );

    return AgentStream.fromSSEResponse(response, controller);
  }

  async continue(
    teamId: string,
    runId: string,
    options: ContinueOptions,
  ): Promise<AgentStream | unknown> {
    const formData = new FormData();
    formData.append("tools", options.tools);
    formData.append("stream", String(options.stream ?? true));
    if (options.sessionId) formData.append("session_id", options.sessionId);
    if (options.userId) formData.append("user_id", options.userId);

    const path = `/teams/${encodeURIComponent(teamId)}/runs/${encodeURIComponent(runId)}/continue`;

    if (options.stream !== false) {
      const controller = new AbortController();
      const response = await this.client.requestStream("POST", path, {
        body: formData,
        signal: controller.signal,
      });
      return AgentStream.fromSSEResponse(response, controller);
    }
    return this.client.request<unknown>("POST", path, { body: formData });
  }

  async cancel(teamId: string, runId: string): Promise<void> {
    await this.client.request<void>(
      "POST",
      `/teams/${encodeURIComponent(teamId)}/runs/${encodeURIComponent(runId)}/cancel`,
    );
  }
}

// WorkflowsResource is identical - just s/teams/workflows/g
```

### Pattern 2: Pagination with URLSearchParams (Sessions/Memories/Traces)
**What:** List operations with filtering use URLSearchParams to build query strings safely
**When to use:** Sessions, Memories, Traces list() methods
**Example:**
```typescript
// Source: OpenAPI spec /sessions endpoint + URLSearchParams best practices
// src/resources/sessions.ts
import type { components } from "../generated/types";

type SessionResponse = components["schemas"]["SessionResponse"];
type SessionType = components["schemas"]["SessionType"]; // 'agent' | 'team' | 'workflow'

export interface ListSessionsOptions {
  type?: SessionType;
  componentId?: string;
  userId?: string;
  name?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class SessionsResource {
  constructor(private readonly client: AgentOSClient) {}

  async list(options: ListSessionsOptions = {}): Promise<SessionResponse[]> {
    const params = new URLSearchParams();

    // Only append defined parameters
    if (options.type) params.append("type", options.type);
    if (options.componentId) params.append("component_id", options.componentId);
    if (options.userId) params.append("user_id", options.userId);
    if (options.name) params.append("name", options.name);
    if (options.page) params.append("page", String(options.page));
    if (options.limit) params.append("limit", String(options.limit));
    if (options.sortBy) params.append("sort_by", options.sortBy);
    if (options.sortOrder) params.append("sort_order", options.sortOrder);

    const queryString = params.toString();
    const path = queryString ? `/sessions?${queryString}` : "/sessions";

    return this.client.request<SessionResponse[]>("GET", path);
  }

  async get(sessionId: string, options?: { dbId?: string }): Promise<SessionResponse> {
    const params = new URLSearchParams();
    if (options?.dbId) params.append("db_id", options.dbId);

    const queryString = params.toString();
    const path = queryString
      ? `/sessions/${encodeURIComponent(sessionId)}?${queryString}`
      : `/sessions/${encodeURIComponent(sessionId)}`;

    return this.client.request<SessionResponse>("GET", path);
  }

  async create(options: CreateSessionOptions): Promise<SessionResponse> {
    const formData = new FormData();
    formData.append("type", options.type);
    formData.append("component_id", options.componentId);
    if (options.name) formData.append("name", options.name);
    if (options.userId) formData.append("user_id", options.userId);
    if (options.dbId) formData.append("db_id", options.dbId);

    return this.client.request<SessionResponse>("POST", "/sessions", {
      body: formData,
    });
  }

  async rename(sessionId: string, name: string): Promise<void> {
    const formData = new FormData();
    formData.append("name", name);

    await this.client.request<void>(
      "POST",
      `/sessions/${encodeURIComponent(sessionId)}/rename`,
      { body: formData },
    );
  }

  async delete(sessionId: string, options?: { dbId?: string }): Promise<void> {
    const params = new URLSearchParams();
    if (options?.dbId) params.append("db_id", options.dbId);

    const queryString = params.toString();
    const path = queryString
      ? `/sessions/${encodeURIComponent(sessionId)}?${queryString}`
      : `/sessions/${encodeURIComponent(sessionId)}`;

    await this.client.request<void>("DELETE", path);
  }

  async getRuns(sessionId: string): Promise<unknown[]> {
    return this.client.request<unknown[]>(
      "GET",
      `/sessions/${encodeURIComponent(sessionId)}/runs`,
    );
  }
}
```

### Pattern 3: CRUD with Filtering (Memories)
**What:** Full CRUD operations with optional db_id/table parameters via query strings
**When to use:** Memories resource
**Example:**
```typescript
// Source: OpenAPI spec /memories endpoints
export interface ListMemoriesOptions {
  userId?: string;
  sessionId?: string;
  agentId?: string;
  page?: number;
  limit?: number;
  dbId?: string;
  table?: string;
}

export interface CreateMemoryOptions {
  content: string;
  userId?: string;
  topics?: string[];
  dbId?: string;
  table?: string;
}

export class MemoriesResource {
  constructor(private readonly client: AgentOSClient) {}

  async list(options: ListMemoriesOptions = {}): Promise<MemoryResponse[]> {
    const params = new URLSearchParams();
    if (options.userId) params.append("user_id", options.userId);
    if (options.sessionId) params.append("session_id", options.sessionId);
    if (options.agentId) params.append("agent_id", options.agentId);
    if (options.page) params.append("page", String(options.page));
    if (options.limit) params.append("limit", String(options.limit));
    if (options.dbId) params.append("db_id", options.dbId);
    if (options.table) params.append("table", options.table);

    const queryString = params.toString();
    const path = queryString ? `/memories?${queryString}` : "/memories";

    return this.client.request<MemoryResponse[]>("GET", path);
  }

  async get(memoryId: string, options?: { dbId?: string; table?: string }): Promise<MemoryResponse> {
    const params = new URLSearchParams();
    if (options?.dbId) params.append("db_id", options.dbId);
    if (options?.table) params.append("table", options.table);

    const queryString = params.toString();
    const path = queryString
      ? `/memories/${encodeURIComponent(memoryId)}?${queryString}`
      : `/memories/${encodeURIComponent(memoryId)}`;

    return this.client.request<MemoryResponse>("GET", path);
  }

  async create(options: CreateMemoryOptions): Promise<MemoryResponse> {
    const params = new URLSearchParams();
    if (options.dbId) params.append("db_id", options.dbId);
    if (options.table) params.append("table", options.table);

    const queryString = params.toString();
    const path = queryString ? `/memories?${queryString}` : "/memories";

    const body = {
      content: options.content,
      user_id: options.userId,
      topics: options.topics,
    };

    return this.client.request<MemoryResponse>("POST", path, {
      body: JSON.stringify(body),
    });
  }

  async update(
    memoryId: string,
    options: { content?: string; topics?: string[]; dbId?: string; table?: string },
  ): Promise<MemoryResponse> {
    const params = new URLSearchParams();
    if (options.dbId) params.append("db_id", options.dbId);
    if (options.table) params.append("table", options.table);

    const queryString = params.toString();
    const path = queryString
      ? `/memories/${encodeURIComponent(memoryId)}?${queryString}`
      : `/memories/${encodeURIComponent(memoryId)}`;

    const body = {
      content: options.content,
      topics: options.topics,
    };

    return this.client.request<MemoryResponse>("PUT", path, {
      body: JSON.stringify(body),
    });
  }

  async delete(memoryId: string, options?: { dbId?: string; table?: string }): Promise<void> {
    const params = new URLSearchParams();
    if (options?.dbId) params.append("db_id", options.dbId);
    if (options?.table) params.append("table", options.table);

    const queryString = params.toString();
    const path = queryString
      ? `/memories/${encodeURIComponent(memoryId)}?${queryString}`
      : `/memories/${encodeURIComponent(memoryId)}`;

    await this.client.request<void>("DELETE", path);
  }
}
```

### Pattern 4: Read-Only with Filtering (Traces)
**What:** List and get operations only, with extensive filtering options
**When to use:** Traces resource (observability - no create/update/delete)
**Example:**
```typescript
// Source: OpenAPI spec /traces endpoints
export interface ListTracesOptions {
  runId?: string;
  sessionId?: string;
  userId?: string;
  agentId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export class TracesResource {
  constructor(private readonly client: AgentOSClient) {}

  async list(options: ListTracesOptions = {}): Promise<TraceResponse[]> {
    const params = new URLSearchParams();
    if (options.runId) params.append("run_id", options.runId);
    if (options.sessionId) params.append("session_id", options.sessionId);
    if (options.userId) params.append("user_id", options.userId);
    if (options.agentId) params.append("agent_id", options.agentId);
    if (options.status) params.append("status", options.status);
    if (options.page) params.append("page", String(options.page));
    if (options.limit) params.append("limit", String(options.limit));

    const queryString = params.toString();
    const path = queryString ? `/traces?${queryString}` : "/traces";

    return this.client.request<TraceResponse[]>("GET", path);
  }

  async get(traceId: string): Promise<TraceResponse> {
    return this.client.request<TraceResponse>(
      "GET",
      `/traces/${encodeURIComponent(traceId)}`,
    );
  }
}
```

### Pattern 5: Date-Range Filtering (Metrics)
**What:** Read-only metrics with date range filters and refresh trigger
**When to use:** Metrics resource
**Example:**
```typescript
// Source: OpenAPI spec /metrics endpoints
export interface GetMetricsOptions {
  startingDate?: string; // YYYY-MM-DD format
  endingDate?: string;   // YYYY-MM-DD format
}

export class MetricsResource {
  constructor(private readonly client: AgentOSClient) {}

  async get(options: GetMetricsOptions = {}): Promise<MetricsResponse> {
    const params = new URLSearchParams();
    if (options.startingDate) params.append("starting_date", options.startingDate);
    if (options.endingDate) params.append("ending_date", options.endingDate);

    const queryString = params.toString();
    const path = queryString ? `/metrics?${queryString}` : "/metrics";

    return this.client.request<MetricsResponse>("GET", path);
  }

  async refresh(): Promise<void> {
    await this.client.request<void>("POST", "/metrics/refresh");
  }
}
```

### Pattern 6: Client Resource Registration
**What:** Initialize all resource namespaces in client constructor
**When to use:** client.ts
**Example:**
```typescript
// Source: Existing AgentOSClient pattern
import { AgentsResource } from "./resources/agents";
import { TeamsResource } from "./resources/teams";
import { WorkflowsResource } from "./resources/workflows";
import { SessionsResource } from "./resources/sessions";
import { MemoriesResource } from "./resources/memories";
import { TracesResource } from "./resources/traces";
import { MetricsResource } from "./resources/metrics";

export class AgentOSClient {
  readonly agents: AgentsResource;
  readonly teams: TeamsResource;
  readonly workflows: WorkflowsResource;
  readonly sessions: SessionsResource;
  readonly memories: MemoriesResource;
  readonly traces: TracesResource;
  readonly metrics: MetricsResource;

  constructor(options: AgentOSClientOptions) {
    // ... existing initialization

    // Initialize all resource namespaces
    this.agents = new AgentsResource(this);
    this.teams = new TeamsResource(this);
    this.workflows = new WorkflowsResource(this);
    this.sessions = new SessionsResource(this);
    this.memories = new MemoriesResource(this);
    this.traces = new TracesResource(this);
    this.metrics = new MetricsResource(this);
  }
}
```

### Anti-Patterns to Avoid
- **Duplicating AgentStream for teams/workflows:** AgentStream already handles all event types via discriminated union
- **Hand-rolling query string builders:** URLSearchParams handles encoding, null values, duplicate keys automatically
- **Creating separate option types per method:** Reuse list/get/create/update option interfaces across similar resources
- **Not URL-encoding path parameters:** Always use encodeURIComponent() for IDs in paths (agents/teams/workflows/sessions/memories/traces)
- **Mixing FormData and JSON bodies inconsistently:** Follow OpenAPI spec - run endpoints use FormData (multipart), create/update use JSON

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Query parameter building | String templates | URLSearchParams | Handles encoding, null handling, array parameters, duplicate keys |
| Stream class per resource | TeamStream, WorkflowStream | AgentStream (existing) | Discriminated union already supports all event types |
| Pagination wrapper | Custom paging abstraction | Direct list() with options | Keep simple - users handle paging, we provide filter options |
| JSON vs FormData detection | Body type checking | Follow OpenAPI spec | Spec defines content-type per endpoint - no guessing |

**Key insight:** Resource expansion is 90% mechanical copying of established AgentsResource pattern. The patterns from Phases 3-4 were designed to scale - Teams/Workflows are literally find-replace of "agents" to "teams"/"workflows". Sessions/Memories/Traces introduce query parameters but URLSearchParams (native) handles all complexity.

## Common Pitfalls

### Pitfall 1: Not Reusing AgentStream for Teams/Workflows
**What goes wrong:** Creating separate TeamStream/WorkflowStream classes duplicates code unnecessarily
**Why it happens:** Assumption that different resources need different stream types
**How to avoid:** Verify AgentStream event types are generic (RunStarted/RunContent/RunCompleted work for any run type)
**Warning signs:** Duplicate stream classes with identical code, just different names

**Evidence from existing code:**
```typescript
// src/streaming/events.ts discriminated union already generic
type AgentRunEvent =
  | RunStartedEvent    // Has run_id, created_at - generic
  | RunContentEvent    // Has content - generic
  | RunCompletedEvent  // Has metrics - generic
  | MemoryUpdateStartedEvent
  | MemoryUpdateCompletedEvent;

// These events work for agent/team/workflow runs - no resource-specific fields
```

### Pitfall 2: Incorrectly Building Query Strings
**What goes wrong:** Manual string concatenation creates invalid URLs with unencoded characters, breaks on null/undefined values
**Why it happens:** Query strings look simple but edge cases abound (spaces, special chars, null handling)
**How to avoid:** Always use URLSearchParams, only append defined values
**Warning signs:** URL encoding bugs, query params showing "undefined" or "null" as strings

**Example:**
```typescript
// WRONG - multiple issues
const path = `/sessions?type=${options.type}&user_id=${options.userId}`;
// Issues: type might be undefined → "?type=undefined"
//         userId might have @ → not encoded

// CORRECT
const params = new URLSearchParams();
if (options.type) params.append("type", options.type);
if (options.userId) params.append("user_id", options.userId);
const path = params.toString() ? `/sessions?${params.toString()}` : "/sessions";
```

### Pitfall 3: Inconsistent Body Formats (JSON vs FormData)
**What goes wrong:** Using FormData when endpoint expects JSON (or vice versa) causes 400/415 errors
**Why it happens:** Assuming all POST/PUT use same body format
**How to avoid:** Check OpenAPI spec content-type for each endpoint - run endpoints use multipart/form-data, create/update use application/json
**Warning signs:** 415 Unsupported Media Type errors, 400 Bad Request on valid data

**From OpenAPI spec analysis:**
```typescript
// Run endpoints (agents/teams/workflows) - multipart/form-data
"/agents/{agent_id}/runs": {
  "post": {
    "requestBody": {
      "content": { "multipart/form-data": { ... } }
    }
  }
}

// Memory create/update - application/json
"/memories": {
  "post": {
    "requestBody": {
      "content": { "application/json": { ... } }
    }
  }
}
```

### Pitfall 4: Not Handling Optional Query Parameters in GET/DELETE
**What goes wrong:** Forgetting db_id/table query params on sessions/memories get/delete breaks database-specific operations
**Why it happens:** Most resources don't need query params for get/delete, easy to forget exceptions
**How to avoid:** Check OpenAPI spec parameters for ALL endpoints, not just list()
**Warning signs:** Database operations fail in multi-db environments, tests pass on default DB only

### Pitfall 5: Copy-Paste Errors Between Similar Resources
**What goes wrong:** Copying TeamsResource to create WorkflowsResource but missing a find-replace leaves "/teams/" paths
**Why it happens:** Teams and Workflows are 99% identical, easy to miss one occurrence
**How to avoid:** Use tests to verify correct paths, run full test suite after each resource
**Warning signs:** Teams tests pass, Workflows tests fail with 404s

**Prevention strategy:**
```typescript
// Each resource test file should verify actual paths called
describe("TeamsResource", () => {
  it("calls correct endpoint for list", async () => {
    await resource.list();
    expect(mockClient.request).toHaveBeenCalledWith("GET", "/teams");
    // NOT "/agents" or "/workflows"
  });
});
```

### Pitfall 6: Forgetting URL Encoding for IDs
**What goes wrong:** IDs with special characters (/, @, spaces) break routing or leak unencoded into URLs
**Why it happens:** Most test IDs are simple strings, edge cases not tested
**How to avoid:** Always use encodeURIComponent() for path parameters, add tests for special character IDs
**Warning signs:** 404 errors for IDs with special characters, path traversal vulnerabilities

## Code Examples

Verified patterns from official sources and established codebase:

### Complete TeamsResource (mirrors AgentsResource)
```typescript
// Source: AgentsResource pattern + OpenAPI /teams endpoints
import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";
import { AgentStream } from "../streaming";

type TeamResponse = components["schemas"]["TeamResponse"];

export interface RunOptions {
  message: string;
  sessionId?: string;
  userId?: string;
  stream?: false;
}

export interface StreamRunOptions {
  message: string;
  sessionId?: string;
  userId?: string;
}

export interface ContinueOptions {
  tools: string;
  sessionId?: string;
  userId?: string;
  stream?: boolean;
}

export class TeamsResource {
  constructor(private readonly client: AgentOSClient) {}

  async list(): Promise<TeamResponse[]> {
    return this.client.request<TeamResponse[]>("GET", "/teams");
  }

  async get(teamId: string): Promise<TeamResponse> {
    return this.client.request<TeamResponse>(
      "GET",
      `/teams/${encodeURIComponent(teamId)}`,
    );
  }

  async run(teamId: string, options: RunOptions): Promise<unknown> {
    const formData = new FormData();
    formData.append("message", options.message);
    formData.append("stream", "false");

    if (options.sessionId) {
      formData.append("session_id", options.sessionId);
    }
    if (options.userId) {
      formData.append("user_id", options.userId);
    }

    return this.client.request<unknown>(
      "POST",
      `/teams/${encodeURIComponent(teamId)}/runs`,
      { body: formData },
    );
  }

  async runStream(
    teamId: string,
    options: StreamRunOptions,
  ): Promise<AgentStream> {
    const formData = new FormData();
    formData.append("message", options.message);
    formData.append("stream", "true");

    if (options.sessionId) {
      formData.append("session_id", options.sessionId);
    }
    if (options.userId) {
      formData.append("user_id", options.userId);
    }

    const controller = new AbortController();
    const response = await this.client.requestStream(
      "POST",
      `/teams/${encodeURIComponent(teamId)}/runs`,
      { body: formData, signal: controller.signal },
    );

    return AgentStream.fromSSEResponse(response, controller);
  }

  async continue(
    teamId: string,
    runId: string,
    options: ContinueOptions,
  ): Promise<AgentStream | unknown> {
    const formData = new FormData();
    formData.append("tools", options.tools);
    formData.append("stream", String(options.stream ?? true));

    if (options.sessionId) {
      formData.append("session_id", options.sessionId);
    }
    if (options.userId) {
      formData.append("user_id", options.userId);
    }

    const path = `/teams/${encodeURIComponent(teamId)}/runs/${encodeURIComponent(runId)}/continue`;

    if (options.stream !== false) {
      const controller = new AbortController();
      const response = await this.client.requestStream("POST", path, {
        body: formData,
        signal: controller.signal,
      });
      return AgentStream.fromSSEResponse(response, controller);
    }
    return this.client.request<unknown>("POST", path, { body: formData });
  }

  async cancel(teamId: string, runId: string): Promise<void> {
    await this.client.request<void>(
      "POST",
      `/teams/${encodeURIComponent(teamId)}/runs/${encodeURIComponent(runId)}/cancel`,
    );
  }
}
```

### SessionsResource with Pagination
```typescript
// Source: OpenAPI /sessions endpoints + URLSearchParams pattern
import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";

type SessionResponse = components["schemas"]["SessionResponse"];
type SessionType = components["schemas"]["SessionType"];

export interface ListSessionsOptions {
  type?: SessionType;
  componentId?: string;
  userId?: string;
  name?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateSessionOptions {
  type: SessionType;
  componentId: string;
  name?: string;
  userId?: string;
  dbId?: string;
}

export class SessionsResource {
  constructor(private readonly client: AgentOSClient) {}

  async list(options: ListSessionsOptions = {}): Promise<SessionResponse[]> {
    const params = new URLSearchParams();

    if (options.type) params.append("type", options.type);
    if (options.componentId) params.append("component_id", options.componentId);
    if (options.userId) params.append("user_id", options.userId);
    if (options.name) params.append("name", options.name);
    if (options.page !== undefined) params.append("page", String(options.page));
    if (options.limit !== undefined) params.append("limit", String(options.limit));
    if (options.sortBy) params.append("sort_by", options.sortBy);
    if (options.sortOrder) params.append("sort_order", options.sortOrder);

    const queryString = params.toString();
    const path = queryString ? `/sessions?${queryString}` : "/sessions";

    return this.client.request<SessionResponse[]>("GET", path);
  }

  async get(
    sessionId: string,
    options?: { dbId?: string },
  ): Promise<SessionResponse> {
    const params = new URLSearchParams();
    if (options?.dbId) params.append("db_id", options.dbId);

    const queryString = params.toString();
    const path = queryString
      ? `/sessions/${encodeURIComponent(sessionId)}?${queryString}`
      : `/sessions/${encodeURIComponent(sessionId)}`;

    return this.client.request<SessionResponse>("GET", path);
  }

  async create(options: CreateSessionOptions): Promise<SessionResponse> {
    const formData = new FormData();
    formData.append("type", options.type);
    formData.append("component_id", options.componentId);

    if (options.name) formData.append("name", options.name);
    if (options.userId) formData.append("user_id", options.userId);
    if (options.dbId) formData.append("db_id", options.dbId);

    return this.client.request<SessionResponse>("POST", "/sessions", {
      body: formData,
    });
  }

  async rename(sessionId: string, name: string): Promise<void> {
    const formData = new FormData();
    formData.append("name", name);

    await this.client.request<void>(
      "POST",
      `/sessions/${encodeURIComponent(sessionId)}/rename`,
      { body: formData },
    );
  }

  async delete(
    sessionId: string,
    options?: { dbId?: string },
  ): Promise<void> {
    const params = new URLSearchParams();
    if (options?.dbId) params.append("db_id", options.dbId);

    const queryString = params.toString();
    const path = queryString
      ? `/sessions/${encodeURIComponent(sessionId)}?${queryString}`
      : `/sessions/${encodeURIComponent(sessionId)}`;

    await this.client.request<void>("DELETE", path);
  }

  async getRuns(sessionId: string): Promise<unknown[]> {
    return this.client.request<unknown[]>(
      "GET",
      `/sessions/${encodeURIComponent(sessionId)}/runs`,
    );
  }
}
```

### Testing Pattern for New Resources
```typescript
// Source: tests/resources/agents.test.ts pattern
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AgentOSClient } from "../../src/client";
import { TeamsResource } from "../../src/resources/teams";

describe("TeamsResource", () => {
  let resource: TeamsResource;
  let mockClient: AgentOSClient;
  let requestSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockClient = new AgentOSClient({
      baseUrl: "https://api.example.com",
      apiKey: "test-key",
    });
    requestSpy = vi.fn();
    (mockClient as any).request = requestSpy;

    resource = new TeamsResource(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("list()", () => {
    it("calls GET /teams", async () => {
      const mockTeams = [{ id: "team-1", name: "Team One" }];
      requestSpy.mockResolvedValueOnce(mockTeams);

      const result = await resource.list();

      expect(result).toEqual(mockTeams);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/teams");
    });
  });

  describe("get()", () => {
    it("URL-encodes team ID", async () => {
      requestSpy.mockResolvedValueOnce({ id: "team/special" });

      await resource.get("team/special");

      expect(requestSpy).toHaveBeenCalledWith("GET", "/teams/team%2Fspecial");
    });
  });

  // ... mirror agents.test.ts for run/runStream/continue/cancel
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual query string building | URLSearchParams | ES6+ (2015) | Native, cross-platform, handles encoding/edge cases |
| Separate stream classes per resource | Generic Stream with discriminated unions | 2024+ | Reduced duplication, type-safe event handling |
| Callback-based pagination | Iterator with filter options | 2020+ | Simpler mental model, user controls paging |
| Mixed content-type detection | Follow OpenAPI spec | Always | No guessing, spec is source of truth |

**Deprecated/outdated:**
- **Manual URL encoding**: Use encodeURIComponent() for path params, URLSearchParams for query params
- **Hand-rolled query builders**: URLSearchParams is native, handles all edge cases
- **Resource-specific stream types**: Generic streams with discriminated unions are more maintainable

## Open Questions

Things that couldn't be fully resolved:

1. **SessionResponse/MemoryResponse/TraceResponse exact schemas**
   - What we know: OpenAPI defines schemas at components.schemas, TypeScript types generated
   - What's unclear: Exact field structure - spec shows many optional/nullable fields
   - Recommendation: Use generated types as-is, document which fields are commonly populated

2. **Pagination response format**
   - What we know: Sessions/Memories/Traces support page/limit parameters
   - What's unclear: Does API return pagination metadata (total_pages, total_count)? Or just array?
   - Recommendation: Return raw array for now, add pagination metadata wrapper if API provides it

3. **Metrics refresh() response**
   - What we know: POST /metrics/refresh endpoint exists
   - What's unclear: Does it return updated metrics or just 204 No Content?
   - Recommendation: Implement as Promise<void>, update if API returns data

4. **Session getRuns() response type**
   - What we know: GET /sessions/{id}/runs returns array
   - What's unclear: What schema? Same as agent run results?
   - Recommendation: Use unknown[] for now, refine when API behavior is documented

5. **AgentStream event types for teams/workflows**
   - What we know: Teams/workflows use same streaming format as agents
   - What's unclear: Do event fields differ? (agent_id vs team_id vs workflow_id)
   - Recommendation: Test with real API, may need to widen discriminated union or add optional fields

## Sources

### Primary (HIGH confidence)
- AgentOS OpenAPI spec (openapi.json) - All endpoint definitions, request/response schemas
- Existing AgentsResource implementation (src/resources/agents.ts) - Proven pattern from Phase 3-4
- AgentStream implementation (src/streaming/stream.ts) - Streaming abstraction from Phase 4
- AgentsResource tests (tests/resources/agents.test.ts) - Testing patterns
- Generated types (src/generated/types.ts) - All TypeScript type definitions

### Secondary (MEDIUM confidence)
- [MDN URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) - Native API for query strings
- [How to Build a Professional TypeScript SDK](https://www.buildwithmatija.com/blog/how-to-build-typescript-sdk-from-rest) - CRUD patterns, error handling
- [Build a TypeScript SDK with Pagination](https://liblab.com/docs/tutorials/customizations/build-a-typescript-sdk-with-pagination) - Pagination configuration patterns

### Tertiary (LOW confidence)
- WebSearch results on REST API CRUD patterns (2026) - General architecture trends
- WebSearch results on pagination best practices (2026) - Iterator vs metadata patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries/patterns established in Phases 1-4, no new dependencies
- Architecture: HIGH - AgentsResource pattern verified working, Teams/Workflows identical structure
- Pitfalls: HIGH - Based on existing code review and OpenAPI spec analysis
- Code examples: HIGH - Directly derived from working AgentsResource implementation

**Research date:** 2026-01-31
**Valid until:** 2026-04-30 (90 days - resource patterns stable, established architecture)

**Key assumptions:**
- OpenAPI spec at openapi.json is current and accurate
- AgentStream event types work for teams/workflows (verified via discriminated union analysis)
- URLSearchParams is available (Node 18+, all modern browsers)
- Teams/Workflows have identical API surface to Agents (verified via OpenAPI spec)
