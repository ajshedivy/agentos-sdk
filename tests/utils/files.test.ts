import { type ReadStream, createReadStream } from "node:fs";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeFileInput } from "../../src/utils/files";

describe("normalizeFileInput", () => {
  describe("string path input (Node.js)", () => {
    const testFilePath = path.join(__dirname, "../fixtures/test-file.txt");

    it("reads file path into a File/Blob (not a ReadStream)", () => {
      const result = normalizeFileInput(testFilePath);

      // Must be a Blob/File so web FormData accepts it. A ReadStream would be
      // coerced to the string "[object Object]" by global FormData.
      expect(result).toBeInstanceOf(Blob);
      // biome-ignore lint/suspicious/noExplicitAny: assert it is NOT a stream
      expect((result as any).pipe).toBeUndefined();
    });

    it("preserves the basename as the File name", () => {
      const result = normalizeFileInput(testFilePath);

      if (typeof File !== "undefined") {
        expect(result).toBeInstanceOf(File);
        expect((result as File).name).toBe("test-file.txt");
      }
    });

    it("honors an explicit filename override", () => {
      const result = normalizeFileInput(testFilePath, "renamed.txt");

      if (typeof File !== "undefined") {
        expect((result as File).name).toBe("renamed.txt");
      }
    });

    it("serializes into a multipart file part, not a string field", async () => {
      // Regression: a string path appended to a web FormData must produce a
      // real file part (with filename), not the coerced string "[object Object]".
      const formData = new FormData();
      formData.append("file", normalizeFileInput(testFilePath));

      const value = formData.get("file");
      expect(value).toBeInstanceOf(Blob);
      expect(value).not.toBe("[object Object]");

      // Confirm the wire body carries a filename header (=> UploadFile, not str).
      const body = await new Request("http://test/", {
        method: "POST",
        body: formData,
      }).text();
      expect(body).toContain('filename="test-file.txt"');
      expect(body).not.toContain("[object Object]");
    });
  });

  describe("Buffer input", () => {
    it("converts Buffer to Blob", () => {
      const buffer = Buffer.from("test content");

      const result = normalizeFileInput(buffer);

      expect(result).toBeInstanceOf(Blob);
    });

    it("converts Buffer to File when filename provided and File exists", () => {
      const buffer = Buffer.from("test content");

      const result = normalizeFileInput(buffer, "test.txt");

      // In Node.js 20+, File constructor exists
      if (typeof File !== "undefined") {
        expect(result).toBeInstanceOf(File);
        expect((result as File).name).toBe("test.txt");
      } else {
        expect(result).toBeInstanceOf(Blob);
      }
    });
  });

  describe("Blob input", () => {
    it("passes Blob through unchanged", () => {
      const blob = new Blob(["test content"]);

      const result = normalizeFileInput(blob);

      expect(result).toBe(blob);
    });
  });

  describe("File input", () => {
    it("passes File through unchanged", () => {
      // Skip if File constructor not available
      if (typeof File === "undefined") {
        return;
      }

      const file = new File(["test content"], "test.txt");

      const result = normalizeFileInput(file);

      expect(result).toBe(file);
    });
  });

  describe("ReadStream input", () => {
    const testFilePath = path.join(__dirname, "../fixtures/test-file.txt");

    it("materializes a file-backed ReadStream into a File/Blob (not a stream)", () => {
      const stream = createReadStream(testFilePath);
      const result = normalizeFileInput(stream);

      // The web FormData transport cannot consume a Node stream, so it must be
      // read into a Blob/File. A passed-through stream serializes as
      // "[object Object]" and the server rejects it.
      expect(result).toBeInstanceOf(Blob);
      // biome-ignore lint/suspicious/noExplicitAny: assert it is NOT a stream
      expect((result as any).pipe).toBeUndefined();
      if (typeof File !== "undefined") {
        expect((result as File).name).toBe("test-file.txt");
      }
      stream.destroy();
    });

    it("throws for a ReadStream with no backing file path", () => {
      // e.g. a stream created from a file descriptor has no `.path`.
      const pathless = { pipe: vi.fn() } as unknown as ReadStream;

      expect(() => normalizeFileInput(pathless)).toThrow(
        /without a backing file path/,
      );
    });
  });
});
