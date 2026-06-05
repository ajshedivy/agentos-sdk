import * as fs from "node:fs";
import type { ReadStream } from "node:fs";
import * as path from "node:path";
import type { FileInput } from "../types/files";

/**
 * Read a file from disk into a File (or Blob when the File constructor is
 * unavailable). The basename is preserved as the multipart filename so the
 * server can detect the content type from the extension.
 */
function readPathToFile(p: fs.PathLike, filename?: string): Blob | File {
  const data = fs.readFileSync(p);
  const name = filename ?? path.basename(String(p));
  if (typeof File !== "undefined") {
    // biome-ignore lint/suspicious/noExplicitAny: Buffer ArrayBufferLike incompatibility workaround
    return new File([data as any], name);
  }
  // biome-ignore lint/suspicious/noExplicitAny: Buffer ArrayBufferLike incompatibility workaround
  return new Blob([data as any]);
}

/**
 * Normalize file input to a format suitable for FormData.
 *
 * Handles:
 * - string paths: Read into a File/Blob (Node.js only)
 * - Buffer: Converted to Blob/File for FormData compatibility
 * - ReadStream: Read into a File/Blob via its backing path (Node.js only)
 * - Blob/File: Passed through unchanged
 *
 * Uploads are transported via the global (web) FormData + fetch, which only
 * accept Blob/File values. A Node ReadStream appended to a web FormData is
 * coerced to the string "[object Object]", so the server would receive a
 * string instead of a file (FastAPI: "Expected UploadFile, received: str").
 * String paths and ReadStreams are therefore read into a File so they
 * serialize as a real multipart file part.
 *
 * @param input - File input in any supported format
 * @param filename - Optional filename for the normalized file
 * @returns Normalized file suitable for FormData.append()
 * @throws Error if a string path / ReadStream is used outside Node.js, or if a
 *   ReadStream has no backing file path (read into a Buffer/Blob first instead).
 *
 * @example Node.js with file path
 * ```typescript
 * const normalized = normalizeFileInput('/path/to/image.png');
 * formData.append('images', normalized);
 * ```
 *
 * @example Buffer input
 * ```typescript
 * const buffer = fs.readFileSync('image.png');
 * const normalized = normalizeFileInput(buffer, 'image.png');
 * formData.append('images', normalized);
 * ```
 */
export function normalizeFileInput(
  input: FileInput,
  filename?: string,
): Blob | File {
  // String path -> File/Blob (Node.js only). A ReadStream is NOT compatible
  // with the web FormData/fetch transport, so read the file and preserve its
  // basename as the multipart filename (the server uses it to detect type).
  if (typeof input === "string") {
    // Check if fs module is available (Node.js environment)
    if (typeof fs.readFileSync === "function") {
      return readPathToFile(input, filename);
    }
    throw new Error(
      "File paths are only supported in Node.js environments. " +
        "In browser environments, use File or Blob instead.",
    );
  }

  // Buffer -> Blob (for FormData compatibility)
  if (Buffer.isBuffer(input)) {
    // Create Blob with optional filename via File constructor if available
    // Note: Buffer extends Uint8Array, safe to use in Blob/File constructors
    if (filename && typeof File !== "undefined") {
      // biome-ignore lint/suspicious/noExplicitAny: Buffer ArrayBufferLike incompatibility workaround
      return new File([input as any], filename);
    }
    // biome-ignore lint/suspicious/noExplicitAny: Buffer ArrayBufferLike incompatibility workaround
    return new Blob([input as any]);
  }

  // Blob/File are already FormData-compatible -> pass through unchanged.
  if (typeof Blob !== "undefined" && input instanceof Blob) {
    return input;
  }

  // Node ReadStream -> read its backing file (same reason as string paths: the
  // web FormData/fetch transport cannot consume a Node stream). A stream
  // created from a file descriptor has no `.path` and cannot be read here, so
  // fail loudly rather than silently uploading a corrupt "[object Object]" part.
  const streamPath = (input as ReadStream).path;
  if (streamPath != null && typeof fs.readFileSync === "function") {
    return readPathToFile(streamPath, filename);
  }
  throw new Error(
    "Unsupported file input: a ReadStream without a backing file path cannot " +
      "be uploaded. Pass a file path string, Buffer, Blob, or File instead.",
  );
}
