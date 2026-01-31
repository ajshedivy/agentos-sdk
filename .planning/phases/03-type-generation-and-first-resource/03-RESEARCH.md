# Phase 3: Type Generation & First Resource - Research

**Researched:** 2026-01-31
**Domain:** OpenAPI type generation, TypeScript SDK resource architecture, API client patterns
**Confidence:** HIGH

## Summary

This phase establishes the type generation pipeline using openapi-typescript 7.x and implements the agents resource as the first real API resource, setting patterns for all future resources. Research covered three primary domains: OpenAPI-to-TypeScript type generation tooling and best practices, resource namespace architectural patterns from production SDKs (Stripe, OpenAI), and common pitfalls in type generation and SDK design.

**Key findings:**
- openapi-typescript 7.x is the current standard (v7.10.1) for type-only generation with excellent TypeScript support
- Resource namespace pattern (client.resource.method()) is standard across modern SDKs, implemented via class-based architecture
- Type generation should run as prebuild hook to ensure types stay current without requiring manual regeneration
- Generated types should be committed to git for better IDE support and CI/CD reliability
- OpenAPI spec uses `additionalProperties: true` extensively - requires noUncheckedIndexedAccess for type safety

**Primary recommendation:** Use openapi-typescript 7.x with prebuild hook, class-based resource pattern with protected request() method, commit generated types to git, and create minimal wrapper types only when necessary for developer experience.

## Standard Stack

The established libraries/tools for OpenAPI type generation and TypeScript SDK architecture:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| openapi-typescript | 7.10.1 | Type-only generation from OpenAPI 3.x specs | Industry standard for type generation, no runtime code, supports OpenAPI 3.0/3.1, TypeScript AST-based, active maintenance |
| FormData | Native | Multipart form-data support for file uploads | Built-in browser/Node.js API, required for multipart/form-data requests |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @hey-api/openapi-ts | Latest | Alternative to openapi-typescript-codegen | If need runtime client generation (NOT for this project - user chose types-only approach) |
| openapi-fetch | Latest | Type-safe fetch wrapper for openapi-typescript | If starting fresh without custom HTTP layer (NOT needed - we have custom http.ts) |
| vitest-mock-extended | Latest | Enhanced TypeScript mocking | If need to mock entire resource classes in tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| openapi-typescript | openapi-typescript-codegen | Generates runtime client code, but unmaintained and heavier approach |
| openapi-typescript | @hey-api/openapi-ts | Fork with more features but less focused on types-only approach |
| Class-based resources | Plain object namespaces | Simpler but loses organization benefits and harder to test |
| Protected request() | Public request() | More flexible but exposes internal HTTP implementation details |

**Installation:**
```bash
npm install -D openapi-typescript@^7.10.1
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── generated/
│   └── types.ts              # Generated OpenAPI types (committed to git)
├── resources/
│   ├── agents.ts             # AgentsResource class
│   ├── teams.ts              # (Phase 5) TeamsResource class
│   └── workflows.ts          # (Phase 5) WorkflowsResource class
├── client.ts                 # AgentOSClient with resource initialization
├── http.ts                   # HTTP layer with request methods
├── errors.ts                 # Typed error classes
├── types.ts                  # Hand-written types and type utilities
└── index.ts                  # Public API exports
```

### Pattern 1: Type Generation Pipeline
**What:** Automated OpenAPI-to-TypeScript type generation integrated into build process
**When to use:** Always - keeps types fresh without manual intervention
**Example:**
```bash
# package.json scripts
{
  "scripts": {
    "generate:types": "openapi-typescript http://localhost:7777/openapi.json -o src/generated/types.ts",
    "prebuild": "npm run generate:types",
    "predev": "npm run generate:types"
  }
}
```
**Configuration:**
```typescript
// tsconfig.json - Required settings for openapi-typescript 7.x
{
  "compilerOptions": {
    "module": "ESNext",          // Required: ESNext or NodeNext
    "moduleResolution": "bundler", // Required: Bundler or NodeNext
    "noUncheckedIndexedAccess": true // Critical for additionalProperties safety
  }
}
```

### Pattern 2: Resource Class Architecture
**What:** Class-based resource organization with protected HTTP access
**When to use:** For all API resource namespaces (agents, teams, workflows, etc.)
**Example:**
```typescript
// Source: Research synthesis from Stripe/OpenAI SDK patterns + user decision
// src/resources/agents.ts
import type { paths, components } from '../generated/types';

type AgentResponse = components['schemas']['AgentResponse'];
type AgentListResponse = paths['/agents']['get']['responses'][200]['content']['application/json'];
type AgentGetResponse = paths['/agents/{agent_id}']['get']['responses'][200]['content']['application/json'];

export class AgentsResource {
  constructor(private client: AgentOSClient) {}

  async list(): Promise<AgentListResponse> {
    return this.client.request('GET', '/agents');
  }

  async get(agentId: string): Promise<AgentGetResponse> {
    return this.client.request('GET', `/agents/${agentId}`);
  }

  async run(agentId: string, options: AgentRunOptions): Promise<AgentRunResponse> {
    // Non-streaming only in Phase 3
    return this.client.request('POST', `/agents/${agentId}/runs`, {
      body: { ...options, stream: false }
    });
  }
}

// src/client.ts
export class AgentOSClient {
  public readonly agents: AgentsResource;

  constructor(options: AgentOSClientOptions) {
    // ... existing initialization
    this.agents = new AgentsResource(this);
  }

  // Change from private to protected for resource access
  protected async request<T>(
    method: string,
    path: string,
    options?: RequestOptions
  ): Promise<T> {
    // ... existing implementation
  }
}
```

### Pattern 3: Type Extraction from Generated Types
**What:** Extract specific types from generated paths/components using TypeScript utility types
**When to use:** When building method signatures or creating wrapper types
**Example:**
```typescript
// Source: https://openapi-ts.dev/examples
import type { paths, components } from './generated/types';

// Extract from components.schemas
type Agent = components['schemas']['AgentResponse'];

// Extract request body types
type AgentRunRequest = paths['/agents/{agent_id}/runs']['post']['requestBody']['content']['multipart/form-data'];

// Extract response types
type AgentRunSuccess = paths['/agents/{agent_id}/runs']['post']['responses'][200]['content']['application/json'];
type AgentRunError = paths['/agents/{agent_id}/runs']['post']['responses'][400]['content']['application/json'];

// Extract path parameters
type AgentIdParam = paths['/agents/{agent_id}']['get']['parameters']['path']['agent_id'];
```

### Pattern 4: Multipart Form-Data for File Uploads
**What:** Use native FormData API for multipart/form-data requests (agent run with files in Phase 6)
**When to use:** Any endpoint accepting files (agent runs, future file uploads)
**Example:**
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Using_FormData_Objects
// Note: Phase 3 is non-streaming only, no files - this pattern for Phase 6

async run(agentId: string, options: AgentRunOptions): Promise<AgentRunResponse> {
  const formData = new FormData();
  formData.append('message', options.message);
  formData.append('stream', 'false');

  if (options.sessionId) {
    formData.append('session_id', options.sessionId);
  }

  // Phase 6: File upload support
  if (options.files) {
    for (const file of options.files) {
      formData.append('files', file);
    }
  }

  return this.client.request('POST', `/agents/${agentId}/runs`, {
    body: formData,
    headers: {
      // CRITICAL: Don't set Content-Type - browser/Node.js sets with boundary
      'Content-Type': undefined
    }
  });
}
```

### Pattern 5: Lazy vs Constructor Resource Initialization
**What:** Choose between lazy initialization (getter) or constructor instantiation for resource classes
**When to use:**
- Constructor instantiation: For always-used resources, simpler code
- Lazy initialization: For optional/expensive resources (not applicable here)
**Example:**
```typescript
// Source: Research on lazy initialization patterns
// Constructor approach (RECOMMENDED for this SDK - all resources are lightweight)
export class AgentOSClient {
  public readonly agents: AgentsResource;

  constructor(options: AgentOSClientOptions) {
    this.agents = new AgentsResource(this);
  }
}

// Lazy approach (NOT RECOMMENDED here - unnecessary complexity)
export class AgentOSClient {
  private _agents?: AgentsResource;

  get agents(): AgentsResource {
    if (!this._agents) {
      this._agents = new AgentsResource(this);
    }
    return this._agents;
  }
}
```

### Anti-Patterns to Avoid
- **Manual type definitions when OpenAPI types exist:** Don't hand-write types that can be generated - creates maintenance burden and drift
- **Transform generated types unnecessarily:** Resist converting snake_case to camelCase - adds manual typing overhead
- **Use TypeScript namespaces for resources:** Modern ESM modules are preferred over TypeScript namespaces
- **Generic-based request methods:** Generics hide type errors - use path-based type inference instead
- **Private request() method:** Prevents resource classes from accessing HTTP layer - use protected

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OpenAPI type generation | Custom parser/generator | openapi-typescript 7.x | Handles discriminators, anyOf, oneOf, nullable, additionalProperties, TypeScript 5.x features |
| Multipart form-data encoding | Manual boundary/encoding | Native FormData API | Cross-platform (browser/Node.js), handles boundaries automatically, supports files/blobs |
| Type extraction from paths | String parsing/inference | TypeScript indexed access types | Type-safe, no runtime overhead, works with IDE autocomplete |
| Resource class mocking | Manual mock objects | vi.spyOn + vi.mocked() | Type-safe mocking, integrates with Vitest, proper prototype handling |
| anyOf/oneOf type unions | Manual discriminated unions | openapi-typescript discriminator support | Handles inline schemas, property-level discriminators, mapping |

**Key insight:** Type generation from OpenAPI is deceptively complex - discriminators, nullable, anyOf/oneOf, and additionalProperties all have edge cases that openapi-typescript handles correctly. Custom solutions invariably miss cases that break IDE autocomplete or runtime validation.

## Common Pitfalls

### Pitfall 1: additionalProperties: true Generates Unsafe Index Types
**What goes wrong:** OpenAPI schemas with `additionalProperties: true` generate `Record<string, T>` which allows unchecked property access, leading to runtime null reference errors
**Why it happens:** TypeScript by default allows accessing any string key on objects without checking if it exists
**How to avoid:** Enable `noUncheckedIndexedAccess: true` in tsconfig.json - types additionalProperties as `T | undefined` forcing explicit checks
**Warning signs:** TypeScript doesn't complain about accessing properties that might not exist, runtime errors when accessing optional nested properties

**Example:**
```typescript
// OpenAPI schema: additionalProperties: true
type Agent = components['schemas']['AgentResponse'];
// Generated as: { tools?: Record<string, object>, ... }

// Without noUncheckedIndexedAccess - compiles but unsafe
const toolName = agent.tools.myTool.name; // Runtime error if myTool doesn't exist

// With noUncheckedIndexedAccess - forces safety
const toolName = agent.tools?.myTool?.name; // Type error forces optional chaining
```

### Pitfall 2: Setting Content-Type for FormData Breaks Multipart Boundary
**What goes wrong:** Manually setting `Content-Type: multipart/form-data` on FormData requests prevents the browser/Node.js from adding the required boundary parameter, causing 400 errors
**Why it happens:** The boundary (e.g., `------WebKitFormBoundary...`) is randomly generated and must match the request body - manual header breaks this
**How to avoid:** Never set Content-Type for FormData requests - let fetch() set it automatically with correct boundary
**Warning signs:** 400 Bad Request errors on multipart/form-data endpoints, server logs show "no multipart boundary found"

**Example:**
```typescript
// WRONG - breaks boundary
const formData = new FormData();
formData.append('message', 'Hello');
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'multipart/form-data' }, // Missing boundary!
  body: formData
});

// CORRECT - browser/Node.js adds boundary automatically
fetch(url, {
  method: 'POST',
  body: formData // No Content-Type header set
});
```

### Pitfall 3: Generated Types Committed vs Ignored
**What goes wrong:** Treating generated types like build artifacts (.gitignore) breaks IDE autocomplete for team members and CI/CD type checking
**Why it happens:** Common misconception that generated code shouldn't be committed, but types are different from runtime code
**How to avoid:** Commit `src/generated/types.ts` to git, run generation in prebuild hook as insurance
**Warning signs:** Team members report missing types, CI fails on fresh checkout, IDE autocomplete doesn't work until manual generation

**Rationale:**
- IDE autocomplete works immediately on clone/checkout
- Git diffs show API changes explicitly
- CI/CD doesn't require OpenAPI spec access
- Prebuild hook keeps types fresh during development

### Pitfall 4: Private request() Method Prevents Resource Class Access
**What goes wrong:** Making the request() method private blocks resource classes from making HTTP calls, forcing duplication or workarounds
**Why it happens:** Over-encapsulation - trying to hide implementation details even from internal classes
**How to avoid:** Use protected visibility for request() method - accessible to subclasses/resource classes but not external consumers
**Warning signs:** Resource classes have no clean way to make authenticated requests, code duplication of HTTP logic, awkward workarounds

**Example:**
```typescript
// WRONG - private blocks resource access
export class AgentOSClient {
  private async request<T>(...) { } // Resources can't call this
}

// CORRECT - protected allows internal access
export class AgentOSClient {
  protected async request<T>(...) { } // Resources can call this
}

// Resource class usage
export class AgentsResource {
  constructor(private client: AgentOSClient) {}

  async list() {
    return this.client.request('GET', '/agents'); // Works with protected
  }
}
```

### Pitfall 5: anyOf/oneOf with Inline Schemas Breaks Discriminators
**What goes wrong:** When OpenAPI spec uses `anyOf` or `oneOf` with inline schemas (not $ref), discriminators may not work correctly in generated types
**Why it happens:** TypeScript unions don't provide XOR behavior, and inline schemas prevent proper discriminator mapping
**How to avoid:** Verify discriminated unions in generated types work with TypeScript narrowing, add wrapper types if needed
**Warning signs:** TypeScript can't narrow union types by discriminator property, IDE autocomplete shows all union members

**Example from OpenAPI spec:**
```typescript
// If AgentOS API uses anyOf with inline schemas
type ModelResponse = components['schemas']['ModelResponse'];
// May generate: { name: string } | { model: string }

// TypeScript can't discriminate without shared property
if ('name' in model) { } // Type narrowing may not work correctly

// Solution: Add wrapper type with proper discriminator
type ModelWithType =
  | { type: 'openai'; name: string }
  | { type: 'anthropic'; model: string };
```

### Pitfall 6: Outdated TypeScript Configuration Breaks openapi-typescript 7.x
**What goes wrong:** openapi-typescript 7.x requires specific TypeScript compiler options - older configs cause cryptic errors or break generated types
**Why it happens:** Version 7 uses TypeScript AST and expects ESM module resolution
**How to avoid:** Verify tsconfig.json has `"module": "ESNext"` (or "NodeNext") and `"moduleResolution": "bundler"` (or "NodeNext")
**Warning signs:** Type generation errors, generated types have import/export issues, IDE shows module resolution errors

**Required tsconfig.json settings:**
```json
{
  "compilerOptions": {
    "module": "ESNext",              // Required: ESNext or NodeNext
    "moduleResolution": "bundler",   // Required: bundler or NodeNext
    "noUncheckedIndexedAccess": true // Recommended for additionalProperties safety
  }
}
```

## Code Examples

Verified patterns from official sources:

### Generating Types from OpenAPI Spec
```bash
# Source: https://www.npmjs.com/package/openapi-typescript
# Generate from local OpenAPI spec
npx openapi-typescript http://localhost:7777/openapi.json -o src/generated/types.ts

# With configuration options
npx openapi-typescript http://localhost:7777/openapi.json \
  -o src/generated/types.ts \
  --default-non-nullable    # Treat properties with defaults as required
```

### Accessing Generated Types
```typescript
// Source: https://openapi-ts.dev/examples
import type { paths, components } from './generated/types';

// Schema types from components
type Agent = components['schemas']['AgentResponse'];
type AgentRun = components['schemas']['Body_create_agent_run'];

// Path operation types
type AgentListResponse = paths['/agents']['get']['responses'][200]['content']['application/json'];

// Request body types
type CreateRunRequest = paths['/agents/{agent_id}/runs']['post']['requestBody']['content']['multipart/form-data'];

// Error response types
type BadRequestError = paths['/agents/{agent_id}/runs']['post']['responses'][400]['content']['application/json'];
```

### Resource Class with Generated Types
```typescript
// Source: Pattern synthesis from OpenAI/Stripe SDKs + openapi-typescript docs
import type { AgentOSClient } from './client';
import type { paths, components } from './generated/types';

type AgentResponse = components['schemas']['AgentResponse'];
type AgentListResponse = paths['/agents']['get']['responses'][200]['content']['application/json'];

export class AgentsResource {
  constructor(private readonly client: AgentOSClient) {}

  /**
   * List all agents configured in the OS instance
   */
  async list(): Promise<AgentListResponse> {
    return this.client.request('GET', '/agents');
  }

  /**
   * Get detailed configuration for a specific agent
   */
  async get(agentId: string): Promise<AgentResponse> {
    return this.client.request('GET', `/agents/${agentId}`);
  }

  /**
   * Execute an agent with a message (non-streaming only in Phase 3)
   */
  async run(
    agentId: string,
    options: {
      message: string;
      sessionId?: string;
      userId?: string;
    }
  ): Promise<unknown> {
    return this.client.request('POST', `/agents/${agentId}/runs`, {
      body: {
        message: options.message,
        stream: false,
        session_id: options.sessionId,
        user_id: options.userId,
      },
    });
  }
}
```

### Client Integration with Resource Namespace
```typescript
// Source: User decision + SDK pattern research
import { AgentsResource } from './resources/agents';
import type { AgentOSClientOptions } from './types';

export class AgentOSClient {
  public readonly agents: AgentsResource;

  private readonly baseUrl: string;
  // ... other private fields

  constructor(options: AgentOSClientOptions) {
    // ... existing initialization
    this.baseUrl = options.baseUrl.replace(/\/$/, '');

    // Initialize resource namespaces
    this.agents = new AgentsResource(this);
  }

  /**
   * Make an authenticated request to the API
   * Changed to protected to allow resource class access
   */
  protected async request<T>(
    method: string,
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = this.buildHeaders(options.headers);

    return requestWithRetry<T>(
      url,
      { method, headers, body: options.body },
      this.maxRetries,
      this.timeout
    );
  }
}
```

### Testing Resource Classes with Vitest
```typescript
// Source: https://vitest.dev/guide/mocking.html + https://soorria.com/snippets/mocking-classes-vitest
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentOSClient } from '../src/client';
import { AgentsResource } from '../src/resources/agents';

describe('AgentsResource', () => {
  let client: AgentOSClient;
  let agents: AgentsResource;

  beforeEach(() => {
    client = new AgentOSClient({ baseUrl: 'http://localhost:7777' });
    agents = client.agents;

    // Mock the protected request method
    vi.spyOn(client as any, 'request').mockResolvedValue({
      id: 'test-agent',
      name: 'Test Agent',
    });
  });

  it('calls GET /agents for list()', async () => {
    await agents.list();

    expect(client['request']).toHaveBeenCalledWith('GET', '/agents');
  });

  it('calls GET /agents/{id} for get()', async () => {
    await agents.get('test-agent');

    expect(client['request']).toHaveBeenCalledWith('GET', '/agents/test-agent');
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| openapi-typescript-codegen | openapi-typescript (types) + openapi-fetch (runtime) | 2023-2024 | Separation of concerns - types vs runtime, codegen unmaintained |
| String manipulation for type generation | TypeScript AST | openapi-typescript 7.0 (2024) | More accurate types, better handling of edge cases |
| TypeScript namespaces for SDK structure | ESM modules with class-based resources | 2020+ | Better tree-shaking, modern module system, standard imports |
| Manual null checking | noUncheckedIndexedAccess | TypeScript 4.1+ (2020) | Compile-time safety for index access, prevents runtime errors |
| Ignoring generated types in git | Committing generated types | 2024-2025 | Better DX, IDE autocomplete works immediately, CI reliability |

**Deprecated/outdated:**
- **openapi-typescript-codegen**: Unmaintained since 2023, replaced by @hey-api/openapi-ts fork or openapi-typescript for types-only
- **TypeScript namespaces for resource organization**: Modern SDKs use ESM modules and classes instead
- **--defaultNonNullable=false**: openapi-typescript 7.x defaults to true, treating default values as required
- **Generic-based type safety**: Modern approach uses path inference from generated types instead of manual generics

## Open Questions

Things that couldn't be fully resolved:

1. **Agent run() non-streaming response type**
   - What we know: POST /agents/{agent_id}/runs with stream=false returns JSON, OpenAPI spec shows `schema: {}` (empty object)
   - What's unclear: Exact response schema structure for non-streaming runs - spec doesn't define it
   - Recommendation: Use `unknown` type for Phase 3, refine in Phase 4 when implementing streaming (SSE response will be clearer)

2. **multipart/form-data in http.ts for Phase 6**
   - What we know: Current http.ts sets `Content-Type: application/json`, agent run endpoint needs multipart/form-data for files
   - What's unclear: Whether to detect FormData and skip Content-Type, or add explicit option to request()
   - Recommendation: Phase 3 doesn't need files - defer to Phase 6, likely solution is detect FormData instance and skip Content-Type header

3. **Error response schema mapping**
   - What we know: OpenAPI defines BadRequestResponse, NotFoundResponse, etc., existing errors.ts has typed error classes
   - What's unclear: Whether generated error types should replace hand-written types or complement them
   - Recommendation: Keep hand-written error classes for instanceof checks, optionally add generated types as properties for structured error details

4. **Protected vs public request() for future extensibility**
   - What we know: Protected allows resource classes to call request(), private blocks them, public exposes implementation
   - What's unclear: If users might want to extend AgentOSClient or create custom resources
   - Recommendation: Start with protected (user decision) - provides internal access while keeping public API clean, can change to public later if needed

## Sources

### Primary (HIGH confidence)
- [openapi-typescript npm package](https://www.npmjs.com/package/openapi-typescript) - Current version, installation, basic usage
- [openapi-typescript GitHub repository](https://github.com/openapi-ts/openapi-typescript) - Source code, issues, examples
- [openapi-typescript official documentation](https://openapi-ts.dev/) - Comprehensive usage guide, CLI options, examples
- [openapi-typescript v7 changelog](https://github.com/openapi-ts/openapi-typescript/blob/main/packages/openapi-typescript/CHANGELOG.md) - Version 7 features and changes
- [MDN FormData documentation](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Using_FormData_Objects) - Native FormData API usage
- [TypeScript noUncheckedIndexedAccess](https://openapi-ts.dev/advanced) - Official guidance on additionalProperties safety
- AgentOS OpenAPI spec (http://localhost:7777/openapi.json) - Source of truth for API structure

### Secondary (MEDIUM confidence)
- [Stripe Node.js SDK architecture](https://github.com/stripe/stripe-node) - Resource namespace pattern example
- [OpenAI Node.js SDK structure](https://github.com/openai/openai-node) - Modern SDK resource organization
- [Vitest mocking guide](https://vitest.dev/guide/mocking.html) - Testing patterns for TypeScript classes
- [React & REST APIs: End-To-End TypeScript Based On OpenAPI Docs](https://profy.dev/article/react-openapi-typescript) - Type generation best practices
- [Generating TypeScript Types with OpenAPI (HackerOne)](https://www.pullrequest.com/blog/generating-typescript-types-with-openapi-for-rest-api-consumption/) - Workflow and CI integration

### Tertiary (LOW confidence)
- WebSearch results on SDK architecture patterns (2026) - General trends, not library-specific
- WebSearch results on lazy vs constructor initialization - General pattern comparison
- Medium articles on multipart/form-data - Implementation examples, not authoritative source

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - openapi-typescript is verifiable current standard, official npm/docs confirm version and features
- Architecture: HIGH - Resource pattern verified in production SDKs (Stripe, OpenAI), openapi-typescript docs confirm type extraction patterns
- Pitfalls: MEDIUM-HIGH - Most confirmed via official docs (additionalProperties, Content-Type), some from issue trackers and experience reports
- Code examples: HIGH - All sourced from official documentation or verified SDK repositories

**Research date:** 2026-01-31
**Valid until:** ~2026-04-30 (90 days - openapi-typescript stable, SDK patterns slow-changing)
**Key assumptions:**
- openapi-typescript 7.x remains current (no v8 breaking changes)
- AgentOS OpenAPI spec structure matches http://localhost:7777/openapi.json
- TypeScript 5.7 compiler behavior (current in project)
- Node.js 22.x environment (confirmed via node --version)
