# @1lap/avatar-assets

Layered SVG files for the 1lap / GT7-style avatar system.

Serve the `avatars/` directory at the path your host app uses (default `/avatars`).

## Trademark warning / 商标提示

Several **accessory** (hat) SVGs stylize Formula 1 team branding for personal / fan-site use:

- AMG (index 4)
- McLaren (index 6)
- Ferrari (index 7)
- Red Bull (index 9)

**Replace these before publishing a public GitHub / npm release** if you do not have trademark permission. Keep glasses / goggles / fisherman hat (non-team) assets as-is, or redraw team hats as generic racing caps.

```
packages/assets/avatars/{male,female}/accessory/{4,6,7,9}.svg
```

Also update Chinese labels in `@1lap/avatar-core` `partLabels("accessory")` when you rename them.
