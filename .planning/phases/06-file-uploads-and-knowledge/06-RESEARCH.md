# Phase 6: File Uploads & Knowledge - Research

**Researched:** 2026-01-31
**Domain:** File uploads, multipart form data, knowledge base APIs
**Confidence:** HIGH

## Summary

Phase 6 adds file upload capabilities (images, audio, video, files) and knowledge base operations to the SDK. The research focused on three domains: (1) cross-platform file input handling in TypeScript/Node.js, (2) FormData best practices for multipart uploads, and (3) knowledge base API patterns.

**Key findings:**
- TypeScript SDKs use union types to accept multiple input formats: `Buffer | ReadStream | Blob | string (path)`
- FormData boundary headers must NEVER be set manually—the browser/fetch automatically handles this
- OpenAI SDK pattern is the gold standard: supports paths, streams, buffers, and blobs through unified types
- Knowledge base APIs follow standard REST patterns: pagination, filtering, vector search with JSON bodies

**Primary recommendation:** Use union types for flexible file inputs (matching OpenAI SDK pattern), remove Content-Type header for FormData (already implemented in Phase 3), and implement KnowledgeResource following established resource patterns with FormData for uploads and JSON for search.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Native FormData | Built-in | Multipart file uploads | Browser/Node.js native, automatic boundary handling |
| Native fetch | Built-in | HTTP client | Standard in Node 18+, supports FormData/streams natively |
| fs.createReadStream | Built-in | File streaming | Node.js standard for memory-efficient file reads |
| Native Buffer | Built-in | Binary data | Node.js standard for in-memory file data |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| file-type | ^19.x | MIME type detection from buffer | Optional: validate file types from buffer content (not just extension) |
| mime-types | ^2.x | MIME lookup by extension | Optional: determine content-type from filename |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native FormData | form-data (npm) | form-data is Node-only; native works cross-platform since Node 18 |
| Union types | Separate methods | Union type (string \| Buffer \| Stream) is more DX-friendly than uploadFromPath(), uploadFromBuffer() |
| file-type | Just trust extensions | Content-based detection is more secure but adds dependency |

**Installation:**
```bash
# No required dependencies - using built-in Node.js/browser APIs
# Optional validation libraries:
npm install file-type mime-types  # Only if adding file type validation
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── resources/
│   └── knowledge.ts        # KnowledgeResource class
├── types/
│   └── files.ts           # File input type definitions (Image, Audio, Video, File)
└── utils/
    └── files.ts           # File handling utilities (optional)
```

### Pattern 1: Flexible File Input Types

**What:** Union types that accept multiple input formats for developer convenience

**When to use:** Any method that accepts file/media inputs (images, audio, video, files)

**Example:**
```typescript
// Source: OpenAI Node SDK pattern (https://github.com/openai/openai-node)
// Unified file input type supporting multiple formats
type FileInput = string | Buffer | ReadStream | Blob | File;

// Or more specific types matching Python SDK
export type Image = string | Buffer | ReadStream | Blob;
export type Audio = string | Buffer | ReadStream | Blob;
export type Video = string | Buffer | ReadStream | Blob;
export type File = string | Buffer | ReadStream | Blob;

// Usage in run methods
export interface RunOptions {
  message: string;
  sessionId?: string;
  userId?: string;
  images?: Image[];     // Accept any file input format
  audio?: Audio[];
  videos?: Video[];
  files?: File[];
  stream?: false;
}
```

### Pattern 2: FormData Construction for File Uploads

**What:** Build FormData with files and metadata, let fetch handle Content-Type

**When to use:** Uploading files to API endpoints (knowledge.upload, agent.run with media)

**Example:**
```typescript
// Source: Existing agents.ts pattern from Phase 3
async upload(options: UploadOptions): Promise<ContentResponse> {
  const formData = new FormData();

  // Add file (convert input type to appropriate format)
  if (options.file) {
    formData.append('file', options.file);
  }

  // Add optional text fields only if defined
  if (options.name) {
    formData.append('name', options.name);
  }
  if (options.description) {
    formData.append('description', options.description);
  }

  // Add metadata as JSON string
  if (options.metadata) {
    formData.append('metadata', JSON.stringify(options.metadata));
  }

  // Client.request removes Content-Type for FormData automatically
  return this.client.request('POST', '/knowledge/content', { body: formData });
}
```

### Pattern 3: File Input Normalization

**What:** Convert various file input types to FormData-compatible format

**When to use:** Before appending to FormData, normalize string paths to ReadStream

**Example:**
```typescript
// Source: Azure Storage SDK pattern
// Convert file input to appropriate format for FormData
function normalizeFileInput(input: FileInput): Blob | ReadStream {
  // String path -> ReadStream (Node.js only)
  if (typeof input === 'string') {
    return fs.createReadStream(input);
  }

  // Buffer -> Blob (cross-platform)
  if (Buffer.isBuffer(input)) {
    return new Blob([input]);
  }

  // Already stream or blob
  return input;
}
```

### Pattern 4: Knowledge Base Search (JSON Body)

**What:** Vector search with query and filters using JSON request body

**When to use:** Searching knowledge base for relevant documents

**Example:**
```typescript
// Source: OpenAPI spec /knowledge/search endpoint
export interface SearchOptions {
  /** Search query string */
  query: string;
  /** Number of results to return */
  limit?: number;
  /** Page number for pagination */
  page?: number;
  /** Database ID */
  dbId?: string;
  /** Additional search filters */
  filters?: Record<string, unknown>;
}

async search(query: string, options?: Omit<SearchOptions, 'query'>): Promise<SearchResults> {
  const body = {
    query,
    limit: options?.limit,
    page: options?.page,
    db_id: options?.dbId,
    ...options?.filters,
  };

  // Use JSON body, not FormData
  return this.client.request('POST', '/knowledge/search', {
    body: JSON.stringify(body),
  });
}
```

### Pattern 5: Pagination Response Handling

**What:** Consistent pattern for paginated list responses

**When to use:** knowledge.list(), returning paginated data with metadata

**Example:**
```typescript
// Source: Phase 5 pattern (sessions.list, memories.list)
type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total_pages: number;
    total_count: number;
  };
};

async list(options?: ListOptions): Promise<PaginatedResponse<ContentResponse>> {
  const params = new URLSearchParams();

  // Only append defined parameters
  if (options?.limit !== undefined) params.append('limit', String(options.limit));
  if (options?.page !== undefined) params.append('page', String(options.page));
  if (options?.sortBy) params.append('sort_by', options.sortBy);
  if (options?.sortOrder) params.append('sort_order', options.sortOrder);
  if (options?.dbId) params.append('db_id', options.dbId);

  const query = params.toString();
  const path = query ? `/knowledge/content?${query}` : '/knowledge/content';

  return this.client.request('GET', path);
}
```

### Anti-Patterns to Avoid

- **Manual Content-Type for FormData:** Never set `Content-Type: multipart/form-data` manually—fetch auto-generates with boundary
- **Loading entire files into memory:** Use streams (createReadStream) for large files, not readFileSync + Buffer
- **Inconsistent input types across methods:** Use same Image/Audio/Video/File types everywhere for consistency
- **Separate methods per input type:** Don't create uploadFromPath(), uploadFromBuffer(), etc.—use single method with union type

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| FormData boundary generation | Custom multipart encoder | Native FormData + fetch | Boundary format is complex (70-char limits, dashes, CRLF), fetch handles it perfectly |
| File streaming for uploads | Manual chunking logic | fs.createReadStream | Built-in backpressure management, memory efficiency, error handling |
| MIME type detection | Extension mapping object | mime-types (optional) or file-type | Comprehensive database (1000+ types), handles edge cases |
| File input type checking | typeof checks scattered | Unified normalizeFileInput helper | Centralizes logic, handles Buffer.isBuffer(), stream detection |
| Pagination query params | Manual string building | URLSearchParams pattern | Handles encoding, undefined filtering, consistent with Phase 5 |

**Key insight:** File handling has many edge cases (binary data, encoding, memory limits, backpressure). Node.js built-ins (streams, Buffer, FormData) have solved these with 10+ years of production testing. Don't reinvent—use the primitives.

## Common Pitfalls

### Pitfall 1: Manually Setting FormData Content-Type Header

**What goes wrong:** Setting `Content-Type: multipart/form-data` header manually causes "Invalid boundary" errors. The server receives a header like `Content-Type: multipart/form-data` without the boundary parameter (e.g., `boundary=----WebKitFormBoundary...`), making the multipart body unparseable.

**Why it happens:** FormData generates a random boundary when serialized. If you set Content-Type before serialization, fetch can't inject the boundary parameter. The Request/Response spec requires honoring user-provided headers, so your manual header wins and breaks the upload.

**How to avoid:**
```typescript
// BAD - manual header breaks boundary
headers['Content-Type'] = 'multipart/form-data';
fetch(url, { method: 'POST', headers, body: formData });

// GOOD - let fetch auto-set with boundary
// Already implemented in client.ts Phase 3:
if (options.body instanceof FormData) {
  const { 'Content-Type': _, ...headersWithoutContentType } = headers;
  headers = headersWithoutContentType;
}
```

**Warning signs:** API errors like "multipart form parse error - Invalid boundary in multipart: None", "missing boundary in Content-Type header", or multipart bodies not being parsed at all.

**Source:** [Never set multipart/form-data manually](https://craft.mirego.com/2022-11-03-you-should-never-set-the-multipart-form-data-content-type-manually/)

### Pitfall 2: Memory Exhaustion from Loading Large Files

**What goes wrong:** Using `fs.readFileSync()` or `Buffer.from()` loads entire files into memory. For a 500MB video, this allocates 500MB of Node.js heap, causing OOM crashes or slow garbage collection. Node.js has a 2GB I/O limit, so files over 2GB will fail completely.

**Why it happens:** Developers default to synchronous file APIs for simplicity. Reading entire files into Buffer seems "easier" than handling streams, but it doesn't scale.

**How to avoid:**
```typescript
// BAD - loads entire file into memory
const buffer = fs.readFileSync('large-video.mp4');
formData.append('file', new Blob([buffer]));

// GOOD - streams file in chunks
const stream = fs.createReadStream('large-video.mp4');
formData.append('file', stream);

// ALSO GOOD - for user uploads, accept Buffer but warn in docs
// "For files >10MB, prefer file paths or streams to avoid memory issues"
```

**Warning signs:** High memory usage (`process.memoryUsage()`), crashes on large files, slow performance, "JavaScript heap out of memory" errors.

**Source:** [Node.js stream memory efficiency](https://medium.com/dev-bits/writing-memory-efficient-software-applications-in-node-js-5575f646b67f), [Stream processing optimization](https://app.studyraid.com/en/read/12494/404057/stream-processing-optimization)

### Pitfall 3: Backpressure Mismanagement in Streams

**What goes wrong:** Fast producer (reading file) + slow consumer (network upload) causes unbounded buffer growth, consuming memory until crash. Streams without proper backpressure control will buffer data indefinitely when the consumer can't keep up.

**Why it happens:** Node.js streams have a `highWaterMark` buffer (default 16KB for streams). If you ignore the return value of `stream.write()` or don't pause/resume properly, buffers accumulate. FormData/fetch usually handle this, but custom stream handling can break it.

**How to avoid:**
```typescript
// GOOD - use built-in APIs that handle backpressure
const stream = fs.createReadStream('file.mp4', {
  highWaterMark: 64 * 1024, // 64KB chunks (optimal for most uploads)
});
formData.append('file', stream);  // fetch handles backpressure

// If implementing custom stream handling:
stream.on('data', (chunk) => {
  const canContinue = writable.write(chunk);
  if (!canContinue) {
    stream.pause();  // Pause reading when consumer is full
  }
});
writable.on('drain', () => stream.resume());  // Resume when ready
```

**Warning signs:** Memory growing over time during uploads, timeouts on large files, connection drops, `ECONNRESET` errors.

**Source:** [Node.js backpressure guide](https://nodejs.org/en/learn/modules/backpressuring-in-streams), [Stream processing optimization](https://app.studyraid.com/en/read/12494/404057/stream-processing-optimization)

### Pitfall 4: Browser vs Node.js File API Differences

**What goes wrong:** Code using `fs.createReadStream()` breaks in browser environments. Browser code using `File` API doesn't work in Node.js. Type errors occur when assuming all environments have the same file APIs.

**Why it happens:** Node.js has `fs` module and `Buffer`, browsers have `File` and `Blob`. While FormData exists in both, the input types differ. Node.js 18+ has `Blob` but still lacks `File` constructor.

**How to avoid:**
```typescript
// Use union types to accept both environments
type FileInput = string | Buffer | ReadStream | Blob | File;

// Runtime detection for normalization
function normalizeFileInput(input: FileInput) {
  // Node.js path
  if (typeof input === 'string' && typeof fs !== 'undefined') {
    return fs.createReadStream(input);
  }

  // Node.js Buffer -> Blob
  if (Buffer.isBuffer(input)) {
    return new Blob([input]);
  }

  // Browser File/Blob or Node.js Blob
  return input;
}

// Document environment support clearly
/**
 * @param file - File to upload. Node.js: string path, Buffer, or ReadStream. Browser: File or Blob.
 */
```

**Warning signs:** "fs is not defined" errors in browser, "File is not defined" in Node.js, TypeScript errors about incompatible types.

**Source:** [formdata-node isomorphic library](https://www.npmjs.com/package/formdata-node), [Azure cross-platform examples](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-upload-javascript)

### Pitfall 5: File Path String Security (Server-Side Only)

**What goes wrong:** Accepting arbitrary file path strings from users allows path traversal attacks (`../../../etc/passwd`). Even without malicious intent, accessing files outside expected directories can leak sensitive data or cause permission errors.

**Why it happens:** String paths are convenient for server-side scripts but dangerous when user-provided. Developers forget to validate/sanitize paths.

**How to avoid:**
```typescript
// For server-side SDK usage with user-provided paths:
function validateFilePath(path: string): void {
  const resolved = path.resolve(path);
  const allowed = path.resolve('/allowed/upload/dir');

  if (!resolved.startsWith(allowed)) {
    throw new Error('File path outside allowed directory');
  }

  if (!fs.existsSync(resolved)) {
    throw new Error('File not found');
  }
}

// Better: Document that path strings are for trusted server-side code only
/**
 * @param file - File path (server-side only, trusted paths), Buffer, or Stream
 * @security File paths are not validated. Only use trusted paths from your application code.
 */
```

**Warning signs:** Path traversal vulnerabilities, accessing unintended files, permission denied errors, security audit findings.

**Note:** This is less critical for the SDK itself (users control their own code) but important to document for developers building APIs with the SDK.

## Code Examples

Verified patterns from official sources and existing codebase:

### Uploading Content to Knowledge Base

```typescript
// Source: OpenAPI spec + Phase 3 FormData pattern
async upload(options: UploadOptions): Promise<ContentResponse> {
  const formData = new FormData();

  // File upload (one of: file, url, or text_content)
  if (options.file) {
    formData.append('file', normalizeFileInput(options.file));
  }
  if (options.url) {
    formData.append('url', options.url);
  }
  if (options.textContent) {
    formData.append('text_content', options.textContent);
  }

  // Optional fields
  if (options.name) formData.append('name', options.name);
  if (options.description) formData.append('description', options.description);
  if (options.metadata) formData.append('metadata', JSON.stringify(options.metadata));
  if (options.readerId) formData.append('reader_id', options.readerId);
  if (options.chunker) formData.append('chunker', options.chunker);
  if (options.chunkSize !== undefined) formData.append('chunk_size', String(options.chunkSize));
  if (options.chunkOverlap !== undefined) formData.append('chunk_overlap', String(options.chunkOverlap));

  // Add db_id as query param if provided
  const params = new URLSearchParams();
  if (options.dbId) params.append('db_id', options.dbId);
  const query = params.toString();
  const path = query ? `/knowledge/content?${query}` : '/knowledge/content';

  // Client removes Content-Type for FormData (Phase 3 implementation)
  return this.client.request<ContentResponse>('POST', path, { body: formData });
}
```

### Searching Knowledge Base

```typescript
// Source: OpenAPI spec /knowledge/search
async search(query: string, options?: SearchOptions): Promise<PaginatedSearchResults> {
  const body = {
    query,
    limit: options?.limit,
    page: options?.page,
    db_id: options?.dbId,
    // Add other search options as needed
  };

  // JSON body for search, not FormData
  return this.client.request<PaginatedSearchResults>('POST', '/knowledge/search', {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### Running Agent with Media Inputs

```typescript
// Source: Requirement FILE-01 to FILE-05
export interface StreamRunOptions {
  message: string;
  sessionId?: string;
  userId?: string;
  // Media parameters (Phase 6)
  images?: Image[];
  audio?: Audio[];
  videos?: Video[];
  files?: File[];
}

async runStream(agentId: string, options: StreamRunOptions): Promise<AgentStream> {
  const formData = new FormData();
  formData.append('message', options.message);
  formData.append('stream', 'true');

  if (options.sessionId) formData.append('session_id', options.sessionId);
  if (options.userId) formData.append('user_id', options.userId);

  // Append media arrays (Phase 6)
  if (options.images) {
    for (const image of options.images) {
      formData.append('images', normalizeFileInput(image));
    }
  }
  if (options.audio) {
    for (const audio of options.audio) {
      formData.append('audio', normalizeFileInput(audio));
    }
  }
  if (options.videos) {
    for (const video of options.videos) {
      formData.append('videos', normalizeFileInput(video));
    }
  }
  if (options.files) {
    for (const file of options.files) {
      formData.append('files', normalizeFileInput(file));
    }
  }

  const controller = new AbortController();
  const response = await this.client.requestStream('POST',
    `/agents/${encodeURIComponent(agentId)}/runs`,
    { body: formData, signal: controller.signal }
  );

  return AgentStream.fromSSEResponse(response, controller);
}
```

### File Input Normalization Helper

```typescript
// Source: Azure SDK + OpenAI SDK patterns
import fs from 'fs';

function normalizeFileInput(input: FileInput): Blob | ReadStream | File {
  // File path string (Node.js only)
  if (typeof input === 'string') {
    // Runtime check for Node.js environment
    if (typeof fs !== 'undefined' && fs.createReadStream) {
      return fs.createReadStream(input);
    }
    throw new Error('File paths are only supported in Node.js environments');
  }

  // Buffer -> Blob (for FormData compatibility)
  if (Buffer.isBuffer(input)) {
    return new Blob([input]);
  }

  // Already ReadStream, Blob, or File
  return input;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate methods per input type (uploadFile, uploadBuffer, uploadURL) | Union types + single upload method | OpenAI SDK 4.x (2023) | Better DX, less duplication |
| Manual multipart encoding | Native FormData | Node.js 18 (2022) | Cross-platform, automatic boundary handling |
| form-data npm package | Native FormData | Node.js 18 (2022) | One less dependency, browser compatible |
| Extension-based MIME detection only | Content-based (file-type) + extension | Security best practice (ongoing) | Prevents MIME confusion attacks |
| Reading files into memory (Buffer.from) | Streaming with createReadStream | Established pattern (2015+) | Memory efficiency for large files |
| Pagination with limit/offset | Cursor-based pagination | Modern APIs (2020+) | Better performance for large datasets, but limit/offset still common |

**Deprecated/outdated:**
- **form-data npm package:** Still works, but native FormData in Node 18+ makes it unnecessary for most cases
- **Request body as string for JSON:** Should use `JSON.stringify()` explicitly, not rely on auto-stringification
- **Callbacks for stream handling:** Use async/await and stream promises (util.promisify) instead

## Open Questions

Things that couldn't be fully resolved:

1. **Does the Agno Python SDK have a toFile() helper?**
   - What we know: Python SDK accepts Image/Audio/Video/File types, documentation shows file path usage
   - What's unclear: Whether there's a helper for converting bytes/buffers, or if it's just type aliases
   - Recommendation: Start with simple union types (string | Buffer | ReadStream | Blob), add helper if needed based on user feedback

2. **Should we validate file types (MIME) from buffer content?**
   - What we know: file-type library can detect MIME from buffer magic numbers
   - What's unclear: Whether API validates file types server-side already, if client-side validation adds value
   - Recommendation: Skip client-side validation for Phase 6 (server validates), document as potential v2 enhancement

3. **Optimal chunk size for different file types?**
   - What we know: 64KB-1MB is common recommendation, default is 16KB
   - What's unclear: Whether images/audio/video have different optimal chunk sizes
   - Recommendation: Use default highWaterMark (16KB), let fetch/FormData handle buffering

4. **Should knowledge.upload accept arrays of files for batch upload?**
   - What we know: OpenAPI spec shows single file upload per request
   - What's unclear: Whether batch upload is valuable enough to implement client-side looping
   - Recommendation: Single file per upload for Phase 6 (matches API spec), can add batch helper later

## Sources

### Primary (HIGH confidence)

- [OpenAPI spec](/Users/adamshedivy/Documents/projects/agno-dev/agentos-sdk/openapi.json) - Knowledge endpoints (/knowledge/content, /knowledge/search, /knowledge/config)
- [Existing codebase patterns](/Users/adamshedivy/Documents/projects/agno-dev/agentos-sdk/src/client.ts) - FormData Content-Type removal (Phase 3)
- [Existing codebase patterns](/Users/adamshedivy/Documents/projects/agno-dev/agentos-sdk/src/resources/agents.ts) - FormData construction pattern
- [OpenAI Node SDK](https://github.com/openai/openai-node) - File upload type patterns (fs.createReadStream, toFile helper)
- [Microsoft Azure SDK](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-upload-javascript) - Upload from path, stream, buffer, string patterns
- [Node.js streams documentation](https://nodejs.org/en/learn/modules/backpressuring-in-streams) - Backpressure management
- [FormData manual setting pitfall](https://craft.mirego.com/2022-11-03-you-should-never-set-the-multipart-form-data-content-type-manual ly/) - Why never set Content-Type manually

### Secondary (MEDIUM confidence)

- [REST API pagination patterns](https://www.moesif.com/blog/technical/api-design/REST-API-Design-Filtering-Sorting-and-Pagination/) - Pagination best practices verified across multiple sources
- [formdata-node npm package](https://www.npmjs.com/package/formdata-node) - Cross-platform isomorphic FormData patterns
- [file-type npm package](https://github.com/sindresorhus/file-type) - MIME detection from buffer content
- [Node.js stream memory efficiency](https://medium.com/dev-bits/writing-memory-efficient-software-applications-in-node-js-5575f646b67f) - Memory management best practices
- [Azure AI Search TypeScript SDK](https://learn.microsoft.com/en-us/javascript/api/overview/azure/search-documents-readme?view=azure-node-latest) - Vector search API patterns

### Tertiary (LOW confidence)

- [Agno Python SDK capabilities](https://docs.agno.com) - Multimodal support mentioned but API details not found in docs
- [Agno audio upload example](https://docs.agno.com/integrations/models/native/google/usage/audio-input-file-upload) - Shows file path usage but doesn't specify full type system

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Native Node.js/browser APIs well-documented, OpenAI SDK pattern verified
- Architecture: HIGH - Patterns verified in existing codebase (Phase 3/5), OpenAPI spec confirms API structure
- Pitfalls: HIGH - FormData boundary issue verified by multiple sources, stream memory issues documented by Node.js

**Research date:** 2026-01-31
**Valid until:** ~60 days (file handling APIs are stable, but check for Node.js LTS updates)

**Key decision points for planner:**
1. Use union types (string | Buffer | ReadStream | Blob) for file inputs (FILE-05)
2. Extend RunOptions/StreamRunOptions with images/audio/videos/files arrays (FILE-01 to FILE-04)
3. Create KnowledgeResource with upload (FormData), list (URLSearchParams), search (JSON), getConfig (GET) methods
4. Do NOT add file-type or mime-types dependencies in Phase 6 (nice-to-have, not required)
5. Add normalizeFileInput helper to convert string paths to ReadStream (Node.js environment check)
