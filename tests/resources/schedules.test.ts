import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentOSClient } from "../../src/client";
import { SchedulesResource } from "../../src/resources/schedules";

describe("SchedulesResource", () => {
  let resource: SchedulesResource;
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
    resource = new SchedulesResource(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("list()", () => {
    it("calls GET /schedules with no params when options omitted", async () => {
      const mockResponse = {
        data: [],
        meta: { total: 0, page: 1, limit: 20 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      const result = await resource.list();

      expect(result).toEqual(mockResponse);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/schedules");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("adds enabled query param", async () => {
      requestSpy.mockResolvedValueOnce({ data: [] });

      await resource.list({ enabled: true });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/schedules?enabled=true",
      );
    });

    it("adds limit and page query params", async () => {
      requestSpy.mockResolvedValueOnce({ data: [] });

      await resource.list({ limit: 10, page: 2 });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/schedules?limit=10&page=2",
      );
    });

    it("combines all query params", async () => {
      requestSpy.mockResolvedValueOnce({ data: [] });

      await resource.list({ enabled: false, limit: 5, page: 3 });

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/schedules?enabled=false&limit=5&page=3",
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Network error"));

      await expect(resource.list()).rejects.toThrow("Network error");
    });
  });

  describe("create()", () => {
    it("sends POST /schedules with JSON body", async () => {
      const mockSchedule = { id: "sched-1", name: "Daily Report" };
      requestSpy.mockResolvedValueOnce(mockSchedule);

      const result = await resource.create({
        name: "Daily Report",
        cronExpr: "0 9 * * *",
        endpoint: "/api/reports/generate",
        method: "POST",
      });

      expect(result).toEqual(mockSchedule);
      expect(requestSpy).toHaveBeenCalledTimes(1);
      expect(requestSpy).toHaveBeenCalledWith("POST", "/schedules", {
        body: expect.any(String),
        headers: { "Content-Type": "application/json" },
      });

      const body = JSON.parse(requestSpy.mock.calls[0][2].body);
      expect(body.name).toBe("Daily Report");
      expect(body.cron_expr).toBe("0 9 * * *");
      expect(body.endpoint).toBe("/api/reports/generate");
      expect(body.method).toBe("POST");
      expect(body.timezone).toBe("UTC");
      expect(body.timeout_seconds).toBe(3600);
      expect(body.max_retries).toBe(0);
      expect(body.retry_delay_seconds).toBe(60);
    });

    it("includes optional fields when provided", async () => {
      requestSpy.mockResolvedValueOnce({ id: "sched-1" });

      await resource.create({
        name: "Sync Job",
        cronExpr: "0 * * * *",
        endpoint: "/api/sync",
        method: "POST",
        description: "Hourly sync",
        payload: { key: "value" },
        timezone: "America/New_York",
        timeoutSeconds: 120,
        maxRetries: 3,
        retryDelaySeconds: 30,
      });

      const body = JSON.parse(requestSpy.mock.calls[0][2].body);
      expect(body.description).toBe("Hourly sync");
      expect(body.payload).toEqual({ key: "value" });
      expect(body.timezone).toBe("America/New_York");
      expect(body.timeout_seconds).toBe(120);
      expect(body.max_retries).toBe(3);
      expect(body.retry_delay_seconds).toBe(30);
    });

    it("does not include description and payload when not provided", async () => {
      requestSpy.mockResolvedValueOnce({ id: "sched-1" });

      await resource.create({
        name: "Basic",
        cronExpr: "0 0 * * *",
        endpoint: "/api/task",
        method: "GET",
      });

      const body = JSON.parse(requestSpy.mock.calls[0][2].body);
      expect(body).not.toHaveProperty("description");
      expect(body).not.toHaveProperty("payload");
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Validation error"));

      await expect(
        resource.create({
          name: "Bad",
          cronExpr: "invalid",
          endpoint: "/api",
          method: "POST",
        }),
      ).rejects.toThrow("Validation error");
    });
  });

  describe("get()", () => {
    it("calls GET /schedules/{schedule_id}", async () => {
      const mockSchedule = { id: "sched-1", name: "My Schedule" };
      requestSpy.mockResolvedValueOnce(mockSchedule);

      const result = await resource.get("sched-1");

      expect(result).toEqual(mockSchedule);
      expect(requestSpy).toHaveBeenCalledWith("GET", "/schedules/sched-1");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes schedule ID with forward slash", async () => {
      requestSpy.mockResolvedValueOnce({ id: "sched/special" });

      await resource.get("sched/special");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/schedules/sched%2Fspecial",
      );
    });

    it("URL-encodes schedule ID with space", async () => {
      requestSpy.mockResolvedValueOnce({ id: "my schedule" });

      await resource.get("my schedule");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/schedules/my%20schedule",
      );
    });

    it("URL-encodes schedule ID with @ symbol", async () => {
      requestSpy.mockResolvedValueOnce({ id: "sched@123" });

      await resource.get("sched@123");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/schedules/sched%40123",
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Not found"));

      await expect(resource.get("nonexistent")).rejects.toThrow("Not found");
    });
  });

  describe("update()", () => {
    it("sends PATCH /schedules/{schedule_id} with JSON body", async () => {
      const mockSchedule = { id: "sched-1", name: "Updated" };
      requestSpy.mockResolvedValueOnce(mockSchedule);

      const result = await resource.update("sched-1", {
        name: "Updated",
        cronExpr: "0 0/2 * * *",
      });

      expect(result).toEqual(mockSchedule);
      expect(requestSpy).toHaveBeenCalledTimes(1);
      expect(requestSpy).toHaveBeenCalledWith("PATCH", "/schedules/sched-1", {
        body: expect.any(String),
        headers: { "Content-Type": "application/json" },
      });

      const body = JSON.parse(requestSpy.mock.calls[0][2].body);
      expect(body.name).toBe("Updated");
      expect(body.cron_expr).toBe("0 0/2 * * *");
    });

    it("maps all camelCase options to snake_case body fields", async () => {
      requestSpy.mockResolvedValueOnce({ id: "sched-1" });

      await resource.update("sched-1", {
        name: "Updated",
        cronExpr: "0 * * * *",
        endpoint: "/new-endpoint",
        method: "PUT",
        description: "Updated description",
        payload: { foo: "bar" },
        timezone: "Europe/London",
        timeoutSeconds: 300,
        maxRetries: 5,
        retryDelaySeconds: 10,
      });

      const body = JSON.parse(requestSpy.mock.calls[0][2].body);
      expect(body.name).toBe("Updated");
      expect(body.cron_expr).toBe("0 * * * *");
      expect(body.endpoint).toBe("/new-endpoint");
      expect(body.method).toBe("PUT");
      expect(body.description).toBe("Updated description");
      expect(body.payload).toEqual({ foo: "bar" });
      expect(body.timezone).toBe("Europe/London");
      expect(body.timeout_seconds).toBe(300);
      expect(body.max_retries).toBe(5);
      expect(body.retry_delay_seconds).toBe(10);
    });

    it("only includes defined fields in body", async () => {
      requestSpy.mockResolvedValueOnce({ id: "sched-1" });

      await resource.update("sched-1", { name: "Only Name" });

      const body = JSON.parse(requestSpy.mock.calls[0][2].body);
      expect(body).toEqual({ name: "Only Name" });
    });

    it("URL-encodes schedule ID", async () => {
      requestSpy.mockResolvedValueOnce({ id: "sched/special" });

      await resource.update("sched/special", { name: "X" });

      expect(requestSpy).toHaveBeenCalledWith(
        "PATCH",
        "/schedules/sched%2Fspecial",
        expect.any(Object),
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Forbidden"));

      await expect(
        resource.update("sched-1", { name: "X" }),
      ).rejects.toThrow("Forbidden");
    });
  });

  describe("delete()", () => {
    it("sends DELETE /schedules/{schedule_id}", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete("sched-1");

      expect(requestSpy).toHaveBeenCalledWith("DELETE", "/schedules/sched-1");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes schedule ID", async () => {
      requestSpy.mockResolvedValueOnce(undefined);

      await resource.delete("sched/special");

      expect(requestSpy).toHaveBeenCalledWith(
        "DELETE",
        "/schedules/sched%2Fspecial",
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Not found"));

      await expect(resource.delete("nonexistent")).rejects.toThrow("Not found");
    });
  });

  describe("enable()", () => {
    it("sends POST /schedules/{schedule_id}/enable", async () => {
      const mockState = { schedule_id: "sched-1", enabled: true };
      requestSpy.mockResolvedValueOnce(mockState);

      const result = await resource.enable("sched-1");

      expect(result).toEqual(mockState);
      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/schedules/sched-1/enable",
      );
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes schedule ID", async () => {
      requestSpy.mockResolvedValueOnce({ enabled: true });

      await resource.enable("sched/special");

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/schedules/sched%2Fspecial/enable",
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Not found"));

      await expect(resource.enable("nonexistent")).rejects.toThrow("Not found");
    });
  });

  describe("disable()", () => {
    it("sends POST /schedules/{schedule_id}/disable", async () => {
      const mockState = { schedule_id: "sched-1", enabled: false };
      requestSpy.mockResolvedValueOnce(mockState);

      const result = await resource.disable("sched-1");

      expect(result).toEqual(mockState);
      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/schedules/sched-1/disable",
      );
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes schedule ID", async () => {
      requestSpy.mockResolvedValueOnce({ enabled: false });

      await resource.disable("sched/special");

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/schedules/sched%2Fspecial/disable",
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Server error"));

      await expect(resource.disable("sched-1")).rejects.toThrow("Server error");
    });
  });

  describe("listRuns()", () => {
    it("calls GET /schedules/{schedule_id}/runs", async () => {
      const mockResponse = {
        data: [{ run_id: "run-1", status: "completed" }],
        meta: { total: 1, page: 1, limit: 20 },
      };
      requestSpy.mockResolvedValueOnce(mockResponse);

      const result = await resource.listRuns("sched-1");

      expect(result).toEqual(mockResponse);
      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/schedules/sched-1/runs",
      );
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes schedule ID", async () => {
      requestSpy.mockResolvedValueOnce({ data: [] });

      await resource.listRuns("sched/special");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/schedules/sched%2Fspecial/runs",
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Not found"));

      await expect(resource.listRuns("nonexistent")).rejects.toThrow(
        "Not found",
      );
    });
  });

  describe("getRun()", () => {
    it("calls GET /schedules/{schedule_id}/runs/{run_id}", async () => {
      const mockRun = { run_id: "run-1", status: "completed" };
      requestSpy.mockResolvedValueOnce(mockRun);

      const result = await resource.getRun("sched-1", "run-1");

      expect(result).toEqual(mockRun);
      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/schedules/sched-1/runs/run-1",
      );
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes schedule ID", async () => {
      requestSpy.mockResolvedValueOnce({ run_id: "run-1" });

      await resource.getRun("sched/special", "run-1");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/schedules/sched%2Fspecial/runs/run-1",
      );
    });

    it("URL-encodes run ID", async () => {
      requestSpy.mockResolvedValueOnce({ run_id: "run/special" });

      await resource.getRun("sched-1", "run/special");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/schedules/sched-1/runs/run%2Fspecial",
      );
    });

    it("URL-encodes both schedule ID and run ID", async () => {
      requestSpy.mockResolvedValueOnce({ run_id: "run/1" });

      await resource.getRun("sched@1", "run/1");

      expect(requestSpy).toHaveBeenCalledWith(
        "GET",
        "/schedules/sched%401/runs/run%2F1",
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Not found"));

      await expect(resource.getRun("sched-1", "run-999")).rejects.toThrow(
        "Not found",
      );
    });
  });

  describe("trigger()", () => {
    it("sends POST /schedules/{schedule_id}/trigger", async () => {
      const mockRun = { run_id: "run-1", status: "triggered" };
      requestSpy.mockResolvedValueOnce(mockRun);

      const result = await resource.trigger("sched-1");

      expect(result).toEqual(mockRun);
      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/schedules/sched-1/trigger",
      );
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    it("URL-encodes schedule ID", async () => {
      requestSpy.mockResolvedValueOnce({ run_id: "run-1" });

      await resource.trigger("sched/special");

      expect(requestSpy).toHaveBeenCalledWith(
        "POST",
        "/schedules/sched%2Fspecial/trigger",
      );
    });

    it("propagates errors from client.request", async () => {
      requestSpy.mockRejectedValueOnce(new Error("Schedule disabled"));

      await expect(resource.trigger("sched-1")).rejects.toThrow(
        "Schedule disabled",
      );
    });
  });
});
