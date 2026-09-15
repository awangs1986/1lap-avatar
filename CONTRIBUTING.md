# Contributing / 贡献指南

Thanks for helping improve the 1lap layered avatar system.

## Workflow

1. Fork / branch from `main`.
2. `npm install` at the repo root (npm workspaces).
3. Run the demo: `npm run demo` → open the Vite URL.
4. Run unit tests: `npm test` (Vitest in `@1lap/avatar-core`).
5. Build packages: `npm run build`.
6. Open a PR with a clear description of UI / asset / API changes.

## Guidelines

- **Do not commit secrets** (`.env`, tokens, private keys, database dumps).
- Do not copy 1lap / gt7website server code, Prisma schema, or Next.js actions into this repo.
- Keep `@1lap/avatar-core` framework-agnostic (no React / DOM assumptions beyond URL helpers).
- When adding SVG accessories (e.g. glasses), add **both** `male` and `female` files, update `partLabels`, and bump `AVATAR_OPTION_COUNT` / `AVATAR_HAT_INDICES` if needed.
- Team-hat accessories use third-party trademarks — replace before a public release (see `packages/assets/README.md`).
- Prefer small, focused PRs. Include screenshots for AvatarBuilder UI changes.

## Regenerating assets

```bash
npm run generate:avatars
```

Writes into `packages/assets/avatars/`. Review diffs carefully before committing (~540 SVGs).
