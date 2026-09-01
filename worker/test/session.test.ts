import { describe, expect, it } from "vitest";
import { handleRequest, type Env } from "../src/index";

class MemoryKV {
  data = new Map<string, string>();
  async get(key: string) {
    return this.data.get(key) ?? null;
  }
  async put(key: string, value: string) {
    this.data.set(key, value);
  }
}

function env(kv = new MemoryKV()) {
  return {
    RATE_LIMIT: kv as unknown as KVNamespace,
    ELEVENLABS_API_KEY: "secret",
    ELEVENLABS_AGENT_ID: "agent_test",
    TURNSTILE_SECRET_KEY: "turnstile",
    IP_HASH_SALT: "salt",
    DAILY_SESSION_LIMIT: "5",
  } satisfies Env;
}

function request(origin = "https://zerunniu.github.io", token = "valid") {
  return new Request("https://worker.example/api/voice/session", {
    method: "POST",
    headers: {
      Origin: origin,
      "CF-Connecting-IP": "203.0.113.8",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ turnstileToken: token }),
  });
}

const fetcher: typeof fetch = async (input) => {
  const url = String(input);
  if (url.includes("siteverify"))
    return Response.json({ success: true, hostname: "zerunniu.github.io" });
  return Response.json({ signed_url: "wss://api.elevenlabs.io/test" });
};

describe("voice session worker", () => {
  it("rejects origins outside the allowlist", async () => {
    const response = await handleRequest(
      request("https://evil.example"),
      env(),
      fetcher,
      Date.UTC(2026, 7, 31),
    );
    expect(response.status).toBe(403);
  });

  it("returns a signed URL after Turnstile validation", async () => {
    const response = await handleRequest(
      request(),
      env(),
      fetcher,
      Date.UTC(2026, 7, 31),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      signedUrl: "wss://api.elevenlabs.io/test",
      maxSessionSeconds: 300,
    });
  });

  it("limits a visitor to three session starts in ten minutes", async () => {
    const shared = env();
    const now = Date.UTC(2026, 7, 31);
    for (let i = 0; i < 3; i += 1)
      expect(
        (await handleRequest(request(), shared, fetcher, now)).status,
      ).toBe(200);
    const blocked = await handleRequest(request(), shared, fetcher, now);
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toMatchObject({
      error: "visitor_limit",
      fallback: "static_search",
    });
  });

  it.each([
    [401, "elevenlabs_auth_failed"],
    [403, "elevenlabs_auth_failed"],
    [404, "elevenlabs_agent_not_found"],
    [422, "elevenlabs_agent_not_found"],
    [429, "elevenlabs_quota_exhausted"],
    [500, "voice_service_unavailable"],
  ])("maps ElevenLabs status %i to %s", async (status, error) => {
    const failingFetcher: typeof fetch = async (input) => {
      if (String(input).includes("siteverify"))
        return Response.json({
          success: true,
          hostname: "zerunniu.github.io",
        });
      return new Response(null, { status });
    };
    const response = await handleRequest(
      request(),
      env(),
      failingFetcher,
      Date.UTC(2026, 7, 31),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error,
      fallback: "static_search",
    });
  });

  it("does not consume the visitor limit when ElevenLabs rejects a request", async () => {
    const shared = env();
    const now = Date.UTC(2026, 7, 31);
    const failingFetcher: typeof fetch = async (input) => {
      if (String(input).includes("siteverify"))
        return Response.json({
          success: true,
          hostname: "zerunniu.github.io",
        });
      return new Response(null, { status: 401 });
    };
    for (let i = 0; i < 4; i += 1) {
      const response = await handleRequest(
        request(),
        shared,
        failingFetcher,
        now,
      );
      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({
        error: "elevenlabs_auth_failed",
      });
    }
  });

  it("keeps health output configuration-free", async () => {
    const response = await handleRequest(
      new Request("https://worker.example/api/health"),
      env(),
      fetcher,
    );
    expect(await response.json()).toEqual({ status: "ok" });
  });
});
