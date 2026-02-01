import * as fs from "node:fs";
import type { ReadStream } from "node:fs";
import type { FileInput } from "../types/files";

/**
 * Normalize file input to a format suitable for FormData.
 *
 * Handles:
 * - string paths: Converted to ReadStream (Node.js only)
 * - Buffer: Converted to Blob for FormData compatibility
 * - ReadStream/Blob/File: Passed through unchanged
 *
 * @param input - File input in any supported format
 * @param filename - Optional filename for the normalized file
 * @returns Normalized file suitable for FormData.append()
 * @throws Error if string path used in non-Node.js environment
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
): Blob | ReadStream | File {
  // String path -> ReadStream (Node.js only)
  if (typeof input === "string") {
    // Check if fs module is available (Node.js environment)
    if (typeof fs.createReadStream === "function") {
      return fs.createReadStream(input);
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // biome-ignore lint/suspicious/noExplicitAny: Buffer ArrayBufferLike incompatibility workaround
      return new File([input as any], filename);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // biome-ignore lint/suspicious/noExplicitAny: Buffer ArrayBufferLike incompatibility workaround
    return new Blob([input as any]);
  }

  // ReadStream, Blob, or File - pass through unchanged
  return input;
}
