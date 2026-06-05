import type { ReadStream } from "node:fs";

/**
 * Flexible file input type supporting multiple formats.
 *
 * - string: File path (Node.js only, read into a File for upload)
 * - Buffer: In-memory binary data (converted to Blob)
 * - ReadStream: Node.js file stream (read into a File via its backing path)
 * - Blob: Browser Blob or Node.js Blob
 * - File: Browser File object
 */
export type FileInput = string | Buffer | ReadStream | Blob | File;

/**
 * Image file input for agent/team/workflow runs.
 * Alias for FileInput with semantic meaning.
 */
export type Image = FileInput;

/**
 * Audio file input for agent/team/workflow runs.
 * Alias for FileInput with semantic meaning.
 */
export type Audio = FileInput;

/**
 * Video file input for agent/team/workflow runs.
 * Alias for FileInput with semantic meaning.
 */
export type Video = FileInput;

/**
 * Generic file input for agent/team/workflow runs.
 * Alias for FileInput with semantic meaning.
 *
 * Note: Named FileType to avoid collision with global File type.
 */
export type FileType = FileInput;
