# Phase 1: Project Setup & Foundation - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Configure SDK package for dual ESM/CJS distribution with proper TypeScript setup. This is infrastructure — the foundation enabling all subsequent phases. No SDK functionality is implemented here, only the build/test/package scaffolding.

</domain>

<decisions>
## Implementation Decisions

### Build Tooling
- Use **tsup** (esbuild-based) for dual ESM/CJS output
- Generate declaration maps (.d.ts.map) for source navigation
- Include source maps in published package for debugging
- Target **Node.js 18** as minimum version (LTS, native fetch)

### Test Framework
- Use **Vitest** as test runner (fast, native ESM/TS support)
- Tests in **separate directory** (`tests/`) mirroring `src/` structure
- Track coverage but **no threshold enforcement** (report only, don't fail builds)

### Package Exports
- **Single entry point** — everything exported from `@ajshedivy/agentos-sdk`
- Package name: `@ajshedivy/agentos-sdk` (scoped under npm username)
- Main export named `AgentOSClient` (matches Python SDK)
- Error classes exported separately: `import { AgentOSClient, NotFoundError } from '...'`

### Claude's Discretion
- Browser testing setup timing (Phase 1 vs Phase 7)
- Exact tsup configuration options
- ESLint vs Biome for linting (not discussed, use judgment)
- Pre-commit hooks configuration

</decisions>

<specifics>
## Specific Ideas

- Match Python SDK naming where possible (AgentOSClient)
- Package should work for both internal testing and external developer use
- Verify with publint.dev before considering Phase 1 complete

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-project-setup-foundation*
*Context gathered: 2026-01-31*
