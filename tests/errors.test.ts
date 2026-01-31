import { describe, expect, it } from "vitest";
import {
  APIError,
  AuthenticationError,
  BadRequestError,
  InternalServerError,
  NotFoundError,
  RateLimitError,
  RemoteServerUnavailableError,
  UnprocessableEntityError,
  createErrorFromResponse,
} from "../src/errors";

describe("Error Classes", () => {
  describe("APIError", () => {
    it("should have correct properties", () => {
      const error = new APIError(500, "Server error", "req-123");
      expect(error.status).toBe(500);
      expect(error.message).toBe("Server error");
      expect(error.requestId).toBe("req-123");
      expect(error.name).toBe("APIError");
    });

    it("should work with instanceof", () => {
      const error = new APIError(500, "test");
      expect(error instanceof APIError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it("should support optional headers", () => {
      const headers = { "x-request-id": "req-456" };
      const error = new APIError(500, "Server error", "req-456", headers);
      expect(error.headers).toEqual(headers);
    });

    it("should have undefined requestId and headers when not provided", () => {
      const error = new APIError(500, "Server error");
      expect(error.requestId).toBeUndefined();
      expect(error.headers).toBeUndefined();
    });
  });

  describe("BadRequestError", () => {
    it("should have status 400", () => {
      const error = new BadRequestError("Invalid input");
      expect(error.status).toBe(400);
      expect(error.name).toBe("BadRequestError");
    });

    it("should work with instanceof", () => {
      const error = new BadRequestError("Invalid input");
      expect(error instanceof BadRequestError).toBe(true);
      expect(error instanceof APIError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it("should preserve requestId and headers", () => {
      const headers = { "content-type": "application/json" };
      const error = new BadRequestError("Invalid input", "req-001", headers);
      expect(error.requestId).toBe("req-001");
      expect(error.headers).toEqual(headers);
    });
  });

  describe("AuthenticationError", () => {
    it("should have status 401", () => {
      const error = new AuthenticationError("Unauthorized");
      expect(error.status).toBe(401);
      expect(error.name).toBe("AuthenticationError");
    });

    it("should work with instanceof", () => {
      const error = new AuthenticationError("Unauthorized");
      expect(error instanceof AuthenticationError).toBe(true);
      expect(error instanceof APIError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it("should preserve requestId and headers", () => {
      const headers = { "www-authenticate": "Bearer" };
      const error = new AuthenticationError("Unauthorized", "req-002", headers);
      expect(error.requestId).toBe("req-002");
      expect(error.headers).toEqual(headers);
    });
  });

  describe("NotFoundError", () => {
    it("should have status 404", () => {
      const error = new NotFoundError("Resource not found");
      expect(error.status).toBe(404);
      expect(error.name).toBe("NotFoundError");
    });

    it("should work with instanceof", () => {
      const error = new NotFoundError("Resource not found");
      expect(error instanceof NotFoundError).toBe(true);
      expect(error instanceof APIError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it("should preserve requestId and headers", () => {
      const error = new NotFoundError("Resource not found", "req-003");
      expect(error.requestId).toBe("req-003");
    });
  });

  describe("UnprocessableEntityError", () => {
    it("should have status 422", () => {
      const error = new UnprocessableEntityError("Validation failed");
      expect(error.status).toBe(422);
      expect(error.name).toBe("UnprocessableEntityError");
    });

    it("should work with instanceof", () => {
      const error = new UnprocessableEntityError("Validation failed");
      expect(error instanceof UnprocessableEntityError).toBe(true);
      expect(error instanceof APIError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it("should preserve requestId and headers", () => {
      const error = new UnprocessableEntityError(
        "Validation failed",
        "req-004",
      );
      expect(error.requestId).toBe("req-004");
    });
  });

  describe("RateLimitError", () => {
    it("should have status 429", () => {
      const error = new RateLimitError("Too many requests");
      expect(error.status).toBe(429);
      expect(error.name).toBe("RateLimitError");
    });

    it("should work with instanceof", () => {
      const error = new RateLimitError("Too many requests");
      expect(error instanceof RateLimitError).toBe(true);
      expect(error instanceof APIError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it("should preserve requestId and headers", () => {
      const headers = { "retry-after": "60" };
      const error = new RateLimitError("Too many requests", "req-005", headers);
      expect(error.requestId).toBe("req-005");
      expect(error.headers).toEqual(headers);
    });
  });

  describe("InternalServerError", () => {
    it("should have status 500", () => {
      const error = new InternalServerError("Internal server error");
      expect(error.status).toBe(500);
      expect(error.name).toBe("InternalServerError");
    });

    it("should work with instanceof", () => {
      const error = new InternalServerError("Internal server error");
      expect(error instanceof InternalServerError).toBe(true);
      expect(error instanceof APIError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it("should preserve requestId and headers", () => {
      const error = new InternalServerError("Internal server error", "req-006");
      expect(error.requestId).toBe("req-006");
    });
  });

  describe("RemoteServerUnavailableError", () => {
    it("should have status 503", () => {
      const error = new RemoteServerUnavailableError("Service unavailable");
      expect(error.status).toBe(503);
      expect(error.name).toBe("RemoteServerUnavailableError");
    });

    it("should work with instanceof", () => {
      const error = new RemoteServerUnavailableError("Service unavailable");
      expect(error instanceof RemoteServerUnavailableError).toBe(true);
      expect(error instanceof APIError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it("should preserve requestId and headers", () => {
      const headers = { "retry-after": "300" };
      const error = new RemoteServerUnavailableError(
        "Service unavailable",
        "req-007",
        headers,
      );
      expect(error.requestId).toBe("req-007");
      expect(error.headers).toEqual(headers);
    });
  });

  describe("createErrorFromResponse", () => {
    it("should create BadRequestError for 400", () => {
      const error = createErrorFromResponse(400, "Bad request");
      expect(error instanceof BadRequestError).toBe(true);
      expect(error.status).toBe(400);
      expect(error.message).toBe("Bad request");
    });

    it("should create AuthenticationError for 401", () => {
      const error = createErrorFromResponse(401, "Unauthorized");
      expect(error instanceof AuthenticationError).toBe(true);
      expect(error.status).toBe(401);
    });

    it("should create NotFoundError for 404", () => {
      const error = createErrorFromResponse(404, "Not found");
      expect(error instanceof NotFoundError).toBe(true);
      expect(error.status).toBe(404);
    });

    it("should create UnprocessableEntityError for 422", () => {
      const error = createErrorFromResponse(422, "Validation error");
      expect(error instanceof UnprocessableEntityError).toBe(true);
      expect(error.status).toBe(422);
    });

    it("should create RateLimitError for 429", () => {
      const error = createErrorFromResponse(429, "Rate limited");
      expect(error instanceof RateLimitError).toBe(true);
      expect(error.status).toBe(429);
    });

    it("should create InternalServerError for 500", () => {
      const error = createErrorFromResponse(500, "Server error");
      expect(error instanceof InternalServerError).toBe(true);
      expect(error.status).toBe(500);
    });

    it("should create RemoteServerUnavailableError for 503", () => {
      const error = createErrorFromResponse(503, "Service unavailable");
      expect(error instanceof RemoteServerUnavailableError).toBe(true);
      expect(error.status).toBe(503);
    });

    it("should create InternalServerError for other 5xx status codes", () => {
      const error502 = createErrorFromResponse(502, "Bad gateway");
      expect(error502 instanceof InternalServerError).toBe(true);
      expect(error502.status).toBe(500); // InternalServerError always has status 500

      const error504 = createErrorFromResponse(504, "Gateway timeout");
      expect(error504 instanceof InternalServerError).toBe(true);
    });

    it("should create generic APIError for unknown status codes", () => {
      const error = createErrorFromResponse(418, "I am a teapot");
      expect(error instanceof APIError).toBe(true);
      expect(error.constructor.name).toBe("APIError");
      expect(error.status).toBe(418);
      expect(error.message).toBe("I am a teapot");
    });

    it("should create generic APIError for 4xx not explicitly handled", () => {
      const error = createErrorFromResponse(403, "Forbidden");
      expect(error instanceof APIError).toBe(true);
      expect(error.constructor.name).toBe("APIError");
      expect(error.status).toBe(403);
    });

    it("should preserve requestId and headers", () => {
      const headers = { "x-request-id": "req-test" };
      const error = createErrorFromResponse(
        400,
        "Bad request",
        "req-test",
        headers,
      );
      expect(error.requestId).toBe("req-test");
      expect(error.headers).toEqual(headers);
    });
  });

  describe("Error inheritance chain", () => {
    it("should allow catching all API errors with APIError", () => {
      const errors = [
        new BadRequestError("test"),
        new AuthenticationError("test"),
        new NotFoundError("test"),
        new UnprocessableEntityError("test"),
        new RateLimitError("test"),
        new InternalServerError("test"),
        new RemoteServerUnavailableError("test"),
      ];

      for (const error of errors) {
        expect(error instanceof APIError).toBe(true);
        expect(error instanceof Error).toBe(true);
      }
    });

    it("should allow try-catch with instanceof", () => {
      const testError = () => {
        throw new RateLimitError("Too many requests", "req-123");
      };

      expect(() => {
        try {
          testError();
        } catch (e) {
          if (e instanceof RateLimitError) {
            throw new Error(`Caught rate limit error: ${e.requestId}`);
          }
          throw new Error("Wrong error type caught");
        }
      }).toThrow("Caught rate limit error: req-123");
    });
  });
});
