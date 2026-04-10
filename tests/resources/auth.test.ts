import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentOSClient } from "../../src/client";
import { AuthResource } from "../../src/resources/auth";

describe("AuthResource", () => {
  let resource: AuthResource;
  let mockClient: AgentOSClient;
  let requestSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockClient = new AgentOSClient({
      baseUrl: "https://api.example.com",
      apiKey: "test-key",
    });
    requestSpy = vi.fn();
    // biome-ignore lint/suspicious/noExplicitAny: Need to mock public request method for testing
    (mockClient as any).request = requestSpy;
    resource = new AuthResource(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("me()", () => {
    it("returns current user info", async () => {
      const mockMe = { user_id: "user-1", email: "test@example.com" };
      requestSpy.mockResolvedValueOnce(mockMe);

      const result = await resource.me();

      expect(result).toEqual(mockMe);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/auth/me");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Unauthorized"));

      await expect(resource.me()).rejects.toThrow("Unauthorized");
    });
  });

  describe("keys", () => {
    describe("list()", () => {
      it("returns array of API keys", async () => {
        const mockKeys = [
          { id: "key-1", name: "Key One" },
          { id: "key-2", name: "Key Two" },
        ];
        requestSpy.mockResolvedValueOnce(mockKeys);

        const result = await resource.keys.list();

        expect(result).toEqual(mockKeys);
        expect(requestSpy).toHaveBeenCalledWith("GET", "/auth/keys");
        expect(requestSpy).toHaveBeenCalledTimes(1);
      });

      it("returns empty array when no keys exist", async () => {
        requestSpy.mockResolvedValueOnce([]);

        const result = await resource.keys.list();

        expect(result).toEqual([]);
        expect(Array.isArray(result)).toBe(true);
      });

      it("propagates errors from client.request", async () => {
        requestSpy.mockRejectedValueOnce(new Error("Forbidden"));

        await expect(resource.keys.list()).rejects.toThrow("Forbidden");
      });
    });

    describe("create()", () => {
      it("creates a key with name only", async () => {
        const mockResponse = { id: "key-1", name: "My Key", key: "secret-123" };
        requestSpy.mockResolvedValueOnce(mockResponse);

        const result = await resource.keys.create({ name: "My Key" });

        expect(result).toEqual(mockResponse);
        expect(requestSpy).toHaveBeenCalledWith("POST", "/auth/keys", {
          body: JSON.stringify({ name: "My Key" }),
          headers: { "Content-Type": "application/json" },
        });
        expect(requestSpy).toHaveBeenCalledTimes(1);
      });

      it("includes scopes when provided", async () => {
        requestSpy.mockResolvedValueOnce({ id: "key-1" });

        await resource.keys.create({
          name: "Scoped Key",
          scopes: ["agents:read", "agents:run"],
        });

        expect(requestSpy).toHaveBeenCalledWith("POST", "/auth/keys", {
          body: JSON.stringify({
            name: "Scoped Key",
            scopes: ["agents:read", "agents:run"],
          }),
          headers: { "Content-Type": "application/json" },
        });
      });

      it("includes expires_at when provided", async () => {
        requestSpy.mockResolvedValueOnce({ id: "key-1" });

        await resource.keys.create({
          name: "Expiring Key",
          expiresAt: "2025-12-31T23:59:59Z",
        });

        expect(requestSpy).toHaveBeenCalledWith("POST", "/auth/keys", {
          body: JSON.stringify({
            name: "Expiring Key",
            expires_at: "2025-12-31T23:59:59Z",
          }),
          headers: { "Content-Type": "application/json" },
        });
      });

      it("includes all optional fields when provided", async () => {
        requestSpy.mockResolvedValueOnce({ id: "key-1" });

        await resource.keys.create({
          name: "Full Key",
          scopes: ["admin"],
          expiresAt: "2026-01-01T00:00:00Z",
        });

        expect(requestSpy).toHaveBeenCalledWith("POST", "/auth/keys", {
          body: JSON.stringify({
            name: "Full Key",
            scopes: ["admin"],
            expires_at: "2026-01-01T00:00:00Z",
          }),
          headers: { "Content-Type": "application/json" },
        });
      });

      it("propagates errors from client.request", async () => {
        requestSpy.mockRejectedValueOnce(new Error("Bad Request"));

        await expect(
          resource.keys.create({ name: "Bad Key" }),
        ).rejects.toThrow("Bad Request");
      });
    });

    describe("get()", () => {
      it("returns key by ID", async () => {
        const mockKey = { id: "key-1", name: "My Key" };
        requestSpy.mockResolvedValueOnce(mockKey);

        const result = await resource.keys.get("key-1");

        expect(result).toEqual(mockKey);
        expect(requestSpy).toHaveBeenCalledWith("GET", "/auth/keys/key-1");
        expect(requestSpy).toHaveBeenCalledTimes(1);
      });

      it("URL-encodes key ID with slashes", async () => {
        requestSpy.mockResolvedValueOnce({ id: "key/special" });

        await resource.keys.get("key/special");

        expect(requestSpy).toHaveBeenCalledWith(
          "GET",
          "/auth/keys/key%2Fspecial",
        );
      });

      it("URL-encodes key ID with spaces", async () => {
        requestSpy.mockResolvedValueOnce({ id: "my key" });

        await resource.keys.get("my key");

        expect(requestSpy).toHaveBeenCalledWith(
          "GET",
          "/auth/keys/my%20key",
        );
      });

      it("URL-encodes key ID with special characters", async () => {
        requestSpy.mockResolvedValueOnce({ id: "key@123" });

        await resource.keys.get("key@123");

        expect(requestSpy).toHaveBeenCalledWith(
          "GET",
          "/auth/keys/key%40123",
        );
      });

      it("propagates errors from client.request", async () => {
        requestSpy.mockRejectedValueOnce(new Error("Not found"));

        await expect(resource.keys.get("nonexistent")).rejects.toThrow(
          "Not found",
        );
      });
    });

    describe("revoke()", () => {
      it("revokes key by ID", async () => {
        requestSpy.mockResolvedValueOnce(undefined);

        await resource.keys.revoke("key-1");

        expect(requestSpy).toHaveBeenCalledWith("DELETE", "/auth/keys/key-1");
        expect(requestSpy).toHaveBeenCalledTimes(1);
      });

      it("URL-encodes key ID", async () => {
        requestSpy.mockResolvedValueOnce(undefined);

        await resource.keys.revoke("key/special");

        expect(requestSpy).toHaveBeenCalledWith(
          "DELETE",
          "/auth/keys/key%2Fspecial",
        );
      });

      it("propagates errors from client.request", async () => {
        requestSpy.mockRejectedValueOnce(new Error("Forbidden"));

        await expect(resource.keys.revoke("key-1")).rejects.toThrow(
          "Forbidden",
        );
      });
    });

    describe("rotate()", () => {
      it("rotates key and returns new secret", async () => {
        const mockResponse = { id: "key-1", key: "new-secret-456" };
        requestSpy.mockResolvedValueOnce(mockResponse);

        const result = await resource.keys.rotate("key-1");

        expect(result).toEqual(mockResponse);
        expect(requestSpy).toHaveBeenCalledWith(
          "POST",
          "/auth/keys/key-1/rotate",
        );
        expect(requestSpy).toHaveBeenCalledTimes(1);
      });

      it("URL-encodes key ID", async () => {
        requestSpy.mockResolvedValueOnce({ id: "key/special" });

        await resource.keys.rotate("key/special");

        expect(requestSpy).toHaveBeenCalledWith(
          "POST",
          "/auth/keys/key%2Fspecial/rotate",
        );
      });

      it("propagates errors from client.request", async () => {
        requestSpy.mockRejectedValueOnce(new Error("Not found"));

        await expect(resource.keys.rotate("nonexistent")).rejects.toThrow(
          "Not found",
        );
      });
    });
  });

  describe("connections", () => {
    describe("list()", () => {
      it("returns array of connections", async () => {
        const mockConnections = [
          { id: "conn-1", name: "Server A" },
          { id: "conn-2", name: "Server B" },
        ];
        requestSpy.mockResolvedValueOnce(mockConnections);

        const result = await resource.connections.list();

        expect(result).toEqual(mockConnections);
        expect(requestSpy).toHaveBeenCalledWith("GET", "/auth/connections");
        expect(requestSpy).toHaveBeenCalledTimes(1);
      });

      it("returns empty array when no connections exist", async () => {
        requestSpy.mockResolvedValueOnce([]);

        const result = await resource.connections.list();

        expect(result).toEqual([]);
        expect(Array.isArray(result)).toBe(true);
      });

      it("propagates errors from client.request", async () => {
        requestSpy.mockRejectedValueOnce(new Error("Unauthorized"));

        await expect(resource.connections.list()).rejects.toThrow(
          "Unauthorized",
        );
      });
    });

    describe("listAll()", () => {
      it("returns all connections across users", async () => {
        const mockConnections = [
          { id: "conn-1", name: "Server A", user: "admin" },
          { id: "conn-2", name: "Server B", user: "dev" },
        ];
        requestSpy.mockResolvedValueOnce(mockConnections);

        const result = await resource.connections.listAll();

        expect(result).toEqual(mockConnections);
        expect(requestSpy).toHaveBeenCalledWith(
          "GET",
          "/auth/connections/admin/all",
        );
        expect(requestSpy).toHaveBeenCalledTimes(1);
      });

      it("propagates errors from client.request", async () => {
        requestSpy.mockRejectedValueOnce(new Error("Forbidden"));

        await expect(resource.connections.listAll()).rejects.toThrow(
          "Forbidden",
        );
      });
    });

    describe("create()", () => {
      it("creates a connection with required fields", async () => {
        const mockResponse = { id: "conn-1", name: "Production" };
        requestSpy.mockResolvedValueOnce(mockResponse);

        const result = await resource.connections.create({
          name: "Production",
          host: "10.0.1.50",
          port: 8471,
          user: "QUSER",
          password: "secret",
        });

        expect(result).toEqual(mockResponse);
        expect(requestSpy).toHaveBeenCalledWith(
          "POST",
          "/auth/connections",
          {
            body: JSON.stringify({
              name: "Production",
              host: "10.0.1.50",
              port: 8471,
              user: "QUSER",
              password: "secret",
              is_default: false,
            }),
            headers: { "Content-Type": "application/json" },
          },
        );
        expect(requestSpy).toHaveBeenCalledTimes(1);
      });

      it("includes isDefault when provided", async () => {
        requestSpy.mockResolvedValueOnce({ id: "conn-1" });

        await resource.connections.create({
          name: "Default Server",
          host: "192.168.1.1",
          port: 9471,
          user: "ADMIN",
          password: "pass",
          isDefault: true,
        });

        expect(requestSpy).toHaveBeenCalledWith(
          "POST",
          "/auth/connections",
          {
            body: JSON.stringify({
              name: "Default Server",
              host: "192.168.1.1",
              port: 9471,
              user: "ADMIN",
              password: "pass",
              is_default: true,
            }),
            headers: { "Content-Type": "application/json" },
          },
        );
      });

      it("defaults isDefault to false when omitted", async () => {
        requestSpy.mockResolvedValueOnce({ id: "conn-1" });

        await resource.connections.create({
          name: "Server",
          host: "localhost",
          port: 8080,
          user: "user",
          password: "pass",
        });

        const callArgs = requestSpy.mock.calls[0];
        const body = JSON.parse(callArgs[2].body);
        expect(body.is_default).toBe(false);
      });

      it("propagates errors from client.request", async () => {
        requestSpy.mockRejectedValueOnce(new Error("Conflict"));

        await expect(
          resource.connections.create({
            name: "Dup",
            host: "host",
            port: 1,
            user: "u",
            password: "p",
          }),
        ).rejects.toThrow("Conflict");
      });
    });

    describe("get()", () => {
      it("returns connection by ID", async () => {
        const mockConn = { id: "conn-1", name: "Server A" };
        requestSpy.mockResolvedValueOnce(mockConn);

        const result = await resource.connections.get("conn-1");

        expect(result).toEqual(mockConn);
        expect(requestSpy).toHaveBeenCalledWith(
          "GET",
          "/auth/connections/conn-1",
        );
        expect(requestSpy).toHaveBeenCalledTimes(1);
      });

      it("URL-encodes connection ID with slashes", async () => {
        requestSpy.mockResolvedValueOnce({ id: "conn/special" });

        await resource.connections.get("conn/special");

        expect(requestSpy).toHaveBeenCalledWith(
          "GET",
          "/auth/connections/conn%2Fspecial",
        );
      });

      it("URL-encodes connection ID with spaces", async () => {
        requestSpy.mockResolvedValueOnce({ id: "my conn" });

        await resource.connections.get("my conn");

        expect(requestSpy).toHaveBeenCalledWith(
          "GET",
          "/auth/connections/my%20conn",
        );
      });

      it("URL-encodes connection ID with special characters", async () => {
        requestSpy.mockResolvedValueOnce({ id: "conn@123" });

        await resource.connections.get("conn@123");

        expect(requestSpy).toHaveBeenCalledWith(
          "GET",
          "/auth/connections/conn%40123",
        );
      });

      it("propagates errors from client.request", async () => {
        requestSpy.mockRejectedValueOnce(new Error("Not found"));

        await expect(resource.connections.get("nonexistent")).rejects.toThrow(
          "Not found",
        );
      });
    });

    describe("update()", () => {
      it("updates connection with all fields", async () => {
        const mockResponse = { id: "conn-1", name: "Updated" };
        requestSpy.mockResolvedValueOnce(mockResponse);

        const result = await resource.connections.update("conn-1", {
          name: "Updated",
          host: "new-host",
          port: 9999,
          user: "NEW_USER",
          password: "new-pass",
        });

        expect(result).toEqual(mockResponse);
        expect(requestSpy).toHaveBeenCalledWith(
          "PUT",
          "/auth/connections/conn-1",
          {
            body: JSON.stringify({
              name: "Updated",
              host: "new-host",
              port: 9999,
              user: "NEW_USER",
              password: "new-pass",
            }),
            headers: { "Content-Type": "application/json" },
          },
        );
        expect(requestSpy).toHaveBeenCalledTimes(1);
      });

      it("includes only provided fields", async () => {
        requestSpy.mockResolvedValueOnce({ id: "conn-1" });

        await resource.connections.update("conn-1", { name: "Renamed" });

        expect(requestSpy).toHaveBeenCalledWith(
          "PUT",
          "/auth/connections/conn-1",
          {
            body: JSON.stringify({ name: "Renamed" }),
            headers: { "Content-Type": "application/json" },
          },
        );
      });

      it("omits undefined fields from body", async () => {
        requestSpy.mockResolvedValueOnce({ id: "conn-1" });

        await resource.connections.update("conn-1", { port: 443 });

        const callArgs = requestSpy.mock.calls[0];
        const body = JSON.parse(callArgs[2].body);
        expect(body).toEqual({ port: 443 });
        expect(body).not.toHaveProperty("name");
        expect(body).not.toHaveProperty("host");
        expect(body).not.toHaveProperty("user");
        expect(body).not.toHaveProperty("password");
      });

      it("URL-encodes connection ID", async () => {
        requestSpy.mockResolvedValueOnce({ id: "conn/special" });

        await resource.connections.update("conn/special", { name: "X" });

        expect(requestSpy).toHaveBeenCalledWith(
          "PUT",
          "/auth/connections/conn%2Fspecial",
          expect.any(Object),
        );
      });

      it("propagates errors from client.request", async () => {
        requestSpy.mockRejectedValueOnce(new Error("Bad Request"));

        await expect(
          resource.connections.update("conn-1", { name: "" }),
        ).rejects.toThrow("Bad Request");
      });
    });

    describe("delete()", () => {
      it("deletes connection by ID", async () => {
        requestSpy.mockResolvedValueOnce(undefined);

        await resource.connections.delete("conn-1");

        expect(requestSpy).toHaveBeenCalledWith(
          "DELETE",
          "/auth/connections/conn-1",
        );
        expect(requestSpy).toHaveBeenCalledTimes(1);
      });

      it("URL-encodes connection ID", async () => {
        requestSpy.mockResolvedValueOnce(undefined);

        await resource.connections.delete("conn/special");

        expect(requestSpy).toHaveBeenCalledWith(
          "DELETE",
          "/auth/connections/conn%2Fspecial",
        );
      });

      it("propagates errors from client.request", async () => {
        requestSpy.mockRejectedValueOnce(new Error("Not found"));

        await expect(
          resource.connections.delete("nonexistent"),
        ).rejects.toThrow("Not found");
      });
    });

    describe("setDefault()", () => {
      it("sets connection as default", async () => {
        const mockResponse = { id: "conn-1", is_default: true };
        requestSpy.mockResolvedValueOnce(mockResponse);

        const result = await resource.connections.setDefault("conn-1");

        expect(result).toEqual(mockResponse);
        expect(requestSpy).toHaveBeenCalledWith(
          "PUT",
          "/auth/connections/conn-1/default",
        );
        expect(requestSpy).toHaveBeenCalledTimes(1);
      });

      it("URL-encodes connection ID", async () => {
        requestSpy.mockResolvedValueOnce({ id: "conn/special" });

        await resource.connections.setDefault("conn/special");

        expect(requestSpy).toHaveBeenCalledWith(
          "PUT",
          "/auth/connections/conn%2Fspecial/default",
        );
      });

      it("propagates errors from client.request", async () => {
        requestSpy.mockRejectedValueOnce(new Error("Conflict"));

        await expect(
          resource.connections.setDefault("conn-1"),
        ).rejects.toThrow("Conflict");
      });
    });

    describe("test()", () => {
      it("tests connection and returns result", async () => {
        const mockResponse = { success: true, message: "Connection healthy" };
        requestSpy.mockResolvedValueOnce(mockResponse);

        const result = await resource.connections.test("conn-1");

        expect(result).toEqual(mockResponse);
        expect(requestSpy).toHaveBeenCalledWith(
          "POST",
          "/auth/connections/conn-1/test",
        );
        expect(requestSpy).toHaveBeenCalledTimes(1);
      });

      it("returns failure result", async () => {
        const mockResponse = {
          success: false,
          message: "Connection refused",
        };
        requestSpy.mockResolvedValueOnce(mockResponse);

        const result = await resource.connections.test("conn-1");

        expect(result).toEqual(mockResponse);
        expect(result.success).toBe(false);
      });

      it("URL-encodes connection ID", async () => {
        requestSpy.mockResolvedValueOnce({ success: true });

        await resource.connections.test("conn/special");

        expect(requestSpy).toHaveBeenCalledWith(
          "POST",
          "/auth/connections/conn%2Fspecial/test",
        );
      });

      it("propagates errors from client.request", async () => {
        requestSpy.mockRejectedValueOnce(new Error("Timeout"));

        await expect(resource.connections.test("conn-1")).rejects.toThrow(
          "Timeout",
        );
      });
    });
  });
});
