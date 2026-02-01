# Requirements: AgentOS TypeScript SDK

**Defined:** 2026-01-31
**Core Value:** Developers can run agents, teams, and workflows with streaming responses in under 5 lines of code

## v1 Requirements

Requirements for initial release. Full functional parity with Python AgentOSClient.

### Core

- [x] **CORE-01**: Client can be instantiated with baseUrl and timeout configuration
- [x] **CORE-02**: Client can retrieve OS configuration via getConfig()
- [x] **CORE-03**: Client can check health status via health()
- [x] **CORE-04**: Client supports Bearer token auth (client-level or per-request headers)
- [x] **CORE-05**: All requests/responses have full TypeScript types

### Agents

- [x] **AGNT-01**: Client can list all agents via agents.list()
- [x] **AGNT-02**: Client can get agent details via agents.get(agentId)
- [x] **AGNT-03**: Client can run agent (non-streaming) via agents.run(agentId, options)
- [x] **AGNT-04**: Client can run agent (streaming) via agents.runStream(agentId, options)
- [x] **AGNT-05**: Client can continue paused agent run via agents.continue(agentId, runId, options)
- [x] **AGNT-06**: Client can cancel agent run via agents.cancel(agentId, runId)
- [x] **AGNT-07**: Streaming returns typed events (RunStartedEvent, RunContentEvent, RunCompletedEvent, etc.)

### Teams

- [x] **TEAM-01**: Client can list all teams via teams.list()
- [x] **TEAM-02**: Client can get team details via teams.get(teamId)
- [x] **TEAM-03**: Client can run team (non-streaming) via teams.run(teamId, options)
- [x] **TEAM-04**: Client can run team (streaming) via teams.runStream(teamId, options)
- [x] **TEAM-05**: Client can cancel team run via teams.cancel(teamId, runId)

### Workflows

- [x] **WKFL-01**: Client can list all workflows via workflows.list()
- [x] **WKFL-02**: Client can get workflow details via workflows.get(workflowId)
- [x] **WKFL-03**: Client can run workflow (non-streaming) via workflows.run(workflowId, options)
- [x] **WKFL-04**: Client can run workflow (streaming) via workflows.runStream(workflowId, options)
- [x] **WKFL-05**: Client can cancel workflow run via workflows.cancel(workflowId, runId)

### Sessions

- [x] **SESS-01**: Client can list sessions with filtering/pagination via sessions.list(options)
- [x] **SESS-02**: Client can get session details via sessions.get(sessionId, options)
- [x] **SESS-03**: Client can create session via sessions.create(options)
- [x] **SESS-04**: Client can rename session via sessions.rename(sessionId, name)
- [x] **SESS-05**: Client can delete session via sessions.delete(sessionId)
- [x] **SESS-06**: Client can get runs for session via sessions.getRuns(sessionId)

### Memories

- [x] **MEMO-01**: Client can list memories with filtering/pagination via memories.list(options)
- [x] **MEMO-02**: Client can get memory via memories.get(memoryId, options)
- [x] **MEMO-03**: Client can create memory via memories.create(options)
- [x] **MEMO-04**: Client can update memory via memories.update(memoryId, options)
- [x] **MEMO-05**: Client can delete memory via memories.delete(memoryId, options)

### Knowledge

- [x] **KNOW-01**: Client can get knowledge config via knowledge.getConfig()
- [x] **KNOW-02**: Client can list knowledge content via knowledge.list(options)
- [x] **KNOW-03**: Client can upload content (file, URL, or text) via knowledge.upload(options)
- [x] **KNOW-04**: Client can search knowledge base via knowledge.search(query, options)

### Traces

- [x] **TRAC-01**: Client can list traces with filtering via traces.list(options)
- [x] **TRAC-02**: Client can get trace details via traces.get(traceId)

### Metrics

- [x] **METR-01**: Client can get metrics via metrics.get(options)
- [x] **METR-02**: Client can refresh metrics via metrics.refresh()

### Files & Media

- [x] **FILE-01**: Run methods accept images parameter (matching Python's Image type)
- [x] **FILE-02**: Run methods accept audio parameter (matching Python's Audio type)
- [x] **FILE-03**: Run methods accept videos parameter (matching Python's Video type)
- [x] **FILE-04**: Run methods accept files parameter (matching Python's File type)
- [x] **FILE-05**: File inputs support Buffer, Stream, and file path strings

### Errors

- [x] **ERRR-01**: Client throws typed error when server unavailable (RemoteServerUnavailableError)
- [x] **ERRR-02**: Client throws typed errors for HTTP status codes (BadRequestError, NotFoundError, etc.)
- [x] **ERRR-03**: All errors include response details (status, message, requestId)

### Infrastructure

- [x] **INFR-01**: SDK works in Node.js 18+
- [ ] **INFR-02**: SDK works in modern browsers (fetch-based) *(deferred to v2)*
- [x] **INFR-03**: Package published as dual ESM/CommonJS
- [x] **INFR-04**: Comprehensive test suite with mocks

## v2 Requirements

Deferred to future release. Not in current roadmap.

### Enhanced DX

- **DX-01**: Event emitter interface for streaming (.on('content', ...))
- **DX-02**: Streaming helpers (.finalMessage(), accumulation)
- **DX-03**: Auto-pagination iterators for list methods
- **DX-04**: AbortSignal cancellation support for all requests

### Advanced Features

- **ADV-01**: Request/response interceptors
- **ADV-02**: Runtime Zod validation of responses
- **ADV-03**: Retry configuration (max retries, backoff strategy)
- **ADV-04**: Edge runtime support (Cloudflare Workers, Vercel Edge)

## Out of Scope

Explicitly excluded from this SDK.

| Feature | Reason |
|---------|--------|
| CLI tool | SDK only, no command-line interface |
| GraphQL client | API is REST-based |
| WebSocket support | API uses SSE for streaming, not WebSockets |
| Built-in caching | Users manage their own caching |
| OAuth flows | API uses Bearer tokens, not OAuth |
| Automatic rate limiting | Keep simple, users can add their own |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 2 | Complete |
| CORE-02 | Phase 2 | Complete |
| CORE-03 | Phase 2 | Complete |
| CORE-04 | Phase 2 | Complete |
| CORE-05 | Phase 2 | Complete |
| AGNT-01 | Phase 3 | Pending |
| AGNT-02 | Phase 3 | Pending |
| AGNT-03 | Phase 3 | Pending |
| AGNT-04 | Phase 4 | Complete |
| AGNT-05 | Phase 4 | Complete |
| AGNT-06 | Phase 4 | Complete |
| AGNT-07 | Phase 4 | Complete |
| TEAM-01 | Phase 5 | Pending |
| TEAM-02 | Phase 5 | Pending |
| TEAM-03 | Phase 5 | Pending |
| TEAM-04 | Phase 5 | Pending |
| TEAM-05 | Phase 5 | Pending |
| WKFL-01 | Phase 5 | Pending |
| WKFL-02 | Phase 5 | Pending |
| WKFL-03 | Phase 5 | Pending |
| WKFL-04 | Phase 5 | Pending |
| WKFL-05 | Phase 5 | Pending |
| SESS-01 | Phase 5 | Pending |
| SESS-02 | Phase 5 | Pending |
| SESS-03 | Phase 5 | Pending |
| SESS-04 | Phase 5 | Pending |
| SESS-05 | Phase 5 | Pending |
| SESS-06 | Phase 5 | Pending |
| MEMO-01 | Phase 5 | Pending |
| MEMO-02 | Phase 5 | Pending |
| MEMO-03 | Phase 5 | Pending |
| MEMO-04 | Phase 5 | Pending |
| MEMO-05 | Phase 5 | Pending |
| TRAC-01 | Phase 5 | Pending |
| TRAC-02 | Phase 5 | Pending |
| METR-01 | Phase 5 | Pending |
| METR-02 | Phase 5 | Pending |
| FILE-01 | Phase 6 | Complete |
| FILE-02 | Phase 6 | Complete |
| FILE-03 | Phase 6 | Complete |
| FILE-04 | Phase 6 | Complete |
| FILE-05 | Phase 6 | Complete |
| KNOW-01 | Phase 6 | Complete |
| KNOW-02 | Phase 6 | Complete |
| KNOW-03 | Phase 6 | Complete |
| KNOW-04 | Phase 6 | Complete |
| ERRR-01 | Phase 2 | Complete |
| ERRR-02 | Phase 2 | Complete |
| ERRR-03 | Phase 2 | Complete |
| INFR-01 | Phase 7 | Pending |
| INFR-02 | Phase 7 | Pending |
| INFR-03 | Phase 1 | Complete |
| INFR-04 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 47 total
- Mapped to phases: 47
- Unmapped: 0

---
*Requirements defined: 2026-01-31*
*Last updated: 2026-01-31 after roadmap creation*
