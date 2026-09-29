# Icons

Design-system icons as **tree-shakeable, single-import React components**, generated from SVG.

## Why generated per-icon components (not a sprite)

A runtime sprite (`<use href>`) is fragile across bundlers and CSPs and loses tree-shaking. One
component per file means each app ships only the icons it imports, themes via `currentColor`, and
sizes from `className`/props.

## Layout

```
src/icons/
  svg/            # source of truth — optimized, square-viewBox SVGs (committed)
    ic-snowflake-16.svg
  components/     # SVGR output (committed, regenerated via `yarn icons`)
    IcSnowflake16.tsx
    index.ts      # barrel: export { default as IcSnowflake16 } from './IcSnowflake16'
```

Both `svg/` and `components/` are committed so dev (`tsc -w`), CT, and the apps need no extra build
step — the generated `.tsx` are ordinary source. Regenerate with:

```sh
yarn workspace @tonkeeper/ui-kit icons
```

Config: `svgo.config.cjs` (optimize, force `currentColor`, drop width/height, keep `viewBox`) →
`.svgrrc.cjs` (TS, automatic JSX, `{...props}` passthrough, no dimensions).

## Using an icon

Prefer the per-file import for guaranteed tree-shaking:

```tsx
import IcSnowflake16 from '@tonkeeper/ui-kit/icons/IcSnowflake16';

<IcSnowflake16 className="w-4 h-4 text-iconSecondary" />   // Tailwind: size + color
<IcSnowflake16 width={16} height={16} />                    // or explicit props
```

Size and color come from the consumer — the SVG carries neither (only a square `viewBox`).
`currentColor` makes it inherit the text colour.

## Adding an icon (only when a component needs one)

Import on demand: when a component needs an icon and no matching one exists here yet, pull just that
icon from the Figma "Icons" frame (`node-id=5-5138`), which is the source of truth.

1. `get_design_context` on the icon node → gives the asset URL **and** the inner icon's inset within
   its size box (e.g. `left 1.84px, top 1px` in a 16-box).
2. `curl` the asset URL → raw SVG. Note: it's the **inner** vector with a tight viewBox and
   `preserveAspectRatio:none` — the size-frame padding is dropped.
3. Re-frame to a square `viewBox="0 0 <size> <size>"`, wrapping the path in
   `<g transform="translate(<left> <top>)">`, and set `fill="currentColor"`. Save as
   `svg/ic-<name>-<size>.svg`.
4. `yarn icons` → generates the component. Commit both files.

No bulk import — the set grows as components need it.

## Two-tone icons and illustrations

SVGO collapses paint to `currentColor` except for two authored forms:

-   `fill="var(--tk-…)"` — a deliberate second tone that must not follow the text colour, e.g. the
    battery glyphs' charge level. Give it a fallback to the design token it represents, and route
    any per-state override through a dedicated hook variable the consumer can set with Tailwind
    (`fill="var(--tk-battery-charge, var(--tk-accent-blue))"` +
    `className="[--tk-battery-charge:var(--tk-accent-red)]"`). A Figma-export `var(--fill-0, …)` is
    not a token and is still collapsed.
-   `illustration-*.svg` — multi-colour artwork (gradients, fixed palette). The whole file keeps its
    colours; nothing is converted.
