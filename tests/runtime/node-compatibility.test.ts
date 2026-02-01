/**
 * Node.js Runtime Compatibility Tests
 *
 * Verifies that Node.js 18+ native APIs required by the SDK are available
 * and functional. These tests ensure the SDK works correctly in supported
 * Node.js environments.
 */

import { describe, it, expect } from "vitest";
import { Readable } from "node:stream";
import { readFile, createReadStream } from "node:fs";

describe("Node.js Runtime Compatibility", () => {
  describe("Fetch API (Node 18 experimental, stable in Node 21+)", () => {
    it("should have fetch function available", () => {
      expect(fetch).toBeDefined();
      expect(typeof fetch).toBe("function");
    });

    it("should have Response constructor available", () => {
      expect(Response).toBeDefined();
      expect(typeof Response).toBe("function");
    });

    it("should have Request constructor available", () => {
      expect(Request).toBeDefined();
      expect(typeof Request).toBe("function");
    });

    it("should have Headers constructor available", () => {
      expect(Headers).toBeDefined();
      expect(typeof Headers).toBe("function");
    });

    it("should be able to create a Response object", () => {
      const response = new Response("test body", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });
  });

  describe("FormData API (Node 18+)", () => {
    it("should have FormData constructor available", () => {
      expect(FormData).toBeDefined();
      expect(typeof FormData).toBe("function");
    });

    it("should be able to append string values to FormData", () => {
      const formData = new FormData();
      formData.append("key", "value");
      expect(formData.get("key")).toBe("value");
    });

    it("should be able to append Blob to FormData", () => {
      const formData = new FormData();
      const blob = new Blob(["test content"], { type: "text/plain" });
      formData.append("file", blob, "test.txt");
      expect(formData.get("file")).toBeInstanceOf(Blob);
    });
  });

  describe("Streams API for SSE (Node 18+)", () => {
    it("should have ReadableStream constructor available", () => {
      expect(ReadableStream).toBeDefined();
      expect(typeof ReadableStream).toBe("function");
    });

    it("should have TextDecoderStream available for SSE parsing", () => {
      expect(TextDecoderStream).toBeDefined();
      expect(typeof TextDecoderStream).toBe("function");
    });

    it("should support async iteration over ReadableStream", async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("chunk1\n"));
          controller.enqueue(new TextEncoder().encode("chunk2\n"));
          controller.close();
        },
      });

      const chunks: string[] = [];
      const reader = stream.pipeThrough(new TextDecoderStream()).getReader();

      let result;
      while (!(result = await reader.read()).done) {
        chunks.push(result.value);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join("")).toContain("chunk1");
      expect(chunks.join("")).toContain("chunk2");
    });
  });

  describe("Buffer and Blob conversion (Node.js specific)", () => {
    it("should have Buffer.isBuffer available", () => {
      expect(Buffer.isBuffer).toBeDefined();
      expect(typeof Buffer.isBuffer).toBe("function");
    });

    it("should be able to convert Buffer to Blob", () => {
      const buffer = Buffer.from("test content", "utf-8");
      expect(Buffer.isBuffer(buffer)).toBe(true);

      // Convert Buffer to Blob (used in file handling)
      const blob = new Blob([buffer], { type: "text/plain" });
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBe(buffer.length);
    });

    it("should be able to create File from Buffer", () => {
      const buffer = Buffer.from("test content", "utf-8");
      const file = new File([buffer], "test.txt", { type: "text/plain" });
      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe("test.txt");
      expect(file.size).toBe(buffer.length);
    });
  });

  describe("File System module (Node.js specific)", () => {
    it("should have fs.createReadStream available", () => {
      expect(createReadStream).toBeDefined();
      expect(typeof createReadStream).toBe("function");
    });

    it("should have fs.readFile available", () => {
      expect(readFile).toBeDefined();
      expect(typeof readFile).toBe("function");
    });

    it("should be able to create a readable stream from Node.js stream module", () => {
      const readable = new Readable({
        read() {
          this.push("test data");
          this.push(null);
        },
      });
      expect(readable).toBeDefined();
      expect(typeof readable.read).toBe("function");
    });
  });

  describe("AbortController and AbortSignal (Node 18+)", () => {
    it("should have AbortController constructor available", () => {
      expect(AbortController).toBeDefined();
      expect(typeof AbortController).toBe("function");
    });

    it("should be able to create and use AbortController", () => {
      const controller = new AbortController();
      expect(controller).toBeInstanceOf(AbortController);
      expect(controller.signal).toBeInstanceOf(AbortSignal);
      expect(controller.signal.aborted).toBe(false);

      controller.abort();
      expect(controller.signal.aborted).toBe(true);
    });

    it("should have AbortSignal.timeout available (Node 18+)", () => {
      expect(AbortSignal.timeout).toBeDefined();
      expect(typeof AbortSignal.timeout).toBe("function");
    });

    it("should be able to create timeout signal", () => {
      const signal = AbortSignal.timeout(1000);
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal.aborted).toBe(false);
    });

    it("should abort timeout signal after delay", async () => {
      const signal = AbortSignal.timeout(10);
      expect(signal.aborted).toBe(false);

      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(signal.aborted).toBe(true);
    });
  });

  describe("Blob API (Node 18+)", () => {
    it("should have Blob constructor available", () => {
      expect(Blob).toBeDefined();
      expect(typeof Blob).toBe("function");
    });

    it("should be able to create and use Blob", () => {
      const blob = new Blob(["test content"], { type: "text/plain" });
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
      expect(blob.type).toBe("text/plain");
    });

    it("should have File constructor available (extends Blob)", () => {
      expect(File).toBeDefined();
      expect(typeof File).toBe("function");
    });

    it("should be able to create File objects", () => {
      const file = new File(["test content"], "test.txt", {
        type: "text/plain",
      });
      expect(file).toBeInstanceOf(File);
      expect(file).toBeInstanceOf(Blob);
      expect(file.name).toBe("test.txt");
    });
  });
});
