import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentOSClient } from "../../src/client";
import { ComponentsResource } from "../../src/resources/components";

describe("ComponentsResource", () => {
  let resource: ComponentsResource;
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
    resource = new ComponentsResource(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("list()", () => {
    it("calls GET /components with no params when options omitted", async () => {
      const mockResponse = {
        data: [],
        meta: { total: 0, page: 1, limit: 20 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      const result = await resource.list();

      expect(result).toEqual(mockResponse);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/components");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("adds component_type query param", async () => {
      requestSpy.mockResolvedValueOnce({ data: [] });

      await resource.list({ componentType: "agent" });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/components?component_type=agent",
      );
    });

    it("adds page and limit query params", async () => {
      requestSpy.mockResolvedValueOnce({ data: [] });

      await resource.list({ page: 2, limit: 10 });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/components?page=2&limit=10",
      );
    });

    it("combines all query params", async () => {
      requestSpy.mockResolvedValueOnce({ data: [] });

      await resource.list({ componentType: "team", page: 3, limit: 5 });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/components?component_type=team&page=3&limit=5",
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Network error"));

      await expect(resource.list()).rejects.toThrow("Network error");
    });
  });

  describe("create()", () => {
    it("sends POST /components with JSON body", async () => {
      const mockComponent = { component_id: "comp-1", name: "My Agent" };
      requestSpy.mockResolvedValueOnce(mockComponent);

      const result = await resource.create({
        name: "My Agent",
        componentType: "agent",
      });

      expect(result).toEqual(mockComponent);
      expect(requestSpy).toHaveBeenCalledTimes(1);
      expect(requestSpy).toHaveBeenCalledWith("POST", "/components", {
        body: expect.any(String),
        headers: { "Content-Type": "application/json" },
      });

      const body = JSON.parse(requestSpy.mock.calls[0][2].body);
      expect(body.name).toBe("My Agent");
      expect(body.component_type).toBe("agent");
      expect(body.stage).toBe("draft");
      expect(body.set_current).toBe(true);
    });

    it("includes optional fields when provided", async () => {
      requestSpy.mockResolvedValueOnce({ component_id: "comp-1" });

      await resource.create({
        name: "Custom Agent",
        componentType: "agent",
        componentId: "custom-id",
        description: "A custom agent",
        metadata: { version: "1.0" },
        config: { model: "gpt-4" },
        label: "stable",
        stage: "published",
        notes: "Initial release",
        setCurrent: false,
      });

      const body = JSON.parse(requestSpy.mock.calls[0][2].body);
      expect(body.component_id).toBe("custom-id");
      expect(body.description).toBe("A custom agent");
      expect(body.metadata).toEqual({ version: "1.0" });
      expect(body.config).toEqual({ model: "gpt-4" });
      expect(body.label).toBe("stable");
      expect(body.stage).toBe("published");
      expect(body.notes).toBe("Initial release");
      expect(body.set_current).toBe(false);
    });

    it("does not include optional fields when not provided", async () => {
      requestSpy.mockResolvedValueOnce({ component_id: "comp-1" });

      await resource.create({
        name: "Minimal",
        componentType: "workflow",
      });

      const body = JSON.parse(requestSpy.mock.calls[0][2].body);
      expect(body).not.toHaveProperty("component_id");
      expect(body).not.toHaveProperty("description");
      expect(body).not.toHaveProperty("metadata");
      expect(body).not.toHaveProperty("config");
      expect(body).not.toHaveProperty("label");
      expect(body).not.toHaveProperty("notes");
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Validation error"));

      await expect(
        resource.create({ name: "Bad", componentType: "agent" }),
      ).rejects.toThrow("Validation error");
    });
  });

  describe("get()", () => {
    it("calls GET /components/{component_id}", async () => {
      const mockComponent = { component_id: "comp-1", name: "My Agent" };
      requestSpy.mockResolvedValueOnce(mockComponent);

      const result = await resource.get("comp-1");

      expect(result).toEqual(mockComponent);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/components/comp-1");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes component ID with forward slash", async () => {
      requestSpy.mockResolvedValueOnce({ component_id: "comp/special" });

      await resource.get("comp/special");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/components/comp%2Fspecial",
      );
    });

    it("URL-encodes component ID with space", async () => {
      requestSpy.mockResolvedValueOnce({ component_id: "my component" });

      await resource.get("my component");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/components/my%20component",
      );
    });

    it("URL-encodes component ID with @ symbol", async () => {
      requestSpy.mockResolvedValueOnce({ component_id: "comp@123" });

      await resource.get("comp@123");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/components/comp%40123",
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Not found"));

      await expect(resource.get("nonexistent")).rejects.toThrow("Not found");
    });
  });

  describe("update()", () => {
    it("sends PATCH /components/{component_id} with JSON body", async () => {
      const mockComponent = { component_id: "comp-1", name: "Updated" };
      requestSpy.mockResolvedValueOnce(mockComponent);

      const result = await resource.update("comp-1", { name: "Updated" });

      expect(result).toEqual(mockComponent);
      expect(requestSpy).toHaveBeenCalledTimes(1);
      expect(requestSpy).toHaveBeenCalledWith(
        "PATCH",
        "/components/comp-1",
        {
          body: expect.any(String),
          headers: { "Content-Type": "application/json" },
        },
      );

      const body = JSON.parse(requestSpy.mock.calls[0][2].body);
      expect(body.name).toBe("Updated");
    });

    it("maps all camelCase options to snake_case body fields", async () => {
      requestSpy.mockResolvedValueOnce({ component_id: "comp-1" });

      await resource.update("comp-1", {
        name: "Renamed",
        componentType: "team",
        description: "Updated description",
        metadata: { key: "value" },
      });

      const body = JSON.parse(requestSpy.mock.calls[0][2].body);
      expect(body.name).toBe("Renamed");
      expect(body.component_type).toBe("team");
      expect(body.description).toBe("Updated description");
      expect(body.metadata).toEqual({ key: "value" });
    });

    it("only includes defined fields in body", async () => {
      requestSpy.mockResolvedValueOnce({ component_id: "comp-1" });

      await resource.update("comp-1", { description: "Only description" });

      const body = JSON.parse(requestSpy.mock.calls[0][2].body);
      expect(body).toEqual({ description: "Only description" });
    });

    it("URL-encodes component ID", async () => {
      requestSpy.mockResolvedValueOnce({ component_id: "comp/special" });

      await resource.update("comp/special", { name: "X" });

      expect(requestSpy).toHaveBeenCalledWith(
        "PATCH",
        "/components/comp%2Fspecial",
        expect.any(Object),
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Forbidden"));

      await expect(
        resource.update("comp-1", { name: "X" }),
      ).rejects.toThrow("Forbidden");
    });
  });

  describe("delete()", () => {
    it("sends DELETE /components/{component_id}", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete("comp-1");

      expect(requestSpy).toHaveBeenCalledWith("DELETE", "/components/comp-1");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes component ID", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete("comp/special");

      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/components/comp%2Fspecial",
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Not found"));

      await expect(resource.delete("nonexistent")).rejects.toThrow("Not found");
    });
  });

  describe("listConfigs()", () => {
    it("calls GET /components/{component_id}/configs", async () => {
      const mockConfigs = [
        { version: 1, config: { model: "gpt-4" } },
        { version: 2, config: { model: "gpt-4o" } },
      ];
      requestSpy.mockResolvedValueOnce(mockConfigs);

      const result = await resource.listConfigs("comp-1");

      expect(result).toEqual(mockConfigs);
      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/components/comp-1/configs",
      );
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes component ID", async () => {
      requestSpy.mockResolvedValueOnce([]);

      await resource.listConfigs("comp/special");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/components/comp%2Fspecial/configs",
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Not found"));

      await expect(resource.listConfigs("nonexistent")).rejects.toThrow(
        "Not found",
      );
    });
  });

  describe("createConfig()", () => {
    it("sends POST /components/{component_id}/configs with JSON body", async () => {
      const mockConfig = { version: 1, config: { model: "gpt-4" } };
      requestSpy.mockResolvedValueOnce(mockConfig);

      const result = await resource.createConfig("comp-1", {
        config: { model: "gpt-4" },
      });

      expect(result).toEqual(mockConfig);
      expect(requestSpy).toHaveBeenCalledTimes(1);
      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/components/comp-1/configs",
        {
          body: expect.any(String),
          headers: { "Content-Type": "application/json" },
        },
      );

      const body = JSON.parse(requestSpy.mock.calls[0][2].body);
      expect(body.config).toEqual({ model: "gpt-4" });
      expect(body.stage).toBe("draft");
      expect(body.set_current).toBe(true);
    });

    it("includes optional fields when provided", async () => {
      requestSpy.mockResolvedValueOnce({ version: 2 });

      await resource.createConfig("comp-1", {
        config: { model: "gpt-4o" },
        version: 2,
        label: "stable",
        stage: "published",
        notes: "Upgraded model",
        links: [{ child_id: "tool-1" }],
        setCurrent: false,
      });

      const body = JSON.parse(requestSpy.mock.calls[0][2].body);
      expect(body.version).toBe(2);
      expect(body.label).toBe("stable");
      expect(body.stage).toBe("published");
      expect(body.notes).toBe("Upgraded model");
      expect(body.links).toEqual([{ child_id: "tool-1" }]);
      expect(body.set_current).toBe(false);
    });

    it("does not include optional fields when not provided", async () => {
      requestSpy.mockResolvedValueOnce({ version: 1 });

      await resource.createConfig("comp-1", {
        config: { key: "value" },
      });

      const body = JSON.parse(requestSpy.mock.calls[0][2].body);
      expect(body).not.toHaveProperty("version");
      expect(body).not.toHaveProperty("label");
      expect(body).not.toHaveProperty("notes");
      expect(body).not.toHaveProperty("links");
    });

    it("URL-encodes component ID", async () => {
      requestSpy.mockResolvedValueOnce({ version: 1 });

      await resource.createConfig("comp/special", {
        config: { key: "value" },
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/components/comp%2Fspecial/configs",
        expect.any(Object),
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Validation error"));

      await expect(
        resource.createConfig("comp-1", { config: {} }),
      ).rejects.toThrow("Validation error");
    });
  });

  describe("getCurrentConfig()", () => {
    it("calls GET /components/{component_id}/configs/current", async () => {
      const mockConfig = { version: 1, config: { model: "gpt-4" } };
      requestSpy.mockResolvedValueOnce(mockConfig);

      const result = await resource.getCurrentConfig("comp-1");

      expect(result).toEqual(mockConfig);
      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/components/comp-1/configs/current",
      );
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes component ID", async () => {
      requestSpy.mockResolvedValueOnce({ version: 1 });

      await resource.getCurrentConfig("comp/special");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/components/comp%2Fspecial/configs/current",
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("No current config"));

      await expect(resource.getCurrentConfig("comp-1")).rejects.toThrow(
        "No current config",
      );
    });
  });

  describe("getConfigVersion()", () => {
    it("calls GET /components/{component_id}/configs/{version}", async () => {
      const mockConfig = { version: 2, config: { model: "gpt-4o" } };
      requestSpy.mockResolvedValueOnce(mockConfig);

      const result = await resource.getConfigVersion("comp-1", 2);

      expect(result).toEqual(mockConfig);
      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/components/comp-1/configs/2",
      );
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes component ID", async () => {
      requestSpy.mockResolvedValueOnce({ version: 1 });

      await resource.getConfigVersion("comp/special", 1);

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/components/comp%2Fspecial/configs/1",
      );
    });

    it("URL-encodes version number", async () => {
      requestSpy.mockResolvedValueOnce({ version: 3 });

      await resource.getConfigVersion("comp-1", 3);

      // Version is a number, encodeURIComponent(String(3)) => "3"
      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/components/comp-1/configs/3",
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Version not found"));

      await expect(resource.getConfigVersion("comp-1", 99)).rejects.toThrow(
        "Version not found",
      );
    });
  });

  describe("updateDraftConfig()", () => {
    it("sends PATCH /components/{component_id}/configs/{version} with JSON body", async () => {
      const mockConfig = { version: 3, config: { model: "gpt-4o" } };
      requestSpy.mockResolvedValueOnce(mockConfig);

      const result = await resource.updateDraftConfig("comp-1", 3, {
        config: { model: "gpt-4o" },
      });

      expect(result).toEqual(mockConfig);
      expect(requestSpy).toHaveBeenCalledTimes(1);
      expect(requestSpy).toHaveBeenCalledWith(
        "PATCH",
        "/components/comp-1/configs/3",
        {
          body: expect.any(String),
          headers: { "Content-Type": "application/json" },
        },
      );

      const body = JSON.parse(requestSpy.mock.calls[0][2].body);
      expect(body.config).toEqual({ model: "gpt-4o" });
    });

    it("maps all camelCase options to snake_case body fields", async () => {
      requestSpy.mockResolvedValueOnce({ version: 3 });

      await resource.updateDraftConfig("comp-1", 3, {
        config: { temperature: 0.5 },
        label: "beta",
        stage: "published",
        notes: "Tuned temperature",
        links: [{ child_id: "tool-2" }],
      });

      const body = JSON.parse(requestSpy.mock.calls[0][2].body);
      expect(body.config).toEqual({ temperature: 0.5 });
      expect(body.label).toBe("beta");
      expect(body.stage).toBe("published");
      expect(body.notes).toBe("Tuned temperature");
      expect(body.links).toEqual([{ child_id: "tool-2" }]);
    });

    it("only includes defined fields in body", async () => {
      requestSpy.mockResolvedValueOnce({ version: 3 });

      await resource.updateDraftConfig("comp-1", 3, {
        notes: "Only notes",
      });

      const body = JSON.parse(requestSpy.mock.calls[0][2].body);
      expect(body).toEqual({ notes: "Only notes" });
    });

    it("URL-encodes component ID", async () => {
      requestSpy.mockResolvedValueOnce({ version: 3 });

      await resource.updateDraftConfig("comp/special", 3, {
        config: { key: "value" },
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "PATCH",
        "/components/comp%2Fspecial/configs/3",
        expect.any(Object),
      );
    });

    it("URL-encodes version in path", async () => {
      requestSpy.mockResolvedValueOnce({ version: 5 });

      await resource.updateDraftConfig("comp-1", 5, {
        config: { key: "value" },
      });

      expect(requestSpy).toHaveBeenCalledWith(
        "PATCH",
        "/components/comp-1/configs/5",
        expect.any(Object),
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Not a draft"));

      await expect(
        resource.updateDraftConfig("comp-1", 1, { config: {} }),
      ).rejects.toThrow("Not a draft");
    });
  });

  describe("deleteConfigVersion()", () => {
    it("sends DELETE /components/{component_id}/configs/{version}", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.deleteConfigVersion("comp-1", 3);

      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/components/comp-1/configs/3",
      );
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes component ID", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.deleteConfigVersion("comp/special", 2);

      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/components/comp%2Fspecial/configs/2",
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Cannot delete current"));

      await expect(
        resource.deleteConfigVersion("comp-1", 1),
      ).rejects.toThrow("Cannot delete current");
    });
  });

  describe("setCurrentConfig()", () => {
    it("sends POST /components/{component_id}/configs/{version}/set-current", async () => {
      const mockConfig = { version: 2, config: { model: "gpt-4o" } };
      requestSpy.mockResolvedValueOnce(mockConfig);

      const result = await resource.setCurrentConfig("comp-1", 2);

      expect(result).toEqual(mockConfig);
      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/components/comp-1/configs/2/set-current",
      );
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes component ID", async () => {
      requestSpy.mockResolvedValueOnce({ version: 2 });

      await resource.setCurrentConfig("comp/special", 2);

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/components/comp%2Fspecial/configs/2/set-current",
      );
    });

    it("URL-encodes version in path", async () => {
      requestSpy.mockResolvedValueOnce({ version: 5 });

      await resource.setCurrentConfig("comp-1", 5);

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/components/comp-1/configs/5/set-current",
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Version not found"));

      await expect(resource.setCurrentConfig("comp-1", 99)).rejects.toThrow(
        "Version not found",
      );
    });
  });
});
