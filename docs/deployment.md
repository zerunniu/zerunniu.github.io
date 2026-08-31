# Deployment runbook

## Repository safety

- Legacy tag: `legacy-jekyll-2026-08-31`
- Legacy branch: `legacy/jekyll-2026-08-31`
- Redesign branch: `redesign/immersive-ai-lab`
- Production remains `main` until the redesign pull request is approved.

## GitHub Pages

1. In repository Settings > Pages, set Source to **GitHub Actions**.
2. Create a protected GitHub Environment named `github-pages`.
3. Add environment variables `PUBLIC_VOICE_WORKER_URL` and `PUBLIC_TURNSTILE_SITE_KEY` after the Worker exists. These are public identifiers, not secrets.
4. Merge the reviewed redesign branch into `main`. The Pages workflow type-checks, tests, regenerates both PDFs, builds Astro and Pagefind, runs browser tests, scans the bundle for secrets, and deploys the Pages artifact.
5. The smoke job checks the live home page, BRAVE case file, knowledge file, and both PDF downloads.

If the production smoke check fails, revert the merge commit. The old site remains recoverable from `legacy-jekyll-2026-08-31` and `legacy/jekyll-2026-08-31`.

## Cloudflare Worker

1. Create a Cloudflare account.
2. Create a Turnstile widget restricted to `zerunniu.github.io`.
3. Create production and preview KV namespaces; place their IDs in `worker/wrangler.jsonc`.
4. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to a protected GitHub Environment named `cloudflare-production`.
5. Add Worker secrets with Wrangler: `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, `TURNSTILE_SECRET_KEY`, `IP_HASH_SALT`.
6. Run the Worker workflow manually once. Confirm `/api/health` returns only `{"status":"ok"}`.

The Worker accepts only `https://zerunniu.github.io`, validates Turnstile server-side, hashes the IP with a rotating 10-minute bucket and secret salt, permits three starts per visitor per bucket, applies a global daily cap, and never records audio, transcripts, or questions.

## Production acceptance

- Confirm every project and both PDFs load on desktop and mobile.
- Run the 40 prompts in `test/agent-eval-cases.json` against the production agent.
- Confirm voice sessions terminate at five minutes and local transcript disappears after End.
- Confirm the browser bundle and Git history contain no ElevenLabs or Cloudflare secrets.
- Confirm ElevenLabs shows Zero Retention Mode, Audio Saving off, retention 0 days, and usage overage disabled.
