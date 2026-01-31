# Phase 3: Type Generation & First Resource - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the OpenAPI type generation infrastructure and implements the complete agents resource as the first real API resource. This establishes patterns for all future resources.

**In scope:**
- OpenAPI-to-TypeScript type generation pipeline (tools, workflow, where types live)
- Agents resource with list(), get(), and run() methods (non-streaming only)
- Resource namespace pattern (how client.agents exposes methods)
- Class-based architecture that will be replicated for teams, workflows, sessions, etc.

**Out of scope:**
- Streaming support (Phase 4)
- Other API resources besides agents (Phase 5)
- File uploads (Phase 6)

</domain>

<decisions>
## Implementation Decisions

### Type Generation Approach
- **Tool:** openapi-typescript (types only, no runtime code generation)
- **Location:** src/generated/types.ts (single generated file, committed to git)
- **Manual overrides:** Allowed - can create wrapper types if needed for better developer experience
- **Script invocation:** Claude's discretion (balance between keeping types fresh vs build speed)

### Resource Namespace Pattern
- **Namespace style:** `client.agents.list()` (shallow namespaces for discoverability - aligns with initial planning decision)
- **Implementation:** Class-based - `new AgentsResource(client)` for organization and maintainability
- **Method access:** Protected `request()` method - change from private to protected so resource classes can access it
- **File structure:** Separate files per resource - `src/resources/agents.ts` (scales cleanly as resources are added)

### Claude's Discretion
- Whether to run type generation manually (`npm run generate:types`) or as pre-build hook
- Whether/when to create wrapper types that transform generated types for better DX
- Exact class structure, constructor patterns, and helper methods within resource classes
- How resource classes are instantiated (constructor vs lazy initialization)

</decisions>

<specifics>
## Specific Ideas

No specific requirements - open to standard approaches that prioritize:
- Maintainability as SDK grows to 7 resources
- TypeScript-friendly patterns with good IDE autocomplete
- Clean separation of concerns

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 03-type-generation-and-first-resource*
*Context gathered: 2026-01-31*
