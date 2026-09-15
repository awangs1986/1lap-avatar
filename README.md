# 1lap Avatar / 分层 SVG 捏脸头像

**English:** Open-source-ready monorepo for the layered SVG avatar used on the 1lap GT7 community site — including glasses and other accessories. Decoupled from Next.js server actions, Prisma, and the 1lap design system. Host apps own persistence of `AvatarConfig`.

**中文：** 从 1lap GT7 站点抽出的日漫风分层 SVG 捏脸系统（含眼镜等饰品）独立 monorepo。与 Next Server Actions / Prisma / 站点设计体系解耦；业务侧自行持久化 `AvatarConfig`。

## Packages

| Package | Name | Role |
|---------|------|------|
| `packages/core` | `@1lap/avatar-core` | Config types, part URLs (`avatarPartSrc`), labels, clamps |
| `packages/react` | `@1lap/avatar-react` | `<Avatar>` / `<AvatarBuilder>` + self-contained CSS |
| `packages/assets` | `@1lap/avatar-assets` | ~540 SVG layers under `avatars/` |
| `apps/demo` | `@1lap/avatar-demo` | Vite + React playground |

## Quick start

```bash
npm install                 # if NODE_ENV=production, use: npm install --include=dev
npm test                    # vitest in core
npm run build               # tsc core → react
npm run demo                # Vite demo with AvatarBuilder
```

Repo ships `.npmrc` with `production=false` so workspace tooling (TypeScript / Vitest / Vite) still installs when the environment has `NODE_ENV=production`.

Demo serves SVGs from `packages/assets/avatars` at `/avatars` (default `assetBasePath`).

「保存」in the demo `console.log` / `alert`s the current `AvatarConfig` JSON — no backend.

## CDN / assetBasePath

```ts
import { avatarPartSrc } from "@1lap/avatar-core";

avatarPartSrc("eyes", 0, config);                    // → /avatars/male/eyes/0.svg?v=…
avatarPartSrc("eyes", 0, config, "/cdn/avatars");     // string 4th arg
avatarPartSrc("eyes", 0, config, { basePath: "https://cdn.example/avatars" });
```

`<Avatar assetBasePath="…" />` and `<AvatarBuilder assetBasePath="…" />` pass the prefix through.

## How to add a new glasses style / 如何加一副新眼镜

Accessories live under category `accessory` (index `0` = none; `1–3` glasses; hats / goggles follow).

1. Draw / edit SVG on the shared **256×256** canvas, aligned to the face anchors used by `scripts/generate-avatar-svgs.mjs`.
2. Write **both** genders:
   - `packages/assets/avatars/male/accessory/<n>.svg`
   - `packages/assets/avatars/female/accessory/<n>.svg`
3. If you are **replacing** an existing index, you are done (labels may still need a tweak).
4. If you are **adding** a new index beyond the current count:
   - Bump `AVATAR_OPTION_COUNT` in `packages/core/src/avatar-parts.ts`.
   - Append a Chinese label in `partLabels("accessory")`.
   - If it is a **hat** that should hide hair, add the index to `AVATAR_HAT_INDICES`.
   - Optionally extend `scripts/generate-avatar-svgs.mjs` so regenerations stay in sync.
5. Run `npm test` and check the demo preview tab 「饰品」.

## Trademark warning / 商标提示

Team baseball caps (AMG / McLaren / Ferrari / Red Bull) are stylized fan art. **Replace those SVGs (and labels) before a public GitHub or npm release** unless you have permission. See `packages/assets/README.md`.

## Persistence

This library does **not** save avatars. Persist `AvatarConfig` in your own API / DB:

```ts
type AvatarConfig = {
  gender: "male" | "female";
  skin: number;
  face: number;
  hair: number;
  brows: number;
  eyes: number;
  nose: number;
  mouth: number;
  beard: number;
  accessory: number;
};
```

Optional helper `avatarConfigFromDriver` maps 1lap-style column names if you still use them.

## License

MIT for code. SVG assets: same license for original artwork; **team-hat trademarks remain third-party** — replace before public redistribution.
