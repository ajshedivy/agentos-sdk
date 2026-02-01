# Phase 7: Runtime Support & Polish - Research

**Researched:** 2026-02-01
**Domain:** Cross-platform SDK testing, dual package validation, npm publishing
**Confidence:** HIGH

## Summary

Phase 7 focuses on validating the SDK's runtime compatibility across Node.js 18+ and modern browsers, ensuring comprehensive test coverage, and preparing for npm publication. The SDK is already well-positioned with native fetch API support, eventsource-parser for streaming, and a properly configured dual ESM/CJS package structure validated by publint and attw.

The research reveals that the SDK's current architecture leverages Node.js 18+ native fetch (though marked experimental in Node 18), uses eventsource-parser for streaming which works across all JavaScript runtimes, and has runtime environment detection for file handling. The package validation tools (publint and attw) show no issues, confirming proper dual package configuration.

For testing, Vitest v2.1.9 is already in use with V8 coverage provider. Browser testing can be added via Vitest's stable browser mode (released in v4.0) using Playwright or preview mode. The V8 coverage provider is the recommended choice in 2026 due to AST-based remapping (introduced in v3.2.0) that provides accuracy matching Istanbul with significantly better performance.

**Primary recommendation:** Validate runtime compatibility with manual browser testing and Node.js 18+ smoke tests, enhance test coverage for edge cases, create comprehensive npm publishing checklist, and prepare browser usage examples.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | 2.1.9+ | Test framework with browser support | Industry standard in 2026, stable browser mode since v4.0, AST-based V8 coverage |
| publint | 0.2.12+ | Package configuration validation | Catches dual package hazards, export configuration issues |
| @arethetypeswrong/cli | 0.17.0+ | TypeScript types validation | Ensures types work correctly across CJS/ESM boundaries |
| tsup | 8.3.5+ | Build tool for dual packages | Zero-config TypeScript bundler, industry standard for dual publishing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| eventsource-parser | 3.0.6 | SSE parsing across runtimes | Already in use, works in browsers and Node.js (18+) |
| exponential-backoff | 3.1.3 | Retry logic | Already in use for HTTP retry |
| Playwright (optional) | Latest | Browser automation for testing | If adding Vitest browser mode with real browser testing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| V8 coverage | Istanbul coverage | V8 is 10x faster, Istanbul 3x slower but works on non-V8 runtimes (Firefox, Bun) |
| Vitest browser mode | Manual browser testing | Browser mode automates but adds complexity; manual testing sufficient for this phase |
| publint + attw | Only publint | attw catches additional TypeScript-specific issues publint misses |

**Installation:**
```bash
# Already installed - no additional packages needed for validation
# Optional for browser mode testing:
npm install --save-dev @vitest/browser playwright
```

## Architecture Patterns

### Recommended Test Structure
```
tests/
├── unit/              # Core functionality tests (already exists as current structure)
├── integration/       # Multi-component integration tests
├── runtime/           # NEW: Runtime-specific tests
│   ├── node18.test.ts # Node.js 18 specific features
│   ├── browser.test.ts # Browser-specific tests (FormData, fetch, SSE)
│   └── files.test.ts  # File handling across runtimes (already exists)
└── fixtures/          # Test data and mock files
```

### Pattern 1: Runtime Environment Detection Tests
**What:** Verify SDK correctly detects and handles different runtime environments
**When to use:** Testing file handling, FormData compatibility, fetch API usage
**Example:**
```typescript
// Based on existing src/utils/files.ts pattern
describe('Runtime Detection', () => {
  it('detects Node.js environment for ReadStream support', () => {
    // In Node.js, fs.createReadStream should be available
    expect(typeof fs.createReadStream).toBe('function');
  });

  it('handles File constructor availability', () => {
    // File constructor available in Node 20+, browsers
    if (typeof File !== 'undefined') {
      const file = new File(['content'], 'test.txt');
      expect(file).toBeInstanceOf(File);
    }
  });
});
```

### Pattern 2: Streaming API Compatibility Tests
**What:** Verify SSE parsing works across Node.js and browsers
**When to use:** Testing streaming functionality
**Example:**
```typescript
// Source: Existing tests/streaming/parser.test.ts
// Uses ReadableStream, TextDecoderStream - available in Node 18+ and browsers
describe('SSE Streaming', () => {
  it('parses SSE events in both Node and browser', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"test": true}\n\n'));
        controller.close();
      }
    });

    const response = new Response(stream);
    // parseSSEResponse uses eventsource-parser/stream (universal)
    const events = await collectEvents(parseSSEResponse(response, controller));
    expect(events).toHaveLength(1);
  });
});
```

### Pattern 3: Package Validation in CI/CD
**What:** Automated validation before publishing
**When to use:** Every build, before npm publish
**Example:**
```bash
# Source: package.json validate script (already implemented)
npm run build && publint && attw --pack .
```

### Anti-Patterns to Avoid
- **Testing in only Node.js:** Don't assume browser compatibility without validation
- **Ignoring Node 18 experimental fetch status:** Document that Node 18 fetch is experimental (stable in Node 21+)
- **Publishing without dry-run:** Always use `npm publish --dry-run` or `npm pack --dry-run` first
- **Assuming ReadStream works in browsers:** ReadStream is Node.js-only, use Blob/File instead

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE parsing | Custom SSE parser | eventsource-parser | Handles chunked responses, multi-line data, reconnection logic, spec-compliant |
| Package validation | Manual export checking | publint + attw | Catches dual package hazards, type definition issues, 50+ validation rules |
| Dual package builds | Manual tsconfig per format | tsup | Zero-config, handles .d.ts/.d.cts generation, proper extension mapping |
| Retry logic | Custom exponential backoff | exponential-backoff library | Handles jitter, max delay, abort signals correctly |
| FormData in Node.js | Creating FormData polyfill | Native FormData (Node 18+) + proper file handling | Native support in Node 18+, use fs.openAsBlob() for files in Node 19.8+ |

**Key insight:** Runtime compatibility issues have subtle edge cases (chunked SSE, type definition resolution, FormData boundary headers). Using battle-tested libraries prevents production bugs that only appear in specific environments.

## Common Pitfalls

### Pitfall 1: Node.js 18 Fetch Experimental Status
**What goes wrong:** Publishing package claiming "Node 18+ support" without documenting experimental fetch status
**Why it happens:** Fetch is available in Node 18 by default, but marked Stability: 1 - Experimental
**How to avoid:** Document in README that Node 18 fetch is experimental; recommend Node 21+ for production (fetch stable)
**Warning signs:** Users report fetch instabilities only in Node 18 production environments

### Pitfall 2: ReadStream vs Blob/File in FormData
**What goes wrong:** ReadStream passed to native FormData results in `[object Object]` instead of file content
**Why it happens:** Native FormData in Node.js doesn't accept ReadStream; browser FormData doesn't have ReadStream
**How to avoid:** SDK already handles this correctly - normalizeFileInput() converts based on runtime
**Warning signs:** File uploads fail with "invalid body" only in certain environments

### Pitfall 3: Missing Browser Tests for SSE
**What goes wrong:** SSE streaming breaks in browsers despite passing Node.js tests
**Why it happens:** Browsers have different ReadableStream implementations, different error handling
**How to avoid:** Test SSE parsing with browser-native ReadableStream, verify abort signal handling
**Warning signs:** Streaming works in Node.js but hangs or errors in browsers

### Pitfall 4: Publishing .env or Sensitive Files
**What goes wrong:** Accidentally publishing sensitive files, config files, or test fixtures
**Why it happens:** package.json "files" field not properly configured, or relying on .gitignore instead of .npmignore
**How to avoid:** Use `npm pack --dry-run` to preview package contents, use "files" whitelist in package.json
**Warning signs:** Larger-than-expected package size, publint warnings about repository field

### Pitfall 5: Type Definition Mismatches (CJS vs ESM)
**What goes wrong:** Types work in ESM imports but fail in CJS require(), or vice versa
**Why it happens:** Incorrect .d.ts vs .d.cts mapping, "types" condition order in exports
**How to avoid:** Use attw to validate type resolution across all module formats
**Warning signs:** TypeScript users report "Cannot find module" errors despite package installation

### Pitfall 6: V8 Coverage Provider in Non-V8 Runtimes
**What goes wrong:** Coverage collection fails in Firefox, Bun, or other non-V8 environments
**Why it happens:** V8 coverage provider uses V8-specific profiler APIs
**How to avoid:** Document V8 coverage requirement, or switch to Istanbul for cross-runtime coverage
**Warning signs:** Coverage reports empty or crash in non-Chrome browsers

## Code Examples

Verified patterns from official sources:

### Browser Compatibility Test Pattern
```typescript
// Source: Vitest browser mode docs
// https://vitest.dev/guide/browser/
import { describe, it, expect } from 'vitest';

describe('Browser Compatibility', () => {
  it('uses native fetch API', async () => {
    // Works in Node 18+ and all modern browsers
    const response = await fetch('https://api.example.com/health');
    expect(response.ok).toBe(true);
  });

  it('handles FormData with Files', () => {
    // File constructor available in Node 20+ and browsers
    if (typeof File !== 'undefined') {
      const formData = new FormData();
      const file = new File(['content'], 'test.txt');
      formData.append('file', file);
      expect(formData.get('file')).toBeInstanceOf(File);
    }
  });
});
```

### npm Publishing Checklist (Pre-Publish Validation)
```bash
# Source: npm best practices
# https://docs.npmjs.com/cli/v10/commands/npm-publish

# 1. Verify package contents
npm pack --dry-run

# 2. Validate package configuration
publint

# 3. Validate TypeScript types across module formats
attw --pack .

# 4. Test local installation
npm pack
cd /tmp/test-project
npm install /path/to/package-name-0.1.0.tgz

# 5. Dry-run publish
npm publish --dry-run

# 6. Publish (after all checks pass)
npm publish --access public  # for scoped packages
```

### Runtime-Safe File Handling
```typescript
// Source: Existing src/utils/files.ts
import * as fs from 'fs';
import type { ReadStream } from 'fs';

export function normalizeFileInput(
  input: FileInput,
  filename?: string
): Blob | ReadStream | File {
  // String path -> ReadStream (Node.js only)
  if (typeof input === 'string') {
    if (typeof fs.createReadStream === 'function') {
      return fs.createReadStream(input);
    }
    throw new Error('File paths are only supported in Node.js environments');
  }

  // Buffer -> Blob/File (cross-platform)
  if (Buffer.isBuffer(input)) {
    // Use File constructor if available (Node 20+, browsers)
    if (filename && typeof File !== 'undefined') {
      return new File([input], filename);
    }
    return new Blob([input]);
  }

  // Pass through Blob, File, ReadStream unchanged
  return input;
}
```

### Test Coverage Configuration (V8 Provider)
```typescript
// Source: vitest.config.ts (already configured)
// https://vitest.dev/guide/coverage
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    coverage: {
      provider: 'v8',  // Fast, accurate (as of Vitest 3.2.0+)
      reporter: ['text', 'json', 'html'],
      exclude: ['dist/**', 'tests/**', '**/*.config.ts'],
    },
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| node-fetch library | Native fetch (Node 18+) | Node 18 (Apr 2022), stable in Node 21 (Oct 2023) | Remove polyfill dependency, use native APIs |
| Istanbul coverage | V8 coverage with AST remapping | Vitest 3.2.0 (2024) | 10x faster coverage with identical accuracy |
| EventSource polyfill | eventsource-parser | Ongoing | Universal SSE parsing without polyfills |
| Separate .d.ts files | .d.cts for CJS, .d.ts for ESM | TypeScript 4.7+ (May 2022) | Proper type resolution across module formats |
| Manual exports field | tsup automatic generation | tsup 6.0+ | Correct dual package configuration by default |
| npm pack for testing | npm pack --dry-run | npm 6+ | Preview package without creating tarball |

**Deprecated/outdated:**
- **node-fetch:** No longer needed in Node 18+, native fetch available
- **EventSource polyfill:** eventsource-parser works universally without runtime detection
- **form-data package:** Native FormData in Node 18+ (though ReadStream requires special handling)
- **Istanbul as default:** V8 coverage now provides same accuracy with better performance

## Open Questions

Things that couldn't be fully resolved:

1. **Node.js 18 vs 21+ recommendation**
   - What we know: Node 18 has experimental fetch, Node 21+ has stable fetch. Node 18 EOL is April 2025 (already passed as of Feb 2026)
   - What's unclear: Whether to continue supporting Node 18 or bump to Node 21+ minimum
   - Recommendation: Document Node 18 experimental status, recommend Node 21+ for production, plan to bump engines.node to ">=21.0.0" in future major version

2. **Browser mode testing vs manual testing**
   - What we know: Vitest browser mode is stable (v4.0), but adds Playwright dependency and complexity
   - What's unclear: Whether automated browser testing provides sufficient ROI for this SDK
   - Recommendation: Start with manual browser testing (create HTML test page), add Vitest browser mode in future if needed

3. **FormData with ReadStream in Node.js**
   - What we know: Native FormData doesn't accept ReadStream, fs.openAsBlob() is experimental in Node 22
   - What's unclear: Best long-term strategy for file uploads in Node.js with native APIs
   - Recommendation: Current normalizeFileInput() approach is correct; document ReadStream -> Blob conversion; consider fs.openAsBlob() when it becomes stable

4. **Coverage target for "comprehensive"**
   - What we know: Currently 431 tests passing
   - What's unclear: What coverage percentage qualifies as "comprehensive" for success criteria
   - Recommendation: Aim for 80%+ line coverage, 70%+ branch coverage; prioritize edge cases over percentage

## Sources

### Primary (HIGH confidence)
- Vitest Official Docs - Browser Mode: https://vitest.dev/guide/browser/
- Vitest Official Docs - Coverage: https://vitest.dev/guide/coverage
- npm Official Docs - Publishing: https://docs.npmjs.com/cli/v10/commands/npm-publish
- publint Official Docs - Rules: https://publint.dev/rules
- eventsource-parser npm page: https://www.npmjs.com/package/eventsource-parser
- Node.js 18 Release Notes: https://nodejs.org/en/blog/announcements/v18-release-announce

### Secondary (MEDIUM confidence)
- [Dual Publishing ESM and CJS Modules with tsup and Are the Types Wrong?](https://johnnyreilly.com/dual-publishing-esm-cjs-modules-with-tsup-and-are-the-types-wrong)
- [Best Practices for Creating a Modern npm Package with Security in Mind](https://snyk.io/blog/best-practices-create-modern-npm-package/)
- [Testing NPM Publish With A Dry Run](https://stevefenton.co.uk/blog/2024/01/testing-npm-publish/)
- [V8 Coverage vs Istanbul: Performance and Accuracy](https://dev.to/stevez/v8-coverage-vs-istanbul-performance-and-accuracy-3ei8)
- [Migrating node-fetch/form-data to Node.js native APIs](https://dev.to/ueokande/migrating-node-fetchform-data-to-nodejs-native-apis-2j7h)

### Tertiary (LOW confidence)
- [Vitest vs Jest 30: Why 2026 is the Year of Browser-Native Testing](https://dev.to/dataformathub/vitest-vs-jest-30-why-2026-is-the-year-of-browser-native-testing-2fgb) - Industry trends, not prescriptive
- [TypeScript in 2025 with ESM and CJS npm publishing is still a mess](https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing) - Opinion piece, not authoritative

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Tools already in use (Vitest, publint, attw, tsup) with verified configuration
- Architecture: HIGH - Based on existing codebase patterns and official documentation
- Pitfalls: HIGH - Based on official Node.js docs, npm best practices, and verified GitHub issues
- Runtime compatibility: HIGH - Native APIs (fetch, FormData, ReadableStream) documented in Node.js and browser specs

**Research date:** 2026-02-01
**Valid until:** 2026-04-01 (60 days - relatively stable domain, testing tools evolve slowly)

**Key findings for planner:**
1. SDK is already well-configured for dual package publishing - validation tools show no issues
2. Runtime detection patterns already implemented in file handling - can be used as template
3. V8 coverage provider is correct choice (fast + accurate since Vitest 3.2.0)
4. Node 18 fetch is experimental (stable in Node 21+) - should be documented
5. Manual browser testing likely sufficient - Vitest browser mode optional enhancement
6. npm publishing checklist is well-established - use publint + attw + pack --dry-run
