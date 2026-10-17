import { afterEach, describe, expect, it, vi } from "vitest";

import { checkBackendHealth, normalizeBackendUrl } from "@/lib/quantumrisc-api";

afterEach(() => vi.unstubAllGlobals());

describe("normalizeBackendUrl", () => {
  it("strips a trailing slash", () => {
    expect(normalizeBackendUrl("http://127.0.0.1:8000/")).toBe("http://127.0.0.1:8000");
  });
  it("trims whitespace and keeps paths", () => {
    expect(normalizeBackendUrl("  https://sim.example.com/core/  ")).toBe(
      "https://sim.example.com/core",
    );
  });
  it("rejects empty input", () => {
    expect(() => normalizeBackendUrl("   ")).toThrow("Enter a backend address.");
  });
  it("rejects query strings", () => {
    expect(() => normalizeBackendUrl("http://localhost:8000?x=1")).toThrow(/query string/);
  });
  it("rejects fragments", () => {
    expect(() => normalizeBackendUrl("http://localhost:8000#top")).toThrow(/fragment/);
  });
  it("rejects non-http protocols", () => {
    expect(() => normalizeBackendUrl("ftp://localhost")).toThrow(/HTTP or HTTPS/);
  });
  it("rejects credentials", () => {
    expect(() => normalizeBackendUrl("http://u:p@localhost")).toThrow(/username or password/);
  });
  it("rejects incomplete addresses", () => {
    expect(() => normalizeBackendUrl("localhost:8000/x y")).toThrow();
  });
});

describe("checkBackendHealth", () => {
  it("reports reachable on HTTP 200 and calls /api/health", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await checkBackendHealth("http://127.0.0.1:8000/");
    expect(result).toEqual({
      state: "reachable",
      baseUrl: "http://127.0.0.1:8000",
      statusCode: 200,
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://127.0.0.1:8000/api/health");
  });
  it("reports unreachable with status on non-OK responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 503 })));
    const result = await checkBackendHealth("http://127.0.0.1:8000");
    expect(result).toMatchObject({ state: "unreachable", statusCode: 503 });
  });
  it("reports a timeout when the request aborts", async () => {
    const err = new Error("timeout");
    err.name = "TimeoutError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(err));
    const result = await checkBackendHealth("http://127.0.0.1:8000");
    expect(result).toMatchObject({
      state: "unreachable",
      message: "The health check timed out after 5 seconds.",
    });
  });
  it("reports network errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const result = await checkBackendHealth("http://127.0.0.1:8000");
    expect(result.state).toBe("unreachable");
    if (result.state === "unreachable") expect(result.message).toMatch(/Could not reach/);
  });
  it("does not fetch for invalid addresses", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await checkBackendHealth("http://x?y=1");
    expect(result.state).toBe("unreachable");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
