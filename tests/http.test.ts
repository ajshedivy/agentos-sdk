import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  APIError,
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
  RateLimitError,
} from "../src/errors";
import { parseErrorBody, request, requestWithRetry } from "../src/http";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

/**
 * Build a real Response for the error path. parseErrorBody consumes the body
 * exactly once, so mocks that only stub `json()` would not exercise it.
 */
function errorResponse(
  status: number,
  body: unknown,
  init: { headers?: Record<string, string>; statusText?: string } = {},
): Response {
  return new Response(
    typeof body === "string" ? body : JSON.stringify(body),
    { status, ...init },
  );
}

describe("HTTP Module", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("parseErrorBody", () => {
    it("returns error_id and error_type from an agno 3.0 error body", async () => {
      const response = errorResponse(500, {
        detail: "Database schema is out of date",
        error_id: "migration_required_error",
        error_type: "MigrationRequiredError",
      });

      await expect(parseErrorBody(response)).resolves.toEqual({
        message: "Database schema is out of date",
        errorId: "migration_required_error",
        errorType: "MigrationRequiredError",
      });
    });

    it("leaves errorId and errorType undefined for a plain {detail} body", async () => {
      const parsed = await parseErrorBody(
        errorResponse(404, { detail: "Not found" }),
      );
      expect(parsed).toEqual({ message: "Not found" });
      expect(parsed.errorId).toBeUndefined();
      expect(parsed.errorType).toBeUndefined();
    });

    it("ignores non-string error_id / error_type", async () => {
      await expect(
        parseErrorBody(
          errorResponse(500, { detail: "x", error_id: 42, error_type: null }),
        ),
      ).resolves.toEqual({ message: "x" });
    });

    it("uses the raw text when the body is not JSON", async () => {
      await expect(
        parseErrorBody(errorResponse(500, "Internal Server Error")),
      ).resolves.toEqual({ message: "Internal Server Error" });
    });

    it("stringifies a JSON body without a recognised message field", async () => {
      await expect(
        parseErrorBody(errorResponse(500, { foo: "bar" })),
      ).resolves.toEqual({ message: '{"foo":"bar"}' });
    });

    it("falls back to statusText, then HTTP <status>, for an empty body", async () => {
      await expect(
        parseErrorBody(errorResponse(502, "", { statusText: "Bad Gateway" })),
      ).resolves.toEqual({ message: "Bad Gateway" });
      await expect(parseErrorBody(errorResponse(502, ""))).resolves.toEqual({
        message: "HTTP 502",
      });
    });
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
      mockFetch.mockResolvedValueOnce(
        errorResponse(
          400,
          { message: "Invalid input" },
          { headers: { "x-request-id": "req-123" } },
        ),
      );

      await expect(request("https://api.test.com/endpoint")).rejects.toThrow(
        BadRequestError,
      );
    });

    it("should throw NotFoundError for 404", async () => {
      mockFetch.mockResolvedValueOnce(
        errorResponse(404, { message: "Not found" }),
      );

      await expect(request("https://api.test.com/endpoint")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("should include requestId in error", async () => {
      mockFetch.mockResolvedValueOnce(
        errorResponse(
          500,
          { message: "Server error" },
          { headers: { "x-request-id": "req-456" } },
        ),
      );

      await expect(
        request("https://api.test.com/endpoint"),
      ).rejects.toMatchObject({
        name: "InternalServerError",
        requestId: "req-456",
      });
    });

    it("should handle non-JSON error responses", async () => {
      mockFetch.mockResolvedValueOnce(
        errorResponse(500, "Internal Server Error", {
          statusText: "Internal Server Error",
        }),
      );

      await expect(
        request("https://api.test.com/endpoint"),
      ).rejects.toMatchObject({
        name: "InternalServerError",
        message: "Internal Server Error",
      });
    });

    it("should handle error response with error field", async () => {
      mockFetch.mockResolvedValueOnce(
        errorResponse(400, { error: "Something went wrong" }),
      );

      await expect(
        request("https://api.test.com/endpoint"),
      ).rejects.toMatchObject({
        name: "BadRequestError",
        message: "Something went wrong",
      });
    });

    it("should handle error response with nested error.message", async () => {
      mockFetch.mockResolvedValueOnce(
        errorResponse(400, { error: { message: "Nested error message" } }),
      );

      await expect(
        request("https://api.test.com/endpoint"),
      ).rejects.toMatchObject({
        name: "BadRequestError",
        message: "Nested error message",
      });
    });

    it("should handle error response with detail field", async () => {
      mockFetch.mockResolvedValueOnce(
        errorResponse(422, { detail: "Validation failed" }),
      );

      await expect(
        request("https://api.test.com/endpoint"),
      ).rejects.toMatchObject({
        name: "UnprocessableEntityError",
        message: "Validation failed",
      });
    });

    it("surfaces error_id / error_type from a 500 agno 3.0 body", async () => {
      mockFetch.mockResolvedValueOnce(
        errorResponse(500, {
          detail: "Failed to migrate database: schema is out of date",
          error_id: "migration_required_error",
          error_type: "MigrationRequiredError",
        }),
      );

      await expect(
        request("https://api.test.com/endpoint"),
      ).rejects.toMatchObject({
        name: "InternalServerError",
        status: 500,
        message: "Failed to migrate database: schema is out of date",
        errorId: "migration_required_error",
        errorType: "MigrationRequiredError",
      });
    });

    it("leaves errorId undefined for a plain {detail} 404 body", async () => {
      mockFetch.mockResolvedValueOnce(
        errorResponse(404, { detail: "Not found" }),
      );

      try {
        await request("https://api.test.com/endpoint");
        expect.unreachable("request should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
        expect((error as APIError).errorId).toBeUndefined();
        expect((error as APIError).errorType).toBeUndefined();
      }
    });

    it("should throw ConflictError for 409", async () => {
      mockFetch.mockResolvedValueOnce(
        errorResponse(409, { detail: "Run is not paused" }),
      );

      await expect(request("https://api.test.com/endpoint")).rejects.toThrow(
        ConflictError,
      );
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

    it("should not re-stringify an already-serialized string body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
        headers: new Headers(),
      });

      // Resource methods pre-serialize their bodies and pass a string.
      const serialized = JSON.stringify({ name: "test" });
      await request("https://api.test.com/endpoint", {
        method: "POST",
        body: serialized,
      });

      const sentBody = mockFetch.mock.calls[0][1].body as string;
      // Sent verbatim, not wrapped in another layer of JSON quoting.
      expect(sentBody).toBe(serialized);
      // A single parse yields the object the server expects (not a string).
      expect(JSON.parse(sentBody)).toEqual({ name: "test" });
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
        .mockResolvedValueOnce(errorResponse(500, { message: "Server error" }))
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
      mockFetch.mockImplementation(() =>
        Promise.resolve(errorResponse(400, { message: "Bad request" })),
      );

      await expect(
        requestWithRetry("https://api.test.com/endpoint", {}, 2, 5000),
      ).rejects.toThrow(BadRequestError);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should NOT retry on 404 errors", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve(errorResponse(404, { message: "Not found" })),
      );

      await expect(
        requestWithRetry("https://api.test.com/endpoint", {}, 2, 5000),
      ).rejects.toThrow(NotFoundError);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should NOT retry on 409 errors", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve(
          errorResponse(409, { detail: "Idempotency key reused" }),
        ),
      );

      await expect(
        requestWithRetry("https://api.test.com/endpoint", {}, 2, 5000),
      ).rejects.toThrow(ConflictError);

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
        .mockResolvedValueOnce(errorResponse(429, { message: "Rate limited" }))
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
      mockFetch.mockImplementation(() =>
        Promise.resolve(errorResponse(429, { message: "Rate limited" })),
      );

      await expect(
        requestWithRetry("https://api.test.com/endpoint", {}, 1, 5000),
      ).rejects.toThrow(RateLimitError);

      // numOfAttempts = maxRetries + 1 = 2
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should throw InternalServerError after exhausting retries on 500", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve(errorResponse(500, { message: "Server error" })),
      );

      await expect(
        requestWithRetry("https://api.test.com/endpoint", {}, 1, 5000),
      ).rejects.toThrow(InternalServerError);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("keeps errorId on the error thrown after exhausting retries", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve(
          errorResponse(500, {
            detail: "Database schema is out of date",
            error_id: "migration_required_error",
            error_type: "MigrationRequiredError",
          }),
        ),
      );

      await expect(
        requestWithRetry("https://api.test.com/endpoint", {}, 1, 5000),
      ).rejects.toMatchObject({
        name: "InternalServerError",
        errorId: "migration_required_error",
        errorType: "MigrationRequiredError",
      });

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
