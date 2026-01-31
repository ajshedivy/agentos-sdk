# AgentOS TypeScript SDK

## What This Is

A fully compliant TypeScript/Node.js SDK for the Agno AgentOS API. Enables developers to connect to AgentOS instances from Node.js applications and browsers, with first-class streaming support, type safety, and an intuitive resource-based API surface. Built for both internal testing at Agno and external developers integrating AgentOS into their products.

## Core Value

Developers can run agents, teams, and workflows with streaming responses in under 5 lines of code — the SDK handles connection, authentication, SSE parsing, and type safety invisibly.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] HTTP client with Bearer token authentication
- [ ] Shallow resource namespaces (agents, teams, workflows, sessions, knowledge, memories, traces, evals, metrics, core)
- [ ] Full coverage of ~40 AgentOS API endpoints
- [ ] SSE streaming for agent/team/workflow runs
- [ ] Dual streaming interface: async iterators AND event emitters
- [ ] Flexible file uploads: paths, buffers, streams with auto content-type detection
- [ ] Typed error classes for API errors (400/401/404/422/500)
- [ ] Full TypeScript types generated from OpenAPI spec
- [ ] Node.js runtime support (18+)
- [ ] Browser runtime support (fetch-based)
- [ ] Mock client for SDK testing
- [ ] Comprehensive test suite

### Out of Scope

- CLI tool — SDK only, no command-line interface
- Code generation tooling — types generated once, not runtime codegen
- Retry/backoff logic — keep simple, users can add their own
- Caching layer — users manage their own caching
- WebSocket support — API uses SSE, not WebSockets

## Context

**AgentOS API:**
- RESTful API with ~40 endpoints across agents, teams, workflows, sessions, knowledge, memories, traces, evals, metrics
- SSE streaming for run endpoints (agents, teams, workflows)
- Multipart form data for file uploads (images, audio, video, PDFs)
- Bearer token authentication
- OpenAPI 3.1 spec available at `/openapi.json`

**Existing Reference:**
- Python `AgentOSClient` exists in the Agno ecosystem
- No existing TypeScript/JavaScript client
- Can reference Python client patterns for consistency

**Target Users:**
1. Internal Agno team for testing AgentOS
2. External developers building products on AgentOS

## Constraints

- **Runtime**: Must work in Node.js 18+ and modern browsers — no Node-specific APIs in core
- **Dependencies**: Minimize dependencies — prefer native fetch, avoid heavy libraries
- **Package**: Published under `ajshedivy/agentos-sdk` (personal open source project)
- **Types**: Generated from OpenAPI spec — must stay in sync with API

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Shallow resource namespaces | Better discoverability than flat namespace, mirrors API structure, industry standard (Stripe, OpenAI) | — Pending |
| Dual streaming (iterators + events) | Flexibility for different use cases — modern async/await AND familiar event patterns | — Pending |
| Flexible file input (paths + buffers) | Developer convenience — SDK normalizes, user provides what's easy | — Pending |
| Typed error classes | Better DX than generic errors — catch specific error types | — Pending |
| Mock client for SDK tests only | Keep external story simple — just hit real API | — Pending |

---
*Last updated: 2026-01-31 after initialization*
