# Pitfalls Research

**Domain:** TypeScript SDK Development (API Client with SSE Streaming)
**Researched:** 2026-01-31
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Dual Package Hazard (ESM/CommonJS)

**What goes wrong:**
When publishing both ESM and CommonJS builds, singleton instances can be duplicated across module systems. A class instance created in ESM code fails `instanceof` checks in CommonJS code, causing runtime errors that bypass TypeScript's safety guarantees. State becomes desynchronized across the two module systems.

**Why it happens:**
Node.js loads ESM and CommonJS modules separately. When consumers import your SDK using both `import` (ESM) and `require()` (CommonJS) in the same application, they get two separate copies of your code. This is especially problematic for SDKs with internal state (auth tokens, configuration, event emitters).

**How to avoid:**
1. Use conditional exports in package.json with explicit `import` and `require` conditions
2. Build with modern bundlers (tsup, unbuild) that handle dual packaging correctly
3. Set `"sideEffects": false` in package.json to enable tree shaking
4. Verify with [publint.dev](https://publint.dev) and [Are The Types Wrong?](https://arethetypeswrong.github.io/)
5. Consider ESM-first with CommonJS as a "courtesy" wrapper

**Warning signs:**
- Consumer reports "instanceof checks failing" despite correct types
- Auth tokens or configuration "randomly" reset
- Event listeners fire inconsistently
- Tests pass but production breaks with "different instance" errors

**Phase to address:**
Phase 1 (Project Setup) - Configure build tooling and package.json exports correctly from the start. Recovery later requires major version bump.

---

### Pitfall 2: OpenAPI Type Generation - Incomplete Error Types

**What goes wrong:**
Auto-generated types from OpenAPI specs only cover 2xx success responses, ignoring 4xx/5xx error response schemas. Runtime receives structured error payloads (like ProblemJSON) but TypeScript thinks the response is `void` or `unknown`, causing production crashes when accessing error properties.

**Why it happens:**
Most OpenAPI generators (openapi-typescript, openapi-typescript-codegen) focus on the happy path. Developers assume "typed SDK" means "all responses are typed" and don't test error scenarios thoroughly until production.

**How to avoid:**
1. Manually audit generated types for all status codes (200, 201, 400, 401, 403, 404, 500, 503)
2. Define explicit error types for each operation:
   ```typescript
   type CreateRunResult =
     | { status: 200; data: Run }
     | { status: 400; error: ValidationError }
     | { status: 401; error: AuthError }
     | { status: 500; error: ServerError }
   ```
3. Use discriminated unions with status codes for type narrowing
4. Consider runtime validation with Zod/Ajv for critical error paths
5. Test error scenarios in integration tests, not just success paths

**Warning signs:**
- Error handling code uses `any` or type assertions
- No explicit error types in function signatures
- Consumer reports "Cannot read property X of undefined" in error handlers
- Integration tests only cover 200 responses

**Phase to address:**
Phase 2 (Core API Client) - Define comprehensive error types alongside successful response types. Add to API client contract.

---

### Pitfall 3: Token Refresh Race Condition

**What goes wrong:**
Multiple concurrent API requests detect an expired access token simultaneously and all trigger token refresh. This creates parallel refresh requests to the OAuth provider. Last-to-complete overwrites the valid new token with an already-used refresh token, causing "invalid_grant" or "revoked refresh token" errors. Users get randomly logged out under load.

**Why it happens:**
SDKs typically check token expiry in each request interceptor independently. Without coordination, 10 parallel requests = 10 parallel refresh attempts. OAuth2 providers often invalidate refresh tokens after first use (rotation), so only the first refresh succeeds.

**How to avoid:**
1. Implement mutex/lock for token refresh using `async-mutex` library:
   ```typescript
   import { Mutex } from 'async-mutex';
   const refreshMutex = new Mutex();

   async refreshToken() {
     return refreshMutex.runExclusive(async () => {
       // Only one refresh at a time
       if (this.tokenStillValid()) return; // Double-check
       await this.performRefresh();
     });
   }
   ```
2. Track in-flight refreshes in a Map, queue subsequent requests
3. For browser: use BroadcastChannel API to sync tokens across tabs
4. For multi-instance deployments: use Redis-based distributed locks

**Warning signs:**
- "Invalid refresh token" errors spike under load
- Token refresh works in dev but fails in production
- Errors disappear when request concurrency is limited
- Multiple refresh requests in network tab at same timestamp

**Phase to address:**
Phase 3 (Authentication) - Implement token refresh with mutex from the start. Retrofitting is complex due to need to refactor all request interceptors.

---

### Pitfall 4: SSE Connection Limit Exhaustion (HTTP/1.1)

**What goes wrong:**
Browser limits SSE connections to 6 per domain over HTTP/1.1. When SDK opens multiple streams (e.g., streaming runs for multiple agents), the 7th connection hangs indefinitely. Developers don't notice in testing (single tab, single stream) but users with multiple tabs or parallel operations hit the limit immediately.

**Why it happens:**
The EventSource API shares the browser's HTTP/1.1 connection pool. Each SSE stream consumes one persistent connection. The 6-connection limit is per origin, not per tab, so multiple tabs compound the problem. HTTP/2 allows 100+ streams but requires explicit server configuration.

**How to avoid:**
1. Document HTTP/2 requirement prominently in README
2. Implement connection pooling: reuse single SSE connection for multiple streams with multiplexing
3. Provide fallback: warn users when approaching connection limit, suggest tab consolidation
4. Use WebSocket as fallback for browsers without HTTP/2 (detect via feature detection)
5. In SDK design: prefer single connection with stream IDs over multiple EventSource instances

**Warning signs:**
- "Connection hanging" reports from users with multiple tabs
- EventSource `onerror` fires with no additional context
- Streams work individually but fail when opened in parallel
- Network tab shows 6 pending connections, 7th queued indefinitely

**Phase to address:**
Phase 4 (Streaming) - Design streaming architecture for connection reuse before implementing multiple streams. Cannot easily retrofit.

---

### Pitfall 5: Strict Mode Disabled or Partially Enabled

**What goes wrong:**
SDK ships with `strictNullChecks: false` or `strict: false`, allowing `undefined` and `null` to be assigned to any type. Consumer code receives runtime `undefined` when TypeScript promised a non-nullable type. Production crashes with "Cannot read property of undefined" despite "type safety."

**Why it happens:**
Developers disable strict mode to "ship faster" or "deal with compiler errors later." Legacy codebases migrate to TypeScript incrementally. Team doesn't understand that TypeScript without strict mode provides minimal safety beyond autocomplete.

**How to avoid:**
1. Enable strict mode in tsconfig.json from day one:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "strictNullChecks": true,
       "strictFunctionTypes": true,
       "noImplicitAny": true,
       "noImplicitThis": true
     }
   }
   ```
2. Treat strict mode as non-negotiable - TypeScript without strict mode is "linted JavaScript"
3. Fix compiler errors properly, don't use `any` or `@ts-ignore` to bypass
4. Document null-handling patterns for the team (optional chaining, nullish coalescing)

**Warning signs:**
- Compiler errors suppressed with `@ts-ignore` or `any`
- tsconfig.json has no `"strict": true` or has `"strict": false`
- Runtime null/undefined errors in code that "type-checked"
- Developers regularly ask "how to disable this TypeScript error"

**Phase to address:**
Phase 1 (Project Setup) - Enable strict mode immediately. Enabling later on a large codebase creates hundreds of compiler errors requiring weeks to fix.

---

### Pitfall 6: File Upload - Manual Content-Type Header

**What goes wrong:**
Developer manually sets `Content-Type: multipart/form-data` header when using FormData. Browser or Node.js fetch doesn't add the required `boundary` parameter. Server rejects upload with "Missing boundary in multipart/form-data" or silently fails to parse parts.

**Why it happens:**
Developers assume they must manually set Content-Type for all requests. Documentation examples show `Content-Type: application/json` for JSON, so they extrapolate to multipart. The browser/fetch automatically generates the boundary and sets the header correctly, but only if you DON'T set it manually.

**How to avoid:**
1. Do NOT set Content-Type header for FormData requests:
   ```typescript
   // WRONG
   const formData = new FormData();
   formData.append('file', file);
   await fetch(url, {
     method: 'POST',
     headers: { 'Content-Type': 'multipart/form-data' }, // DO NOT DO THIS
     body: formData
   });

   // CORRECT
   const formData = new FormData();
   formData.append('file', file);
   await fetch(url, {
     method: 'POST',
     body: formData // Let fetch set Content-Type automatically
   });
   ```
2. Document this explicitly in SDK examples - it's counterintuitive
3. Add runtime check: if user passed FormData body AND set Content-Type header, warn/error

**Warning signs:**
- Upload requests return 400 Bad Request with "boundary" in error message
- Server logs show "multipart/form-data" without boundary parameter
- File upload works in Postman but fails in SDK
- Developers ask "why is the server not receiving the file"

**Phase to address:**
Phase 5 (File Uploads) - Document and test thoroughly. Consider exposing `uploadFile()` helper that hides raw fetch details.

---

### Pitfall 7: TypeScript Version Assumptions in Consumer Projects

**What goes wrong:**
SDK uses TypeScript 5.8+ features (e.g., `const` type parameters, `satisfies` operator) but consumer's project runs TypeScript 4.9. Consumer gets cryptic compiler errors in node_modules or types simply don't work. Issue is silent in development if consumer doesn't type-check dependencies.

**Why it happens:**
SDK developers use latest TypeScript features without checking consumer compatibility. Package.json doesn't specify TypeScript peer dependency. Consumers pin older TypeScript versions for stability or legacy reasons.

**How to avoid:**
1. Specify TypeScript peer dependency in package.json:
   ```json
   {
     "peerDependencies": {
       "typescript": ">=5.0.0"
     },
     "peerDependenciesMeta": {
       "typescript": {
         "optional": true
       }
     }
   }
   ```
2. Use conservative TypeScript features for public API types (target TS 4.9+ for broad compatibility)
3. Test SDK compilation against multiple TypeScript versions in CI (4.9, 5.0, latest)
4. Document minimum TypeScript version in README
5. Consider `@ts-reset` to fix TypeScript's default type quirks

**Warning signs:**
- Consumer reports "Unexpected token" or "Cannot find name" in .d.ts files
- Type errors in node_modules/@your-sdk/
- Types work for some users but not others (different TS versions)
- GitHub issues: "Types don't work" without reproduction (version mismatch)

**Phase to address:**
Phase 2 (Core API Client) - Set TypeScript version policy and test matrix before publishing. Changing later requires major version bump if reducing compatibility.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `any` for complex API responses | Bypasses compiler errors, ships faster | Removes type safety, runtime errors, no autocomplete | Never - use `unknown` and type guards instead |
| Disabling strict mode | Fewer compiler errors, easier migration | Null/undefined runtime errors, defeats TypeScript purpose | Never - strict mode is non-negotiable |
| Manual type definitions instead of OpenAPI generation | More control, simpler setup | Types drift from API, maintenance burden, breaking changes missed | Only if API has no OpenAPI spec |
| Single-file SDK bundle | Simpler build configuration | Large bundle size, no tree-shaking, imports entire SDK for one function | Acceptable for tiny SDKs (<10KB) |
| Inline error handling vs dedicated error classes | Less code, faster initial development | Inconsistent error handling, no error hierarchy, poor DX | Never - proper error classes are table stakes |
| Synchronous API methods (blocking) | Simpler mental model, no async/await | Blocks event loop, terrible UX, unusable in browser | Never - all I/O must be async |
| No retry logic | Simpler implementation, fewer edge cases | Production failures on transient network issues, poor reliability | Only in MVP, add before v1.0 |
| In-memory token storage only | Works for server-side, simple implementation | Tokens lost on page refresh, poor browser UX | Only for Node.js-only SDKs |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OpenAPI Codegen | Assuming all responses are typed | Manually add error response types for 4xx/5xx, use discriminated unions |
| EventSource (SSE) | Creating new EventSource per stream | Multiplex streams over single connection, pool connections, document HTTP/2 requirement |
| FormData uploads | Setting Content-Type header manually | Let fetch/browser set Content-Type with boundary automatically |
| OAuth token refresh | Each request independently refreshes expired tokens | Use mutex to ensure single refresh, queue parallel requests |
| Multipart uploads to S3 | Uploading entire file in one request | Use multipart upload for files >5MB, handle chunk retries separately |
| Error handling | Catching all errors with single catch block | Type-guard errors, handle network vs server vs validation errors separately |
| Streaming responses | Buffering entire response in memory | Use streams/iterators, process chunks as they arrive |
| Browser vs Node APIs | Using Node.js-only APIs (Buffer, stream) | Feature detect, provide polyfills, or dual builds with conditional exports |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No request deduplication | Identical concurrent requests to API | Implement request cache with TTL, deduplicate in-flight requests | >100 requests/sec |
| Synchronous JSON parsing of large responses | UI freezes during parse | Stream parse with async iteration or web workers | Response >1MB |
| Creating new HTTP client per request | Connection pool exhaustion, slow requests | Reuse single client instance, connection pooling | >50 concurrent requests |
| No exponential backoff on retry | Thundering herd, rate limit errors compound | Exponential backoff with jitter (2^n * 100ms + random) | Any retry at scale |
| Loading entire SDK bundle | Slow initial page load, large bundle size | Code splitting, tree-shaking, lazy loading for streaming/upload modules | Bundle >50KB |
| No request cancellation | Memory leaks, wasted bandwidth on unmount/navigation | AbortController for all requests, cancel on component unmount | Single-page apps |
| Polling instead of SSE/WebSocket | Excessive API calls, high latency | Use SSE for server-to-client streaming | >1 request/sec per client |
| No response streaming | High memory usage, slow TTFB perception | Stream responses with AsyncIterator, yield chunks | Response >100KB |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Logging API keys or tokens | Credentials leaked in logs, support tickets, error tracking | Sanitize logs, use `[REDACTED]` for sensitive fields, never log full tokens |
| Storing tokens in localStorage (browser) | XSS can steal tokens, no expiration | Use httpOnly cookies or memory-only storage with refresh tokens |
| No token expiration handling | Infinite token lifetime, no rotation | Implement automatic refresh before expiry, handle 401 gracefully |
| Exposing API keys in client-side code | Keys leaked in source maps, browser DevTools | Never bundle secrets, use environment variables, server-side proxy pattern |
| No rate limiting in SDK | SDK used to DDoS API, abuse vectors | Implement client-side rate limiting, queue requests, exponential backoff |
| Trusting user input in URLs | URL injection, SSRF attacks | Validate and sanitize URLs, use allowlist for domains if possible |
| No HTTPS enforcement | Man-in-the-middle attacks, token interception | Reject HTTP requests, enforce HTTPS-only, warn on insecure connections |
| Storing sensitive data in query parameters | URLs logged in proxies, browser history | Use request body for sensitive data, POST instead of GET for mutations |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No upload progress for large files | User doesn't know if upload is working or stalled | Expose progress events, show percentage/bytes uploaded |
| Cryptic error messages ("Request failed") | Users can't self-serve, support burden | Provide actionable errors: "API key invalid. Check your config." |
| No retry indication | Users don't know SDK is retrying, click "submit" again | Emit retry events, show "Retrying (2/3)..." in UI |
| Silent failures on network errors | Request fails, no indication to user | Always surface errors to consumer, provide error callbacks/events |
| No TypeScript autocomplete for options | Poor DX, users don't discover features | Export well-typed interfaces, use JSDoc for option documentation |
| Stream events with no error handling | Users miss error events, stream silently stops | Document error event handlers, provide examples, emit warnings for unhandled errors |
| No timeout configuration | Requests hang indefinitely on slow networks | Provide configurable timeout (default: 30s), auto-abort long requests |
| Breaking changes without semver major bump | Consumers' code breaks on minor updates | Follow semver strictly, document breaking changes in CHANGELOG, deprecate before removing |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **File upload:** Often missing progress events, chunk retry logic, multipart for large files — verify upload >100MB works with progress callback
- [ ] **Error handling:** Often missing network error types, only handles API errors — verify offline mode, DNS failure, timeout scenarios
- [ ] **Authentication:** Often missing token refresh, only handles initial auth — verify token refresh on concurrent requests, refresh token rotation
- [ ] **Streaming (SSE):** Often missing reconnection logic, only handles happy path — verify automatic reconnect after disconnect, event replay with Last-Event-ID
- [ ] **Type generation:** Often missing error response types, only has 2xx success types — verify 400, 401, 500 responses have proper types
- [ ] **Browser support:** Often works in Chrome, broken in Safari/Firefox — verify fetch polyfill, EventSource polyfill, cross-browser testing
- [ ] **Tree-shaking:** Often bundle includes entire SDK even when importing one function — verify `sideEffects: false`, test bundle with webpack-bundle-analyzer
- [ ] **TypeScript types:** Often has types that don't match runtime behavior — verify published .d.ts matches compiled JavaScript, test with `@arethetypeswrong/cli`
- [ ] **Retry logic:** Often retries 4xx client errors, wastes requests — verify only retries 5xx, network errors, 429 rate limits with exponential backoff
- [ ] **Request cancellation:** Often requests continue after component unmount — verify AbortController integration, cancel on navigate/unmount

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Dual package hazard (ESM/CJS) | HIGH | Requires major version bump. Refactor to conditional exports, update build config, publish v2.0.0 with migration guide. |
| Missing error types | MEDIUM | Add error types in minor version (additive), publish type-only update, document error handling patterns. |
| Token refresh race condition | MEDIUM | Add mutex in minor version (internal change), test with high concurrency, document in changelog. |
| SSE connection limit | HIGH | Requires architecture change. Implement connection pooling, may need major version if API changes. |
| Strict mode disabled | VERY HIGH | Enabling strict mode on existing code creates hundreds of errors. Incremental migration with `// @ts-expect-error` and roadmap to fix. |
| Manual Content-Type for FormData | LOW | Update documentation immediately, add runtime warning in minor version, error in next major version. |
| TypeScript version incompatibility | MEDIUM | If new version breaks old consumers: publish patch with older TS target or document minimum version in breaking change. |
| No tree-shaking | MEDIUM | Add `sideEffects: false` in patch version (safe change), refactor imports to ESM in minor version. |
| Poor error messages | LOW | Improve error messages in minor version (non-breaking), document error codes. |
| No retry logic | MEDIUM | Add retry as opt-in in minor version, make default in next major version with migration guide. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Dual package hazard | Phase 1: Project Setup | Test import in both ESM and CJS project, verify with publint.dev |
| Strict mode disabled | Phase 1: Project Setup | Check tsconfig.json has `"strict": true`, code compiles with no `any` |
| TypeScript version compatibility | Phase 2: Core API Client | Test compilation with TS 4.9, 5.0, latest in CI matrix |
| Missing error types (OpenAPI) | Phase 2: Core API Client | Verify generated types include 4xx/5xx, test error response parsing |
| Token refresh race condition | Phase 3: Authentication | Load test with 100 concurrent requests on expired token, verify single refresh |
| SSE connection limit | Phase 4: Streaming | Open 10 streams in single browser tab, verify connection pooling works |
| Manual Content-Type header | Phase 5: File Uploads | Test upload with FormData, verify boundary in request headers |
| No tree-shaking | Phase 6: Publishing | Run webpack-bundle-analyzer on consumer project importing single function |
| Poor error messages | All phases | Consumer code review, SDK throws errors with actionable messages |
| No retry logic | Phase 2: Core API Client | Disconnect network during request, verify exponential backoff retry |

## Sources

**Dual Package Hazard:**
- [Publishing dual ESM+CJS packages](https://mayank.co/blog/dual-packages/)
- [GitHub - dual-package-hazard](https://github.com/GeoffreyBooth/dual-package-hazard)
- [Building and Publishing a Dual-Package NPM Module](https://leapcell.io/blog/building-and-publishing-a-dual-package-npm-module)
- [Ship ESM & CJS in one Package](https://antfu.me/posts/publish-esm-and-cjs)

**OpenAPI Type Generation:**
- [OpenAPI to TypeScript: a More Reliable and Type-Safe Approach](https://dev.to/gunzip_/typescript-devs-dont-let-your-openapi-client-generator-lie-to-you-47d6)
- [GitHub - openapi-typescript](https://github.com/openapi-ts/openapi-typescript)
- [TypeScript OpenAPI Blog](https://blog.simonireilly.com/posts/typescript-openapi/)

**Token Refresh Race Conditions:**
- [How to handle concurrency with OAuth token refreshes](https://nango.dev/blog/concurrency-with-oauth-token-refreshes)
- [Common Pitfalls in Authentication Token Renewal](https://brainsandbeards.com/blog/2024-token-renewal-mutex/)
- [Stop Writing Token Refresh Logic: Let ts-retoken Handle It](https://dev.to/vanthao03596/stop-writing-token-refresh-logic-let-ts-retoken-handle-it-47cd)

**SSE (Server-Sent Events):**
- [Using server-sent events - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
- [Real-Time Data Streaming with SSE](https://dev.to/serifcolakel/real-time-data-streaming-with-server-sent-events-sse-1gb2)

**Testing Best Practices:**
- [10 Tips for Success with Typescript Unit Testing](https://www.startearly.ai/post/typescript-unit-testing-tips)
- [TypeScript Best Practices - AWS](https://docs.aws.amazon.com/prescriptive-guidance/latest/best-practices-cdk-typescript-iac/typescript-best-practices.html)

**File Upload:**
- [Uploading Multipart Files with TypeScript](https://www.webdevtutor.net/blog/typescript-upload-multipart-file)
- [TypeScript Multipart File Upload Guide](https://www.webdevtutor.net/blog/typescript-multipart-file-upload)

**Error Handling and Retry:**
- [Resilient API Calls with ts-retry-promise](https://typescript.tv/best-practices/resilient-api-calls-with-ts-retry-promise/)
- [Mastering Async Retry in TypeScript](https://www.xjavascript.com/blog/asyncretry-typescript/)

**Tree Shaking and Bundle Size:**
- [How to bundle a tree-shakable typescript library with tsup](https://dev.to/orabazu/how-to-bundle-a-tree-shakable-typescript-library-with-tsup-and-publish-with-npm-3c46)
- [Everything you can do to reduce bundle size](https://madelinemiller.dev/blog/reduce-webapp-bundle-size/)

**TypeScript Versioning:**
- [Semantic Versioning for TypeScript Types](https://www.semver-ts.org/)
- [Why TypeScript Doesn't Follow Strict Semantic Versioning](https://www.learningtypescript.com/articles/why-typescript-doesnt-follow-strict-semantic-versioning)

**General TypeScript Mistakes:**
- [Top 16 TypeScript Mistakes Developers Make](https://dev.to/leapcell/top-16-typescript-mistakes-developers-make-and-how-to-fix-them-4p9a)
- [The right way to build a TypeScript SDK](https://hsnice16.medium.com/the-right-way-to-build-a-typescript-sdk-75657476bc95)
- [Quick Tips to Make Your SDK More Maintainable in TypeScript](https://thenewstack.io/quick-tips-to-make-your-sdk-more-maintainable-in-typescript/)

---
*Pitfalls research for: TypeScript SDK for AgentOS API*
*Researched: 2026-01-31*
