# Roadmap: AgentOS TypeScript SDK

## Overview

This roadmap delivers a production-ready TypeScript SDK for the AgentOS API in seven phases. Starting with correct dual-package configuration and TypeScript strict mode (Phase 1), we build the core HTTP client and error handling infrastructure (Phase 2), validate architecture with a complete agent resource including type generation (Phase 3), add SSE streaming support with dual interfaces (Phase 4), expand to all remaining API resources (Phase 5), implement file uploads and knowledge operations (Phase 6), and polish cross-runtime support with comprehensive testing (Phase 7). Each phase delivers verifiable capabilities that enable the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Project Setup & Foundation** - Dual ESM/CJS package with TypeScript strict mode
- [ ] **Phase 2: Core Infrastructure** - HTTP client with auth and typed errors
- [ ] **Phase 3: Type Generation & First Resource** - OpenAPI types with complete agents resource
- [ ] **Phase 4: Streaming Support** - SSE streaming with dual interfaces
- [ ] **Phase 5: Resource Expansion** - All remaining API resources
- [ ] **Phase 6: File Uploads & Knowledge** - Multipart uploads with platform-specific handling
- [ ] **Phase 7: Runtime Support & Polish** - Node.js and browser validation

## Phase Details

### Phase 1: Project Setup & Foundation
**Goal**: Package configured for dual ESM/CJS distribution with TypeScript strict mode enabled
**Depends on**: Nothing (first phase)
**Requirements**: INFR-03
**Success Criteria** (what must be TRUE):
  1. Package builds successfully to both ESM and CommonJS formats
  2. TypeScript strict mode enabled with zero compiler errors
  3. Development environment runs tests and linting without errors
  4. Package structure verified by publint.dev with no dual-package hazard warnings
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 2: Core Infrastructure
**Goal**: HTTP client layer provides authentication, error handling, and retry logic
**Depends on**: Phase 1
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, ERRR-01, ERRR-02, ERRR-03
**Success Criteria** (what must be TRUE):
  1. Client can make authenticated requests to AgentOS API with Bearer token
  2. Client throws typed error classes for different HTTP status codes (400/401/404/422/500)
  3. Client can retrieve OS configuration and health status
  4. Client implements retry logic with exponential backoff for transient failures
  5. All requests and responses have full TypeScript types
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 3: Type Generation & First Resource
**Goal**: OpenAPI type generation pipeline delivers typed SDK with complete agents resource
**Depends on**: Phase 2
**Requirements**: AGNT-01, AGNT-02, AGNT-03
**Success Criteria** (what must be TRUE):
  1. Types auto-generated from OpenAPI spec including success and error schemas
  2. User can list all agents with type-safe response
  3. User can get agent details by ID with type-safe response
  4. User can run agent (non-streaming) and receive typed result
  5. Client class exposes agents namespace with resource methods
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 4: Streaming Support
**Goal**: Streaming interface supports SSE with dual async iterator and event emitter patterns
**Depends on**: Phase 3
**Requirements**: AGNT-04, AGNT-05, AGNT-06, AGNT-07
**Success Criteria** (what must be TRUE):
  1. User can run agent with streaming enabled via agents.runStream()
  2. Stream emits typed events (RunStartedEvent, RunContentEvent, RunCompletedEvent)
  3. User can consume stream via async iterator (for await...of pattern)
  4. User can consume stream via event emitter (.on('content', ...) pattern)
  5. User can continue paused agent run with streaming support
  6. User can cancel running agent via agents.cancel()
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 5: Resource Expansion
**Goal**: All core API resources implemented with consistent patterns
**Depends on**: Phase 4
**Requirements**: TEAM-01, TEAM-02, TEAM-03, TEAM-04, TEAM-05, WKFL-01, WKFL-02, WKFL-03, WKFL-04, WKFL-05, SESS-01, SESS-02, SESS-03, SESS-04, SESS-05, SESS-06, MEMO-01, MEMO-02, MEMO-03, MEMO-04, MEMO-05, TRAC-01, TRAC-02, METR-01, METR-02
**Success Criteria** (what must be TRUE):
  1. User can perform CRUD operations on teams with streaming support
  2. User can perform CRUD operations on workflows with streaming support
  3. User can perform CRUD operations on sessions with filtering and pagination
  4. User can perform CRUD operations on memories with filtering
  5. User can retrieve traces with filtering
  6. User can get and refresh metrics
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 6: File Uploads & Knowledge
**Goal**: File upload infrastructure supports multiple input types across Node and browser
**Depends on**: Phase 5
**Requirements**: FILE-01, FILE-02, FILE-03, FILE-04, FILE-05, KNOW-01, KNOW-02, KNOW-03, KNOW-04
**Success Criteria** (what must be TRUE):
  1. Run methods accept images parameter (Buffer, Stream, file path)
  2. Run methods accept audio parameter (Buffer, Stream, file path)
  3. Run methods accept videos parameter (Buffer, Stream, file path)
  4. Run methods accept files parameter (Buffer, Stream, file path)
  5. User can upload content to knowledge base (file, URL, or text)
  6. User can search knowledge base and list knowledge content
  7. FormData constructed without manual Content-Type header (automatic boundary)
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 7: Runtime Support & Polish
**Goal**: SDK validated across Node.js and browser environments with comprehensive tests
**Depends on**: Phase 6
**Requirements**: INFR-01, INFR-02, INFR-04
**Success Criteria** (what must be TRUE):
  1. SDK works in Node.js 18+ with all features functional
  2. SDK works in modern browsers (Chrome, Safari, Firefox) with fetch-based implementation
  3. Comprehensive test suite covers core functionality with mocks
  4. Package published to npm with proper dual-format configuration verified
**Plans**: TBD

Plans:
- [ ] TBD during planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Setup & Foundation | 0/TBD | Not started | - |
| 2. Core Infrastructure | 0/TBD | Not started | - |
| 3. Type Generation & First Resource | 0/TBD | Not started | - |
| 4. Streaming Support | 0/TBD | Not started | - |
| 5. Resource Expansion | 0/TBD | Not started | - |
| 6. File Uploads & Knowledge | 0/TBD | Not started | - |
| 7. Runtime Support & Polish | 0/TBD | Not started | - |
