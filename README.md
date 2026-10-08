# Zerun Niu — Immersive AI Research Lab

The source for [zerunniu.github.io](https://zerunniu.github.io): an Astro, React, and Three.js research portfolio designed for AI Research Engineer and ML Engineer roles.

## Local development

```bash
pnpm install
pnpm dev
```

Daily content updates live in `src/content/` as Markdown with schema-validated frontmatter. `pnpm build` regenerates both CV PDFs from the same content, builds the static Astro site, and creates a Pagefind search index.

The homepage features a personal particle field.
Tap once to reveal Reliable AI through an illustrative annotation aggregation and
uncertainty diagram, then explore Edge AI through a shared equilibrium
representation and personalized local heads, Semantic Communication through
semantic/channel encoding, wireless transmission, and decoding, followed by an
uppercase serif `ZN` signature. The Edge AI scene distinguishes locally solved states `z*` from the
shared parameters exchanged with the server, and labels RCAA and ADMM updates.
The Semantic Communication scene follows WaSeCom's conceptual system model
(arXiv:2506.03167v2, §III-A/B) and labels Wasserstein DRO as training for semantic
and channel uncertainty, rather than an extra transmission stage.
These labelled research themes link to the related BRAVE, FeDEQ, and WaSeCom write-ups;
the Reliable AI scene does not reconstruct BRAVE's algorithm. Each form stays until the next tap; the
four form buttons also select it directly. The original Focus areas constellation
is in a collapsed section below Research. Use `?form=reasoning`, `?form=connections`,
`?form=communication`, or `?form=signature` to open a formed scene. The
`/demo/generate/` preview shares the homepage components, retains a preview
banner, and is excluded from the sitemap and marked noindex.

## Verification

```bash
pnpm check
pnpm test
pnpm build
node scripts/verify_build.mjs
pnpm test:e2e
```

The voice agent is optional and fails closed to static research search. Its API key belongs only in Cloudflare Worker secrets. See [docs/deployment.md](docs/deployment.md) and [docs/elevenlabs-agent.md](docs/elevenlabs-agent.md).
