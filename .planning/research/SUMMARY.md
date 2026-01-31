# Project Research Summary

**Project:** AgentOS TypeScript SDK
**Domain:** TypeScript API SDK Development (Node.js + Browser)
**Researched:** 2026-01-31
**Confidence:** HIGH

## Executive Summary

The AgentOS SDK is a TypeScript API client for a RESTful API with server-sent events (SSE) streaming and file upload capabilities. Based on research into production SDKs (OpenAI, Stripe, Anthropic) and industry best practices, the recommended approach is a **resource-based architecture** using native modern web APIs (fetch, FormData, native SSE) with dual ESM/CommonJS packaging. The core technical challenge is delivering excellent developer experience through comprehensive TypeScript types, dual streaming interfaces (async iterators + events), and flexible file upload handling while maintaining zero runtime dependencies.

The recommended stack centers on **@hey-api/openapi-ts** for type generation, **native fetch API** for HTTP (avoiding axios and legacy libraries), **tsup** for dual-format bundling, and **Vitest** for testing. This stack is production-proven (used by Vercel, PayPal) and leverages Node.js 20+ native capabilities that eliminate the need for polyfills. The architecture follows industry patterns: client entry point → resource namespaces → HTTP client layer → typed error hierarchy, with clear separation between core infrastructure and domain resources.

The critical risks identified are: (1) dual package ESM/CJS hazard causing instanceof failures across module systems, (2) SSE connection exhaustion on HTTP/1.1 (6-connection browser limit), (3) token refresh race conditions under concurrent requests, (4) incomplete OpenAPI error type generation (4xx/5xx responses), and (5) file upload Content-Type header misconfiguration. These must be addressed in specific phases (detailed below) or they become expensive to fix later, requiring major version bumps.

## Key Findings

### Recommended Stack

The research strongly recommends a **modern, zero-dependency stack** leveraging Node.js 20+ native APIs. The key insight is that in 2026, fetch, FormData, and SSE streaming are native to both Node.js and browsers, eliminating the need for axios, node-fetch, form-data, and similar libraries that dominated 2020-era SDKs.

**Core technologies:**
- **TypeScript 5.7+**: Industry standard for SDKs with template literal types for API validation (strict mode required)
- **@hey-api/openapi-ts 0.67+**: OpenAPI → TypeScript codegen used by Vercel, OpenCode, PayPal — generates production-ready SDKs with better DX than openapi-generator
- **Native Fetch API**: Built into Node.js 18+, all modern browsers, Deno, Bun, Cloudflare Workers — zero dependencies, handles Bearer auth, SSE, multipart perfectly
- **tsup 8.5+**: Bundle ESM + CJS dual formats powered by esbuild (note: maintenance ending, consider tsdown for future)
- **Vitest 4.0+**: Testing framework with 17M weekly downloads, Browser Mode stable, faster than Jest with better TypeScript support
- **Zod 3.24+**: Runtime schema validation to complement compile-time TypeScript types

**Critical versions:**
- Node.js 20+ required (native fetch, FormData, SSE support)
- Pin @hey-api/openapi-ts exact version with -E flag (active development)
- Avoid: axios (50KB+ for features now native), node-fetch (redundant), openapi-typescript-codegen (unmaintained since 2023)

### Expected Features

The research analyzed feature expectations across OpenAI, Stripe, and Anthropic SDKs to establish what users consider "table stakes" versus differentiators.

**Must have (table stakes):**
- Full TypeScript type definitions — 80% of developers expect this, enables IntelliSense/autocomplete
- Promise-based async API — modern JavaScript pattern, no callbacks
- Bearer token authentication — standard API auth with env variable configuration
- Automatic retries with exponential backoff — prevents transient failures (2-3 retries, configurable)
- Timeout configuration — global default + per-request override
- Error handling with typed exceptions — separate error classes (AuthenticationError, RateLimitError, TimeoutError, APIError, ValidationError)
- Request ID tracking — essential for debugging via .withResponse() pattern or response metadata
- Node.js support (18+) — primary runtime for server-side TypeScript
- Multipart file uploads — accept File, Blob, ReadStream, fs.ReadStream (works in Node + browser)
- SSE streaming support — critical for real-time AI responses with stream: true parameter
- Environment variable configuration — read from process.env by default, allow explicit override

**Should have (competitive advantage):**
- Streaming helpers with event handlers — .on('text', ...), .on('event', ...) patterns plus auto-accumulation with .finalMessage()
- Zod schema integration — runtime validation + type safety for tool definitions
- Response metadata access — comprehensive debugging via .withResponse() or .lastResponse (access headers, status, timing)
- AbortSignal/cancellation support — proper async operation control, accept AbortSignal on all calls
- Pagination helpers — auto-iterator with for await...of, manual pagination with continuationToken
- Per-request configuration override — flexibility for edge cases (timeout, retries, baseURL, headers)
- Browser support — expand to frontend apps when API supports CORS (modern browsers only)
- Webhook signature verification — built-in HMAC-SHA256 verification with typed payloads

**Defer (v2+):**
- Request/response interceptors — advanced middleware pattern, add when monitoring/logging needs emerge
- Telemetry/observability hooks — enterprise feature (OpenTelemetry integration), wait for enterprise customers
- Multiple runtime support (Deno, Bun, Edge) — add based on actual usage requests

**Anti-features (avoid):**
- Callback-based API alongside Promises — doubles API surface, confusing docs
- Synchronous API methods — blocks event loop, anti-pattern
- Built-in request caching — cache invalidation is hard, wrong layer (should be app-level)
- Automatic rate limit handling with delays — makes requests unpredictable, hides resource usage
- const enum usage — incompatible with Babel 7, breaks module boundaries
- Default exports — hurts tree-shaking, makes refactoring harder

### Architecture Approach

The standard architecture for modern TypeScript API SDKs is a **layered, resource-based design** with clear separation of concerns. This pattern is validated by production SDKs (OpenAI, Stripe, Azure) and provides excellent discoverability through namespace organization that mirrors the REST API structure.

**Major components:**
1. **Client (entry point)** — Main entry point, holds configuration, aggregates resources (single class with resource properties)
2. **Resources (namespaced endpoints)** — One class per logical grouping (agents, teams, workflows, sessions) with methods matching API operations (list, get, create, delete, run)
3. **HTTP Client (core layer)** — Wraps fetch, adds auth headers (Bearer token), handles retries, manages timeouts, base URL configuration
4. **Error Handler** — Translates HTTP responses to typed exception hierarchy (NotFoundError, ValidationError, AuthenticationError)
5. **Streaming Handler** — Parses SSE format, provides dual interfaces (AsyncIterable for modern async/await + EventEmitter for compatibility)
6. **Serializer/Uploads** — Handles multipart/form-data for file uploads, accepts multiple input types (path string, Buffer, Stream, File, Blob) and normalizes internally
7. **Type Definitions** — Generated from OpenAPI spec (auto-generated) plus manual types for client configuration and streaming

**Key architectural patterns:**
- **Resource-based client:** `client.agents.create()` not `client.createAgent()` — mirrors REST API, better autocomplete, excellent discoverability
- **Dual streaming interface:** Provide BOTH async iterator (`for await (const chunk of stream)`) AND event emitter (`stream.on('data', ...)`) — flexibility for different developer preferences
- **Typed error hierarchy:** Subclass Error for each HTTP status with structured info — type-safe error handling with instanceof checks
- **Flexible file upload input:** Accept string path, Buffer, Stream, File, Blob — SDK normalizes internally, works in Node and browser
- **Options bags over positional args:** Use object parameters for methods with >2 parameters — self-documenting, easy to extend

**Project structure:**
```
src/
├── index.ts                    # Public API exports
├── client.ts                   # Main Client class
├── resources/                  # Resource implementations (agents.ts, teams.ts, workflows.ts, sessions.ts, knowledge.ts, memories.ts, traces.ts, evals.ts)
├── core/                       # Core infrastructure (http.ts, streaming.ts, errors.ts, uploads.ts)
├── types/                      # Type definitions (generated/ + manual)
└── _test/                      # Internal test utilities
```

### Critical Pitfalls

These pitfalls must be addressed in specific phases or recovery becomes expensive (major version bumps required).

1. **Dual Package Hazard (ESM/CommonJS)** — Singleton instances duplicated across module systems cause instanceof failures and state desynchronization. **Prevention:** Use conditional exports in package.json, build with tsup, set `"sideEffects": false`, verify with publint.dev and arethetypeswrong.github.io. **Phase:** Phase 1 (Project Setup) — configure correctly from start, recovery requires major version bump.

2. **OpenAPI Type Generation - Incomplete Error Types** — Auto-generated types only cover 2xx responses, missing 4xx/5xx schemas. Runtime receives structured errors but TypeScript thinks `void`/`unknown`, causing production crashes. **Prevention:** Manually audit generated types for all status codes (200, 201, 400, 401, 403, 404, 500, 503), use discriminated unions with status codes, test error scenarios. **Phase:** Phase 2 (Core API Client) — define comprehensive error types alongside success types.

3. **Token Refresh Race Condition** — Multiple concurrent requests detect expired token simultaneously, trigger parallel refresh attempts. Last-to-complete overwrites valid token with used refresh token, causing "invalid_grant" errors and random logouts under load. **Prevention:** Implement mutex for token refresh using async-mutex library, queue subsequent requests, use BroadcastChannel for browser tab sync. **Phase:** Phase 3 (Authentication) — implement from start, retrofitting is complex.

4. **SSE Connection Limit Exhaustion (HTTP/1.1)** — Browser limits SSE to 6 connections per domain over HTTP/1.1. 7th stream hangs indefinitely. **Prevention:** Document HTTP/2 requirement, implement connection pooling with multiplexing, provide fallback warnings, prefer single connection with stream IDs over multiple EventSource instances. **Phase:** Phase 4 (Streaming) — design for connection reuse before implementing multiple streams.

5. **Strict Mode Disabled** — Shipping with `strictNullChecks: false` or `strict: false` allows undefined/null assignments to any type, causing "Cannot read property of undefined" despite "type safety." **Prevention:** Enable strict mode in tsconfig.json from day one, treat as non-negotiable, fix compiler errors properly (no `any` or `@ts-ignore` bypasses). **Phase:** Phase 1 (Project Setup) — enable immediately, enabling later creates hundreds of errors requiring weeks to fix.

6. **File Upload - Manual Content-Type Header** — Manually setting `Content-Type: multipart/form-data` prevents browser/fetch from adding required boundary parameter. Server rejects with "Missing boundary" or silently fails to parse. **Prevention:** Never set Content-Type for FormData requests, let fetch set it automatically, document this explicitly (counterintuitive), add runtime warning if user passes FormData + Content-Type. **Phase:** Phase 5 (File Uploads) — document and test thoroughly.

7. **TypeScript Version Assumptions** — SDK uses TS 5.8+ features but consumer runs TS 4.9, causing cryptic compiler errors in node_modules. **Prevention:** Specify TypeScript peer dependency in package.json, use conservative features for public API (target TS 4.9+), test compilation against multiple TS versions in CI, document minimum version. **Phase:** Phase 2 (Core API Client) — set version policy before publishing.

## Implications for Roadmap

Based on research, the recommended phase structure prioritizes **foundation → core infrastructure → streaming/uploads → complete API coverage**. This order is critical because architectural decisions in early phases (dual package configuration, strict mode, error hierarchy) are expensive to change later.

### Phase 1: Project Setup & Foundation
**Rationale:** Research shows dual package hazards and strict mode issues are nearly impossible to fix after initial release (require major version bumps). These must be configured correctly from day one.

**Delivers:**
- Dual package configuration (ESM + CJS) with conditional exports verified via publint.dev
- TypeScript strict mode enabled with proper tsconfig.json
- Build tooling (tsup for dual bundling)
- Development environment (Vitest, prettier, eslint)
- Package.json configured for Node.js 20+ requirement

**Addresses:**
- Dual package hazard (Pitfall 1)
- Strict mode disabled (Pitfall 5)

**Avoids:** Major version bump to fix module system issues later

**Research needed:** None — standard patterns, well-documented

### Phase 2: Core API Client & Error Handling
**Rationale:** HTTP client and error hierarchy form the foundation for all resources. Research shows incomplete error typing (OpenAPI Pitfall 2) must be addressed here, not retrofitted later. TypeScript version compatibility policy (Pitfall 7) must be set before first publish.

**Delivers:**
- HTTP client wrapper around native fetch
- Bearer token authentication
- Typed error class hierarchy (NotFoundError, ValidationError, AuthenticationError, RateLimitError, TimeoutError, APIError)
- Request/response interceptor hooks
- Retry logic with exponential backoff
- Timeout configuration (global + per-request)
- Environment variable configuration

**Addresses:**
- Missing error types (Pitfall 2)
- TypeScript version compatibility (Pitfall 7)
- Error handling with typed exceptions (table stakes feature)
- Automatic retries (table stakes feature)
- Timeout configuration (table stakes feature)

**Implements:** HTTP Client, Error Handler components from architecture

**Research needed:** Minimal — standard HTTP client patterns

### Phase 3: Basic Resources & Type Generation
**Rationale:** Implement one complete resource (agents) to validate the full stack before expanding. This includes OpenAPI type generation with error types, allowing early detection of issues.

**Delivers:**
- OpenAPI type generation setup (@hey-api/openapi-ts config)
- Generated types with 2xx AND 4xx/5xx error schemas
- Single resource implementation (agents) with full CRUD
- Client class with single resource namespace
- Unit tests with mocked HTTP client
- Integration test setup

**Addresses:**
- Full TypeScript type definitions (table stakes)
- Request ID tracking (table stakes)

**Implements:** Client, Resources, Type Definitions components

**Research needed:** Low — validate OpenAPI spec quality, ensure error schemas present

### Phase 4: SSE Streaming Support
**Rationale:** Streaming is a core feature for agent/team/workflow runs. Research shows SSE connection limits (Pitfall 4) require architectural planning from the start — connection pooling cannot be retrofitted easily.

**Delivers:**
- SSE parser for native fetch streaming responses
- StreamWrapper with dual interfaces (AsyncIterable + EventEmitter)
- Connection pooling/multiplexing to avoid 6-connection browser limit
- AbortSignal support for stream cancellation
- Streaming helpers (.on('text', ...), .finalMessage())
- HTTP/2 requirement documentation

**Addresses:**
- SSE streaming support (table stakes)
- SSE connection limit (Pitfall 4)
- AbortSignal/cancellation support (competitive feature)
- Streaming helpers (competitive feature)

**Implements:** Streaming Handler component

**Research needed:** Medium — test connection pooling across browsers, validate HTTP/2 detection

### Phase 5: File Uploads
**Rationale:** File uploads are complex due to Node/browser differences and the Content-Type pitfall (Pitfall 6). This phase comes after streaming because both are isolated features that don't depend on each other.

**Delivers:**
- File input normalization (path string, Buffer, Stream, File, Blob)
- FormData construction with automatic content-type detection
- Upload progress events
- Browser + Node.js runtime detection
- Knowledge resource upload methods
- Documentation warning against manual Content-Type header

**Addresses:**
- Multipart file uploads (table stakes)
- File upload Content-Type header (Pitfall 6)

**Implements:** Serializer/Uploads component

**Research needed:** Low — standard patterns, test across Node/browser

### Phase 6: Complete API Coverage
**Rationale:** With core infrastructure validated (HTTP client, streaming, uploads), expand to all resources. This phase is straightforward application of established patterns.

**Delivers:**
- All remaining resources (teams, workflows, sessions, knowledge, memories, traces, evals)
- Full endpoint coverage matching OpenAPI spec
- Response metadata access (.withResponse())
- Per-request configuration overrides
- Comprehensive integration tests

**Addresses:**
- Node.js support (table stakes)
- Response metadata access (competitive feature)
- Per-request configuration override (competitive feature)

**Implements:** Complete Resources layer

**Research needed:** None — repeat Phase 3 patterns

### Phase 7: Browser Support & Pagination
**Rationale:** Browser support expands usage but isn't required for v1.0 (primary use case is Node.js server-side). Pagination is needed only when paginated endpoints exist in API.

**Delivers:**
- Browser compatibility testing (Chrome, Safari, Firefox)
- Platform-specific code isolation (fs module detection)
- Pagination helpers (auto-iterator, continuationToken)
- Multi-runtime documentation (Node, browser, Vercel Edge, Cloudflare Workers)

**Addresses:**
- Browser support (competitive feature, v1.x)
- Pagination helpers (competitive feature, v1.x)

**Research needed:** Medium — cross-browser testing, pagination API design validation

### Phase 8: Publishing & DX Polish
**Rationale:** Final phase ensures excellent developer experience and proper npm publishing with all quality checks.

**Delivers:**
- Dual package build verification (publint.dev, arethetypeswrong)
- Tree-shaking verification (sideEffects: false)
- Bundle size analysis (webpack-bundle-analyzer)
- Examples (basic usage, streaming, file uploads)
- Documentation (README, API reference, helpers.md)
- npm publish with proper package.json fields

**Addresses:**
- Tree-shakeable exports (publishing checklist)
- Detailed API documentation (competitive feature)

**Research needed:** None — publishing checklist

### Phase Ordering Rationale

- **Foundation first (Phase 1):** Dual package and strict mode issues are nearly impossible to fix post-release. These must be correct from day one.
- **Core before resources (Phase 2-3):** HTTP client and error hierarchy are used by all resources. Changing error patterns after multiple resources exist requires refactoring entire codebase.
- **Streaming isolated (Phase 4):** SSE streaming is complex and independent. Connection pooling architecture must be designed upfront or 6-connection limit becomes unfixable without major version bump.
- **Browser support deferred (Phase 7):** Primary use case is Node.js server-side. Browser compatibility can be added incrementally without breaking existing usage.
- **Publishing last (Phase 8):** Package configuration, tree-shaking, and documentation require complete implementation to validate properly.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 4 (Streaming):** SSE connection pooling implementation patterns are complex. Need to research how OpenAI/Anthropic SDKs handle this, validate HTTP/2 detection methods, test across browsers.
- **Phase 7 (Browser Support):** Cross-browser testing requirements, platform detection patterns, and polyfill strategies need validation.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Project Setup):** Well-documented dual package patterns, standard tsconfig.json
- **Phase 2 (Core API Client):** Standard HTTP client wrapper pattern, established error hierarchy patterns
- **Phase 3 (Basic Resources):** OpenAPI type generation is well-documented, CRUD patterns are standard
- **Phase 5 (File Uploads):** FormData usage is standard, file normalization patterns are established
- **Phase 6 (Complete API Coverage):** Repeat patterns from Phase 3
- **Phase 8 (Publishing):** Standard npm publishing checklist

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | @hey-api/openapi-ts is production-proven (Vercel, PayPal), native fetch API is standard in 2026, Vitest is mainstream. All recommendations verified with official documentation and real-world usage. |
| Features | HIGH | Feature analysis based on production SDKs (OpenAI, Stripe, Anthropic) with clear patterns. Table stakes vs competitive advantage validated across multiple sources. |
| Architecture | HIGH | Resource-based client architecture is industry standard. Dual streaming interface validated by Anthropic SDK. Error hierarchy pattern used by all major SDKs. Project structure matches Azure/OpenAI patterns. |
| Pitfalls | HIGH | Dual package hazard, token refresh race condition, SSE connection limits, and strict mode issues all have documented real-world incidents and proven solutions. OpenAPI error type gap validated by openapi-typescript maintainer discussions. |

**Overall confidence:** HIGH

All four research areas reached high confidence through verification with official sources, production SDK analysis, and community consensus. The recommended stack is proven in production at scale (Vercel uses @hey-api/openapi-ts, Node.js 20+ native fetch is standard). Architecture patterns are validated by multiple Fortune 500 company SDKs (OpenAI, Stripe, Anthropic, Azure, Twilio). Pitfalls are documented with real-world recovery costs and prevention strategies.

### Gaps to Address

While overall confidence is high, a few areas need validation during implementation:

- **SSE connection pooling implementation:** Research found the problem (6-connection HTTP/1.1 limit) and solution (connection pooling with multiplexing), but specific implementation details need validation during Phase 4. Test how OpenAI SDK handles this in practice.

- **OpenAPI spec quality for error schemas:** Research assumes AgentOS API has comprehensive error schemas in OpenAPI spec (4xx/5xx responses). This needs verification during Phase 3. If error schemas are missing, types must be manually defined.

- **Token refresh requirements:** Research addresses OAuth token refresh race condition (Pitfall 3), but AgentOS may use simple API keys (Bearer token) without refresh. Confirm authentication model during Phase 2 planning.

- **Browser CORS configuration:** Phase 7 (Browser Support) assumes API will support CORS for browser requests. Confirm API configuration supports cross-origin requests from web apps.

## Sources

### Primary (HIGH confidence)
- @hey-api/openapi-ts GitHub (https://github.com/hey-api/openapi-ts) — Features, current state, usage patterns (verified Jan 2026)
- @hey-api/openapi-ts Documentation (https://heyapi.dev/openapi-ts/get-started) — Installation, configuration (verified Jan 2026)
- Vitest 4.0 Release (https://vitest.dev/blog/vitest-4) — Version 4.0 features, Browser Mode stable (Dec 2025)
- MDN: Using Server-Sent Events (https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) — Native SSE support
- MDN: Using FormData Objects (https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Using_FormData_Objects) — Native multipart upload
- OpenAI Node.js SDK (https://github.com/openai/openai-node) — Resource-based architecture, streaming patterns
- Stripe Node.js SDK (https://github.com/stripe/stripe-node) — Error handling, retry logic
- Anthropic SDK (https://github.com/anthropics/anthropic-sdk-typescript) — Dual streaming interface, Zod integration
- Azure SDK TypeScript Design Guidelines (https://azure.github.io/azure-sdk/typescript_design.html) — Architecture patterns
- Publishing dual ESM+CJS packages (https://mayank.co/blog/dual-packages/) — Dual package configuration
- GitHub - dual-package-hazard (https://github.com/GeoffreyBooth/dual-package-hazard) — Module system issues
- How to handle concurrency with OAuth token refreshes (https://nango.dev/blog/concurrency-with-oauth-token-refreshes) — Mutex pattern

### Secondary (MEDIUM confidence)
- Axios vs. Fetch (2025 update) (https://blog.logrocket.com/axios-vs-fetch-2025/) — Comparison, recommendation for fetch (verified 2025)
- TypeScript Best Practices 2026 (https://johal.in/typescript-best-practices-for-large-scale-web-applications-in-2026/) — Modern TypeScript patterns
- tsup GitHub (https://github.com/egoist/tsup) — Version 8.5.1, maintenance status (verified Nov 2025)
- Stainless: Bearer Token Best Practices (https://www.stainless.com/sdk-api-best-practices/authorization-bearer-token-header-example-for-apis) — SDK auth patterns
- TypeScript anti-patterns - Tomasz Ducin (https://ducin.dev/typescript-anti-patterns) — Anti-patterns
- The Right Way to Build a TypeScript SDK (https://hsnice16.medium.com/the-right-way-to-build-a-typescript-sdk-75657476bc95) — SDK design

### Tertiary (LOW confidence)
- State of TypeScript 2026 (Node.js 22 native TS support, TS 7.0 Go compiler) — No official verification yet
- tsdown as tsup replacement — Very new (2025), limited production usage

---
*Research completed: 2026-01-31*
*Ready for roadmap: yes*
