export interface Env {
  RATE_LIMIT: KVNamespace;
  ELEVENLABS_API_KEY: string;
  ELEVENLABS_AGENT_ID: string;
  TURNSTILE_SECRET_KEY: string;
  IP_HASH_SALT: string;
  DAILY_SESSION_LIMIT?: string;
}

type Fetcher = typeof fetch;
type VoiceServiceErrorCode =
  | "elevenlabs_auth_failed"
  | "elevenlabs_agent_not_found"
  | "elevenlabs_quota_exhausted"
  | "voice_service_unavailable";

class VoiceServiceError extends Error {
  constructor(
    readonly code: VoiceServiceErrorCode,
    readonly upstreamStatus: number,
  ) {
    super(code);
  }
}

const ALLOWED_ORIGIN = "https://zerunniu.github.io";
const WINDOW_SECONDS = 600;
const PER_VISITOR_LIMIT = 3;
const DEFAULT_DAILY_LIMIT = 60;

function cors(origin: string | null): Record<string, string> {
  return origin === ALLOWED_ORIGIN
    ? {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
      }
    : {};
}

function json(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...cors(origin),
    },
  });
}

async function shortHash(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .slice(0, 16)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function validateTurnstile(
  token: string,
  secret: string,
  fetcher: Fetcher,
) {
  const response = await fetcher(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token }),
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!response.ok) return false;
  const result = (await response.json()) as {
    success?: boolean;
    hostname?: string;
  };
  return result.success === true && result.hostname === "zerunniu.github.io";
}

async function checkLimits(request: Request, env: Env, now: number) {
  const bucket = Math.floor(now / (WINDOW_SECONDS * 1000));
  const ip = request.headers.get("CF-Connecting-IP") ?? "unavailable";
  const visitorHash = await shortHash(`${env.IP_HASH_SALT}:${bucket}:${ip}`);
  const visitorKey = `visitor:${bucket}:${visitorHash}`;
  const visitorCount = Number((await env.RATE_LIMIT.get(visitorKey)) ?? "0");
  if (visitorCount >= PER_VISITOR_LIMIT)
    return { allowed: false as const, reason: "visitor_limit" as const };

  const date = new Date(now).toISOString().slice(0, 10);
  const dailyKey = `daily:${date}`;
  const dailyCount = Number((await env.RATE_LIMIT.get(dailyKey)) ?? "0");
  const dailyLimit = Math.max(
    1,
    Number(env.DAILY_SESSION_LIMIT ?? DEFAULT_DAILY_LIMIT),
  );
  if (dailyCount >= dailyLimit)
    return { allowed: false as const, reason: "daily_limit" as const };

  return {
    allowed: true as const,
    visitorKey,
    visitorCount,
    dailyKey,
    dailyCount,
  };
}

async function recordSessionStart(
  env: Env,
  limit: Extract<Awaited<ReturnType<typeof checkLimits>>, { allowed: true }>,
) {
  await Promise.all([
    env.RATE_LIMIT.put(limit.visitorKey, String(limit.visitorCount + 1), {
      expirationTtl: WINDOW_SECONDS,
    }),
    env.RATE_LIMIT.put(limit.dailyKey, String(limit.dailyCount + 1), {
      expirationTtl: 172800,
    }),
  ]);
}

async function requestSignedUrl(env: Env, fetcher: Fetcher) {
  const endpoint = new URL(
    "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url",
  );
  endpoint.searchParams.set("agent_id", env.ELEVENLABS_AGENT_ID);
  const response = await fetcher(endpoint, {
    headers: { "xi-api-key": env.ELEVENLABS_API_KEY },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    const code: VoiceServiceErrorCode =
      response.status === 401 || response.status === 403
        ? "elevenlabs_auth_failed"
        : response.status === 400 ||
            response.status === 404 ||
            response.status === 422
          ? "elevenlabs_agent_not_found"
          : response.status === 429
            ? "elevenlabs_quota_exhausted"
            : "voice_service_unavailable";
    throw new VoiceServiceError(code, response.status);
  }
  const data = (await response.json()) as { signed_url?: string };
  if (!data.signed_url?.startsWith("wss://"))
    throw new Error("ElevenLabs returned an invalid signed URL");
  return data.signed_url;
}

export async function handleRequest(
  request: Request,
  env: Env,
  fetcher: Fetcher = fetch,
  now = Date.now(),
) {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");

  if (request.method === "GET" && url.pathname === "/api/health") {
    return json({ status: "ok" }, 200, origin);
  }

  if (request.method === "OPTIONS" && url.pathname === "/api/voice/session") {
    return origin === ALLOWED_ORIGIN
      ? new Response(null, { status: 204, headers: cors(origin) })
      : json({ error: "origin_not_allowed" }, 403);
  }

  if (request.method !== "POST" || url.pathname !== "/api/voice/session")
    return json({ error: "not_found" }, 404, origin);
  if (origin !== ALLOWED_ORIGIN)
    return json({ error: "origin_not_allowed" }, 403);
  const contentLength = Number(request.headers.get("Content-Length") ?? "0");
  if (contentLength > 4096)
    return json({ error: "payload_too_large" }, 413, origin);

  let body: { turnstileToken?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400, origin);
  }
  if (!body.turnstileToken || body.turnstileToken.length > 2048)
    return json({ error: "invalid_turnstile_token" }, 400, origin);

  try {
    const verified = await validateTurnstile(
      body.turnstileToken,
      env.TURNSTILE_SECRET_KEY,
      fetcher,
    );
    if (!verified) return json({ error: "turnstile_failed" }, 403, origin);
    const limit = await checkLimits(request, env, now);
    if (!limit.allowed)
      return json(
        { error: limit.reason, fallback: "static_search" },
        429,
        origin,
      );
    const signedUrl = await requestSignedUrl(env, fetcher);
    await recordSessionStart(env, limit);
    return json(
      { signedUrl, expiresInSeconds: 900, maxSessionSeconds: 300 },
      200,
      origin,
    );
  } catch (error) {
    const serviceError = error instanceof VoiceServiceError ? error : undefined;
    if (serviceError)
      console.error("ElevenLabs signed URL request failed", {
        status: serviceError.upstreamStatus,
        code: serviceError.code,
      });
    return json(
      {
        error: serviceError?.code ?? "voice_service_unavailable",
        fallback: "static_search",
      },
      503,
      origin,
    );
  }
}

export default {
  fetch: (request: Request, env: Env) => handleRequest(request, env),
} satisfies ExportedHandler<Env>;
