# Zerun Niu research portfolio

## Source of truth

- Daily updates belong in `src/content/**/*.md`.
- Collection schemas live in `src/content.config.ts`; keep frontmatter valid.
- BRAVE must remain labelled `under-review` until Zerun explicitly changes the status.
- Public BRAVE attribution is authorised: Zerun Niu is first author and led algorithm design, literature review, experimental design, code implementation, and experimental deployment.
- Never add reviewer dialogue, Author Console data, voice recordings, Voice IDs, or production secrets.

## Validation

Run `pnpm check`, `pnpm test`, `pnpm build`, and `node scripts/verify_build.mjs` for content or code changes. Run `pnpm test:e2e` for layout, navigation, interaction, or accessibility changes.

The two PDF resumes are generated from Markdown with `pnpm resumes`; do not edit the PDFs directly.
