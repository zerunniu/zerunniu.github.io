# Digital Zerun Worker

This Worker is the only service allowed to hold the ElevenLabs API key. It validates the exact GitHub Pages Origin, a single-use Turnstile token, a 10-minute per-visitor limit, and a daily global cap before requesting a short-lived signed WebSocket URL.

## One-time Cloudflare setup

1. Create a Cloudflare account, a Turnstile widget restricted to `zerunniu.github.io`, and two Workers KV namespaces (preview and production).
2. Replace the two KV IDs in `wrangler.jsonc`.
3. Configure these Worker secrets with `wrangler secret put`: `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, `TURNSTILE_SECRET_KEY`, and a random 32-byte `IP_HASH_SALT`.
4. Deploy, then add the Worker URL and public Turnstile site key to the GitHub Actions environment as `PUBLIC_VOICE_WORKER_URL` and `PUBLIC_TURNSTILE_SITE_KEY`.

Never commit `.dev.vars`, recordings, a Voice ID, or an API key. Configure ElevenLabs separately with a five-minute maximum conversation duration, Zero Retention Mode, Audio Saving off, retention 0 days, private-agent authentication, and overage disabled.
