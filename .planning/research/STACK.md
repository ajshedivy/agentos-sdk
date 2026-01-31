# Stack Research

**Domain:** TypeScript SDK Development (Node.js + Browser)
**Researched:** 2026-01-31
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TypeScript | 5.7+ | Type-safe SDK with excellent DX | Industry standard for SDKs in 2026. TS 7.0 (mid-2026) will use Go-based compiler with strict-by-default. Current versions provide template literal types for API validation. |
| Node.js | 20+ | Runtime environment | Node.js 20+ LTS provides native fetch, FormData, and SSE support. Required by @hey-api/openapi-ts. Node.js 22.18.0+ supports native TypeScript execution. |
| @hey-api/openapi-ts | 0.67+ (pin exact) | OpenAPI → TypeScript codegen | Used by Vercel, OpenCode, PayPal. Generates production-ready SDKs with 20+ plugins. Better DX than openapi-generator. TypeScript-focused with excellent type generation. Pin exact version as still in active development. |
| Fetch API | Native | HTTP client | Built into Node.js 18+, all modern browsers, Deno, Bun, Cloudflare Workers. Zero dependencies. Handles Bearer auth, SSE, multipart perfectly. No need for axios in 2026. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | 3.24+ | Runtime schema validation | Use with @hey-api/openapi-ts Zod plugin for runtime type safety. Validates API responses match TypeScript types. |
| eventsource-parser | 2.0+ | SSE parsing (browser fallback) | Only if targeting older browsers without native EventSource. Not needed for Node.js 20+. |
| form-data | 4.0+ (Node.js only) | Multipart uploads (Node.js) | Only for Node.js < 20. Node.js 20+ has native FormData. Browser has native FormData. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| tsup | 8.5+ (or tsdown) | Bundle ESM + CJS dual formats | Powered by esbuild. Zero config for dual format. **NOTE:** tsup maintenance ending, consider tsdown (Rolldown/Rust-based) for new projects. |
| vitest | 4.0+ | Testing framework | 17M weekly downloads. Browser Mode stable in v4. Visual regression testing. Faster than Jest. Better TypeScript support than Bun test for SDKs. |
| prettier | 3.4+ | Code formatting | Standard formatter. Configure for generated code. |
| eslint | 9.0+ | Linting | Use flat config format (eslint.config.js). TypeScript-aware rules. |
| tsx | 4.0+ | TypeScript execution | Fast TypeScript runner for dev scripts. Alternative to ts-node. |

## Installation

```bash
# Core dependencies (runtime)
npm install zod

# Development dependencies
npm install -D @hey-api/openapi-ts -E
npm install -D typescript@latest
npm install -D tsup
npm install -D vitest
npm install -D prettier eslint
npm install -D tsx

# Optional: SSE parser for older browsers
npm install eventsource-parser

# DO NOT INSTALL (native in Node.js 20+):
# - node-fetch (use native fetch)
# - form-data (use native FormData)
# - axios (use native fetch)
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| @hey-api/openapi-ts | openapi-typescript (openapi-ts/openapi-typescript) | If you only need type generation without SDK generation. More conservative choice with longer track record. |
| @hey-api/openapi-ts | OpenAPI Generator | If you need multi-language SDKs from same spec. More mature but less TypeScript-focused. |
| Fetch API | axios | Never for new SDKs in 2026. Axios adds 50KB+ bundle size for features now native (automatic JSON, interceptors can be replicated). Axios now wraps fetch internally anyway (v1.7+). |
| tsup | tsdown | tsdown is newer (2025), uses Rolldown (Rust). Faster but less proven. Consider for greenfield in 2026. |
| tsup | unbuild | If building for Nuxt ecosystem or need advanced rollup features. |
| vitest | Bun test | If using Bun as runtime and package manager. Bun test is faster but less ecosystem integration. Use `bun run test` to use vitest with Bun package manager. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| openapi-typescript-codegen | Unmaintained since 2023. @hey-api/openapi-ts forked from this project to continue maintenance. | @hey-api/openapi-ts |
| axios | 50KB+ bundle size for features now native. Wraps fetch internally (v1.7+). No benefit in 2026 for SDKs. | Native Fetch API |
| node-fetch | Node.js 18+ has native fetch. Adds unnecessary dependency. | Native fetch |
| swagger-codegen | Outdated. Poor TypeScript support. Generates Java-style code. | @hey-api/openapi-ts or OpenAPI Generator |
| EventSource polyfill | Node.js 20+ supports SSE via fetch. Modern browsers have native EventSource. | Native fetch (streaming response) |
| webpack/rollup for libraries | Overcomplicated for library bundling. Use esbuild-based tools. | tsup or tsdown |

## Stack Patterns by Variant

### Dual Package (ESM + CJS)

**Configuration (tsup.config.ts):**
```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
})
```

**package.json:**
```json
{
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

### SSE Streaming Pattern

**Node.js 20+ / Modern Browsers:**
```typescript
const response = await fetch(url, {
  headers: { Authorization: `Bearer ${token}` }
})

const reader = response.body!.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  const chunk = decoder.decode(value)
  // Parse SSE format: "data: {...}\n\n"
}
```

**No library needed.** Native fetch handles SSE streaming.

### Multipart File Upload Pattern

**Browser + Node.js 20+:**
```typescript
const formData = new FormData()
formData.append('file', fileBlob, 'filename.png')
formData.append('metadata', JSON.stringify({ type: 'image' }))

await fetch(url, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  // DO NOT set Content-Type - browser/Node.js sets boundary automatically
  body: formData
})
```

**Critical:** Never set `Content-Type` header manually. The boundary parameter must be auto-generated.

### Bearer Token Authentication Pattern

**SDK Client Pattern:**
```typescript
class AgentOSClient {
  constructor(private apiKey: string, private baseURL: string) {}

  private async request(endpoint: string, init?: RequestInit) {
    return fetch(`${this.baseURL}${endpoint}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...init?.headers,
      }
    })
  }
}
```

Stateless authentication. No session storage needed. Token rotation can be implemented via interceptor pattern.

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| @hey-api/openapi-ts@latest | Node.js 20+ | Requires Node.js 20+. Pin exact version (-E flag). |
| tsup@8.5.1 | TypeScript 5.7+ | Works but maintenance ending. Consider tsdown for new projects. |
| vitest@4.x | Node.js 20+ | Browser Mode requires 4.0+. Works with Bun via `bun run test`. |
| zod@3.24+ | TypeScript 5.0+ | Use with @hey-api Zod plugin for runtime validation. |

## OpenAPI Code Generation Workflow

```bash
# Install generator (dev dependency, pinned)
npm install -D @hey-api/openapi-ts -E

# Create config file: openapi-ts.config.ts
export default {
  input: './spec/openapi.yaml',  // or URL to spec
  output: './src/generated',
  plugins: [
    '@hey-api/typescript',
    '@hey-api/sdk',
    {
      name: '@hey-api/zod',
      // Runtime validation
    }
  ],
  client: {
    name: 'fetch',  // Use native fetch
  }
}

# Generate SDK
npx @hey-api/openapi-ts

# Add to package.json scripts
"scripts": {
  "generate": "@hey-api/openapi-ts"
}
```

The generated SDK will have:
- Full TypeScript types from OpenAPI spec
- Client methods: `client.agents.list()`, `client.sessions.get()`
- Zod schemas for runtime validation
- Zero runtime dependencies (uses native fetch)

## Testing Strategy

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',  // or 'jsdom' for browser APIs
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    }
  }
})
```

**Test both Node.js and Browser environments:**
- Use `environment: 'node'` for server-side tests
- Use `environment: 'jsdom'` for browser API tests
- Vitest 4.0+ has stable Browser Mode for real browser testing

## Publishing Checklist

1. **Dual format:** ESM + CJS via tsup
2. **Type declarations:** `.d.ts` files generated
3. **package.json exports:** Proper export map
4. **Node.js engines:** Specify `"node": ">=20"`
5. **Files field:** Include only `dist/` and `README.md`
6. **Sourcemaps:** Enable for debugging
7. **Tree-shakeable:** Use named exports, no default exports

## Sources

**HIGH CONFIDENCE:**
- [@hey-api/openapi-ts GitHub](https://github.com/hey-api/openapi-ts) — Features, current state, usage patterns (verified Jan 2026)
- [@hey-api/openapi-ts Documentation](https://heyapi.dev/openapi-ts/get-started) — Installation, configuration (verified Jan 2026)
- [Vitest 4.0 Release](https://vitest.dev/blog/vitest-4) — Version 4.0 features, Browser Mode stable (Dec 2025)
- [MDN: Using Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) — Native SSE support
- [MDN: Using FormData Objects](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Using_FormData_Objects) — Native multipart upload

**MEDIUM CONFIDENCE:**
- [Axios vs. Fetch (2025 update)](https://blog.logrocket.com/axios-vs-fetch-2025/) — Comparison, recommendation for fetch (verified 2025)
- [TypeScript Best Practices 2026](https://johal.in/typescript-best-practices-for-large-scale-web-applications-in-2026/) — Modern TypeScript patterns
- [tsup GitHub](https://github.com/egoist/tsup) — Version 8.5.1, maintenance status (verified Nov 2025)
- [Stainless: Bearer Token Best Practices](https://www.stainless.com/sdk-api-best-practices/authorization-bearer-token-header-example-for-apis) — SDK auth patterns

**LOW CONFIDENCE (WebSearch only, flagged for validation):**
- State of TypeScript 2026 (Node.js 22 native TS support, TS 7.0 Go compiler) — No official verification yet
- tsdown as tsup replacement — Very new (2025), limited production usage

---
*Stack research for: TypeScript SDK (Node.js + Browser)*
*Researched: 2026-01-31*
*Researcher: GSD Project Researcher*
