import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  APIError,
  BadRequestError,
  InternalServerError,
  NotFoundError,
  RateLimitError,
} from "../src/errors";
import { request, requestWithRetry } from "../src/http";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("HTTP Module", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("request", () => {
    it("should return JSON for successful response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: "test" }),
        headers: new Headers(),
      });

      const result = await request<{ data: string }>(
        "https://api.test.com/endpoint",
      );
      expect(result).toEqual({ data: "test" });
    });

    it("should handle 204 No Content", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      const result = await request<void>("https://api.test.com/endpoint");
      expect(result).toBeUndefined();
    });

    it("should throw BadRequestError for 400", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: "Invalid input" }),
        headers: new Headers({ "x-request-id": "req-123" }),
      });

      await expect(request("https://api.test.com/endpoint")).rejects.toThrow(
        BadRequestError,
      );
    });

    it("should throw NotFoundError for 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: "Not found" }),
        headers: new Headers(),
      });

      await expect(request("https://api.test.com/endpoint")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("should include requestId in error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: "Server error" }),
        headers: new Headers({ "x-request-id": "req-456" }),
      });

      try {
        await request("https://api.test.com/endpoint");
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerError);
        expect((error as APIError).requestId).toBe("req-456");
      }
    });

    it("should handle non-JSON error responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("Not JSON")),
        text: () => Promise.resolve("Internal Server Error"),
        statusText: "Internal Server Error",
        headers: new Headers(),
      });

      await expect(request("https://api.test.com/endpoint")).rejects.toThrow(
        InternalServerError,
      );
    });

    it("should handle error response with error field", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Something went wrong" }),
        headers: new Headers(),
      });

      try {
        await request("https://api.test.com/endpoint");
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError);
        expect((error as BadRequestError).message).toBe("Something went wrong");
      }
    });

    it("should handle error response with nested error.message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({ error: { message: "Nested error message" } }),
        headers: new Headers(),
      });

      try {
        await request("https://api.test.com/endpoint");
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError);
        expect((error as BadRequestError).message).toBe("Nested error message");
      }
    });

    it("should handle error response with detail field", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: () => Promise.resolve({ detail: "Validation failed" }),
        headers: new Headers(),
      });

      try {
        await request("https://api.test.com/endpoint");
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).message).toBe("Validation failed");
      }
    });

    it("should send JSON body correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
        headers: new Headers(),
      });

      await request("https://api.test.com/endpoint", {
        method: "POST",
        body: { name: "test" },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.test.com/endpoint",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "test" }),
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("should include custom headers", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
        headers: new Headers(),
      });

      await request("https://api.test.com/endpoint", {
        headers: { Authorization: "Bearer token123" },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.test.com/endpoint",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer token123",
          }),
        }),
      );
    });
  });

  describe("requestWithRetry", () => {
    it("should retry on 500 errors", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ message: "Server error" }),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: "success" }),
          headers: new Headers(),
        });

      const result = await requestWithRetry<{ data: string }>(
        "https://api.test.com/endpoint",
        {},
        2,
        5000,
      );

      expect(result).toEqual({ data: "success" });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should NOT retry on 400 errors", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: "Bad request" }),
        headers: new Headers(),
      });

      await expect(
        requestWithRetry("https://api.test.com/endpoint", {}, 2, 5000),
      ).rejects.toThrow(BadRequestError);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should NOT retry on 404 errors", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: "Not found" }),
        headers: new Headers(),
      });

      await expect(
        requestWithRetry("https://api.test.com/endpoint", {}, 2, 5000),
      ).rejects.toThrow(NotFoundError);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should retry on network errors", async () => {
      mockFetch
        .mockRejectedValueOnce(new TypeError("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: "recovered" }),
          headers: new Headers(),
        });

      const result = await requestWithRetry<{ data: string }>(
        "https://api.test.com/endpoint",
        {},
        2,
        5000,
      );

      expect(result).toEqual({ data: "recovered" });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should retry on 429 rate limit errors", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: () => Promise.resolve({ message: "Rate limited" }),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: "success after rate limit" }),
          headers: new Headers(),
        });

      const result = await requestWithRetry<{ data: string }>(
        "https://api.test.com/endpoint",
        {},
        2,
        5000,
      );

      expect(result).toEqual({ data: "success after rate limit" });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should throw RateLimitError after exhausting retries on 429", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ message: "Rate limited" }),
        headers: new Headers(),
      });

      await expect(
        requestWithRetry("https://api.test.com/endpoint", {}, 1, 5000),
      ).rejects.toThrow(RateLimitError);

      // numOfAttempts = maxRetries + 1 = 2
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should throw InternalServerError after exhausting retries on 500", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: "Server error" }),
        headers: new Headers(),
      });

      await expect(
        requestWithRetry("https://api.test.com/endpoint", {}, 1, 5000),
      ).rejects.toThrow(InternalServerError);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should throw APIError after exhausting retries on network error", async () => {
      mockFetch.mockRejectedValue(new TypeError("Network error"));

      await expect(
        requestWithRetry("https://api.test.com/endpoint", {}, 1, 5000),
      ).rejects.toThrow(APIError);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should throw APIError on timeout", async () => {
      // Simulate a request that takes too long
      mockFetch.mockImplementation(() => {
        return new Promise((_, reject) => {
          const error = new Error("The operation was aborted");
          error.name = "AbortError";
          reject(error);
        });
      });

      await expect(
        requestWithRetry("https://api.test.com/endpoint", {}, 0, 100),
      ).rejects.toThrow(APIError);
    });
  });
});
