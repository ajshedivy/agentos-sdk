# Changelog

All notable changes to `@worksofadam/agentos-sdk` will be documented in this file.

This project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

- `workflows.continue()` sends human-in-the-loop resolutions as the
  `step_requirements` form field that
  `POST /workflows/{id}/runs/{run_id}/continue` reads. It used to post `tools`,
  which only the agent route reads; the workflow route swept it into unread
  kwargs, so a paused workflow run continued through the SDK was never
  resolved. `WorkflowContinueOptions` gains `stepRequirements` (JSON array: the
  paused run's `step_requirements[]` with the active — last — entry resolved,
  e.g. `confirmed`, `user_input`, `selected_choices`, or `confirmed` on each
  `executor_requirements[].tool_execution`; every entry keeps its `step_id`).
  `tools` is deprecated and now throws a `TypeError` instead of being posted:
  the workflow route has no `tool_execution` wrapper, and a bare tool list
  cannot be mapped onto a `StepRequirement` without the paused step's
  `step_id`, so there is no wrap that would not 400 server-side.
- `RunErrorEvent` and `TeamRunErrorEvent` type the failure identity agno >= 3.0
  stamps on run-error stream events: `error_type` (e.g.
  `"model_provider_error"`), `error_id` and `additional_data`, all optional.
  The workflow-level `WorkflowError` event (`error`, `error_type`, `error_id`,
  `additional_data`) was missing from the SDK entirely: `WorkflowErrorEvent`
  is now part of `WorkflowRunEvent` / `EventMap`, and
  `WorkflowEventType.WorkflowError` / `RunEventType.WorkflowError` exist.
- The stream event typings cover every event agno 3.0.0 emits. 34 event types
  the server sends were missing from `AgentEventType` / `TeamEventType` /
  `WorkflowEventType` and from the `AgentRunEvent` / `TeamRunEvent` /
  `WorkflowRunEvent` unions (so from `EventMap`), which meant
  `stream.on(<name>)` did not typecheck for them and `for await` consumers
  could not narrow on them even though `AgentStream` delivered them at
  runtime. Added, with interfaces derived from the agno 3.0.0 dataclasses:
  - agent (8): `ToolCallError`, `ReasoningContentDelta`, `ModelRequestStarted`,
    `ModelRequestCompleted`, `CompressionStarted`, `CompressionCompleted`,
    `FollowupsStarted`, `FollowupsCompleted`.
  - team (15): `TeamRunPaused`, `TeamRunContinued`, `TeamToolCallError`,
    `TeamReasoningContentDelta`, `TeamModelRequestStarted`,
    `TeamModelRequestCompleted`, `TeamCompressionStarted`,
    `TeamCompressionCompleted`, `TeamFollowupsStarted`, `TeamFollowupsCompleted`,
    `TeamTaskIterationStarted`, `TeamTaskIterationCompleted`,
    `TeamTaskStateUpdated`, `TeamTaskCreated`, `TeamTaskUpdated`.
  - workflow (11): `WorkflowPaused`, `WorkflowAgentStarted`,
    `WorkflowAgentCompleted`, `StepPaused`, `StepContinued`,
    `StepExecutorPaused`, `StepExecutorContinued`, `StepOutputReview`,
    `StepError`, `ConditionPaused`, `RouterPaused`.
  `TeamRunPausedEvent.requirements` is typed as `RunRequirement[]` and
  `WorkflowPausedEvent.step_requirements` as `StepRequirement[]` — the exact
  objects the team and workflow continue routes read back — and
  `RunPausedEvent` gains the same `requirements` field. The HITL types
  (`RunRequirement`, `StepRequirement`, `StepInput`, `UserInputField`,
  `UserFeedbackQuestion`, `UserFeedbackOption`, `TeamTaskData`) are exported,
  and `ToolCallData` gains the `ToolExecution` HITL fields
  (`requires_confirmation`, `confirmed`, `user_input_schema`, ...). Existing
  names and shapes are unchanged.
- `evals.delete()` sends the body `DELETE /eval-runs` reads. It posted
  `{ ids: [...] }`, but the route validates `DeleteEvalRunsRequest`
  (`{ eval_run_ids: string[] }`), so every call failed with
  `422 eval_run_ids: Field required`. `DeleteEvalsOptions.ids` is unchanged and
  is now sent as `eval_run_ids`.
- `VERSION` (and therefore `client.version` and the `User-Agent` header) is
  read from `package.json` at build time instead of a hand-maintained literal
  in `src/index.ts`, which had stayed at `0.4.0` through 0.5.0 - 0.6.2. The
  test that pinned the literal now compares against `package.json`, and
  `RELEASING.md` no longer asks for a second manual bump.
- README API reference matches the client: `baseUrl` is required (the SDK
  reads no `AGENTOS_API_KEY` env var), `timeout` defaults to 30000 and
  `maxRetries` to 2, `headers` is documented, and the `metrics.get()` /
  `traces.list()` snippets use the camelCase option keys the resources take.
- `TeamEventType.TeamCustomEvent` matches the custom events a team stream
  carries. Its value was `"TeamCustomEvent"`, a string agno never sends:
  `TeamRunEvent.custom_event` is `"CustomEvent"`, the same value `RunEvent`
  and `WorkflowRunEvent` use (`agno/run/team.py`, unchanged since 2.0), so
  `stream.on(TeamEventType.TeamCustomEvent, ...)` never fired on a team run.
  The constant now carries `"CustomEvent"` and is deprecated in favour of
  `RunEventType.CustomEvent`, which covers all three emitters. `CustomEvent`
  is one domain-neutral shape (`event: "CustomEvent"` plus the optional
  agent, team and workflow base fields; the user-defined payload comes
  through as extra keys) that is a member of `AgentRunEvent`, `TeamRunEvent`
  and `WorkflowRunEvent` — the workflow union had no custom-event member —
  and `TeamCustomEvent` is a deprecated alias of it. `EventMap["CustomEvent"]`
  resolves to that shape; the `"TeamCustomEvent"` key `EventMap` used to
  carry is gone, since no event with that name exists.

### Changed

- Regenerated `openapi.json` and `src/generated/types.ts` from an AgentOS running
  agno 3.0.0. The committed spec predated 2.8.5 (76 paths); the new capture has
  117 paths and 187 schemas. No route was removed and no schema key used by
  `src/resources/*` disappeared, so every hand-written resource method keeps
  working unchanged. It is **not** additive for consumers, though: `src/index.ts`
  re-exports `components` and `paths`, so the schema changes below are part of
  this package's public type surface. See **Breaking** for the source-breaking
  subset.
  - New routes: `/info`, `/toolsets`, `/toolsets/{name}`, `/learnings*`,
    `/service-accounts*`, agent/team/workflow `runs/{run_id}/resume` and
    `runs/{run_id}/checkpoints`, `sessions/{session_id}/fork`,
    `teams|workflows/{id}/runs/{run_id}/continue`, `PATCH /agents/{agent_id}/model`,
    `PATCH /teams/{team_id}/model`, `POST /agents:apply`, `DELETE /agents/{component_id}`,
    `POST /components/{component_id}/restore`, `GET /metrics/refresh/status`,
    `GET /sessions/{session_id}/media/{storage_key}`, `GET /workflows/{workflow_id}/runs`,
    the `/a2a/*` interface routes, and the `/queue` stub routes.
  - Error payloads: `error_code` is gone from `BadRequestResponse`,
    `NotFoundResponse`, `UnauthenticatedResponse`, `InternalServerErrorResponse`
    and `ValidationErrorResponse`; the first four now carry `error_id` and
    `error_type`. `ValidationErrorResponse.detail` widened to
    `string | ValidationErrorDetail[]`.
  - `ConfigResponse.available_models` changed from `string[] | null` to `Model[]`
    (`{ id, provider }`).
  - `user_id` added to `EvalSchema`, `ScheduleResponse`, `ScheduleRunResponse` and
    `ComponentResponse`; `ScheduleResponse` also gained `managed_by`, `target_type`,
    `target_id` and `disabled_reason`.
  - `Body_create_agent_run.version` changed from `string` to `integer`.

- `client.models.list()` now falls back to `GET /config` -> `available_models`
  when `GET /models` answers 404. agno 3.0 removed the `/models` route, so
  `models.list()` threw `NotFoundError` against a vanilla agno >= 3.0 server;
  `/models` is still the first attempt, and ixora stacks (which keep their own
  `/models` serving a superset catalog) are unaffected.
- `AgentOSClient.getConfig()` returns `components["schemas"]["ConfigResponse"]`
  instead of the hand-written `OSConfig`, so `available_models` typechecks as
  `Model[]`.

### Breaking

Consumers that type-reference the re-exported `components`/`paths` are affected
by the regeneration. Under `strict` TypeScript these are compile errors, not
warnings:

- `error_code` is gone from every error schema; read `error_id` / `error_type`
  instead (`ValidationErrorResponse` carries neither).
- `ConfigResponse.available_models` is `Model[]` (`{ id, provider }`), not
  `string[] | null` — element member access changes.
- `VectorSearchResult.id` is now optional and nullable (`string | null`) rather
  than a required `string`. This is the element type of `knowledge.search()`
  results, so `r.id` needs a null guard.
- `EvalsConfig` and `EvalsDomainConfig` no longer carry `available_models`.
- `Body_create_agent_run.version` is `integer`, not `string`.
- `ValidationErrorResponse.detail` widened to `string | ValidationErrorDetail[]`.
- Enums grew, which breaks exhaustive `switch`/never-checks: `RunStatus` gained
  `REGENERATED`; `RegistryResourceType` gained `workflow`, `knowledge`,
  `memory_manager`, `session_summary_manager` and `learning`.
- The hand-written `OSConfig` type is no longer exported. It never matched the
  server's `/config` payload; use `components["schemas"]["ConfigResponse"]`
  instead. `AgentOSClient.getConfig()` returns that type now.

Release note: this warrants a minor bump (0.7.0), not a patch.

### Added

- `GetMetricsOptions.userId`, sent as the `user_id` query param on `GET /metrics`.


## [0.6.1] - 2026-06-05

### Fixed

- File uploads from a string path or `ReadStream` now serialize correctly.
  `normalizeFileInput` returned a Node `ReadStream` for string paths (and passed
  raw `ReadStream` inputs through unchanged), but uploads are transported via the
  global (web) `FormData` + `fetch`, which coerce a `ReadStream` to the string
  `"[object Object]"`. The server therefore received a string instead of a file
  (FastAPI: `Expected UploadFile, received: <class 'str'>`). String paths and
  file-backed `ReadStream`s are now read into a `File` (preserving the basename as
  the multipart filename), fixing uploads across `knowledge.upload` and
  `agents`/`teams`/`workflows` file inputs. A `ReadStream` with no backing file
  path now throws an actionable error instead of silently uploading a corrupt part.

## [0.3.0] - 2026-02-07

### Added

- Comprehensive event interfaces for agent, team, and workflow streaming
  - `AgentRunCreatedEvent`, `AgentRunResponseEvent`, `AgentRunToolCallEvent`, and 26 more agent event types
  - `TeamRunCreatedEvent`, `TeamRunResponseEvent`, and 22 more team event types
  - `WorkflowRunCreatedEvent`, `WorkflowRunResponseEvent`, and 15 more workflow event types
  - `AllRunEvents` union type and `EventMap` for type-safe `.on()` handlers
  - Base event types: `BaseAgentRunEvent`, `BaseTeamRunEvent`, `BaseWorkflowRunEvent`
  - Supporting types: `Metrics`, `ToolCallData`, `ModelInfo`, `ReasoningStep`

### Changed

- Refactored streaming events from single file to modular `src/streaming/events/` directory
- Updated streaming infrastructure to use new `StreamEvent` type system
- Updated agent test scripts to use `RunEventType` constants instead of raw strings
- Deprecated `RunMetrics` in favor of expanded `Metrics` type (includes audio/cache/reasoning tokens)

## [0.2.0] - 2026-02-05

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

[Unreleased]: https://github.com/ajshedivy/agentos-sdk/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/ajshedivy/agentos-sdk/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/ajshedivy/agentos-sdk/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/ajshedivy/agentos-sdk/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/ajshedivy/agentos-sdk/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/ajshedivy/agentos-sdk/releases/tag/v0.1.0
