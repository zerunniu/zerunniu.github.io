# Zerun Niu — Immersive AI Research Lab

The source for [zerunniu.github.io](https://zerunniu.github.io): an Astro, React, and Three.js research portfolio designed for AI Research Engineer and ML Engineer roles.

## Local development

```bash
pnpm install
pnpm dev
```

Daily content updates live in `src/content/` as Markdown with schema-validated frontmatter. `pnpm build` regenerates both CV PDFs from the same content, builds the static Astro site, and creates a Pagefind search index.

## Verification

```bash
pnpm check
pnpm test
pnpm build
node scripts/verify_build.mjs
pnpm test:e2e
```

The voice agent is optional and fails closed to static research search. Its API key belongs only in Cloudflare Worker secrets. See [docs/deployment.md](docs/deployment.md) and [docs/elevenlabs-agent.md](docs/elevenlabs-agent.md).
