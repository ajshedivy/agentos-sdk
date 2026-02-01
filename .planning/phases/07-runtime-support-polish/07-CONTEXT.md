# Phase 7: Runtime Support & Polish - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Validate SDK works in Node.js 18+, ensure comprehensive test coverage, and prepare for npm publication. Browser support is explicitly out of scope for v1.

</domain>

<decisions>
## Implementation Decisions

### Documentation Style
- Well-organized README with small examples for core API features
- Reference Python docs structure: https://docs.agno.com/reference/clients/agentos-client
- One example per resource (agents, teams, workflows, knowledge, etc.)
- Runtime limitations documented in API reference sections where relevant, not as prominent standalone section

### Runtime Scope
- **Node.js only for v1** — Browser support removed from scope
- SDK is primarily for Node.js-based apps building agentic AI
- Browser usage (if it works incidentally) is undocumented and untested
- No browser examples or browser-specific tests

### CI/Publishing Workflow
- Test against Node.js 18, 20, and 22 (broad compatibility)
- CI triggers on both PRs and pushes to main
- npm publishing via CI on version tag (push v1.0.0 → CI publishes)
- Coverage report generated in CI logs, no external service (Codecov)

### Claude's Discretion
- TypeScript emphasis level in documentation
- Exact README section ordering
- Coverage thresholds (if any)
- Specific CI job naming and structure

</decisions>

<specifics>
## Specific Ideas

- Match Python docs organization from https://docs.agno.com/reference/clients/agentos-client
- Small, focused examples per resource — not exhaustive but representative
- Agentic AI use case focus: Node.js backends integrating with AgentOS

</specifics>

<deferred>
## Deferred Ideas

- Browser support — future enhancement if needed
- INFR-02 requirement (browser support) — defer to v2

</deferred>

---

*Phase: 07-runtime-support-polish*
*Context gathered: 2026-02-01*
