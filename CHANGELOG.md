# Changelog

All notable changes to `@worksofadam/agentos-sdk` will be documented in this file.

This project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Complete 28-event type system with `StreamEvent` base class for all streaming events
- `RunEventType` constants for type-safe event handling

### Changed

- Updated streaming infrastructure to use new `StreamEvent` type system
- Updated agent test scripts to use `RunEventType` constants instead of raw strings

## [0.1.2] - 2026-02-01

### Added

- Teams live test script for integration testing

### Changed

- Enhanced `run()` methods to return specific result types (`AgentRunResponse`, `TeamRunResponse`, `WorkflowRunResponse`) instead of generic responses

### Fixed

- Live test script non-streaming response handling

## [0.1.1] - 2026-02-01

### Changed

- Scoped linting to `src/` only for faster lint passes

### Fixed

- Version tests now use `VERSION` constant dynamically instead of hardcoded values

## [0.1.0] - 2026-02-01

Initial release of the AgentOS TypeScript SDK.

### Added

#### Core Infrastructure
- `AgentOSClient` class with API key authentication and configurable base URL
- HTTP wrapper with automatic retry logic using exponential backoff
- Typed error hierarchy: `AgentOSError`, `AuthenticationError`, `NotFoundError`, `RateLimitError`, `ValidationError`
- TypeScript type definitions for all API entities

#### Type Generation
- OpenAPI spec bundled in repo
- Auto-generated TypeScript types from OpenAPI schema via `openapi-typescript`
- Protected `request()` method with `FormData` handling

#### Agents Resource
- `agents.list()` - list all agents
- `agents.get(id)` - retrieve a single agent
- `agents.run(id, params)` - run an agent with parameters

#### Streaming Support
- SSE parser utility using `eventsource-parser`
- `AgentStream` class with dual interfaces (async iterator and event callbacks)
- `agents.runStream(id, params)` - streaming agent runs
- `requestStream()` method on client

#### Resource Expansion
- `TeamsResource` - manage agent teams
- `WorkflowsResource` - manage agent workflows
- `SessionsResource` - manage conversation sessions
- `MemoriesResource` - manage agent memories
- `TracesResource` - query execution traces
- `MetricsResource` - query performance metrics

#### File Uploads & Knowledge
- File input type definitions and normalization utility
- Media file support on `AgentsResource`, `TeamsResource`, and `WorkflowsResource`
- `KnowledgeResource` for managing knowledge bases

#### Tooling & CI
- Dual ESM/CJS build with `tsup`
- Vitest test runner with V8 coverage
- Biome linter and formatter
- CI workflow for tests and coverage
- npm publish workflow via GitHub Actions
- `prepublishOnly` validation hook
- Node.js 18+ runtime compatibility

[Unreleased]: https://github.com/ajshedivy/agentos-sdk/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/ajshedivy/agentos-sdk/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/ajshedivy/agentos-sdk/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/ajshedivy/agentos-sdk/releases/tag/v0.1.0
