# @tonkeeper/ui-kit

The Keeper design system for React: components, colour themes, icons and Tailwind tokens.

This is a private npm package. Ask the `@tonkeeper` npm organization for read access, then
authenticate with npm before installing it. CI builds need a read-only npm token for this package.

TT Firs Neue files included in the package are licensed separately from the Apache-2.0 code. Package
access does not grant permission to use or redistribute the font outside Tonkeeper's licensed
websites.

```sh
npm login --registry=https://registry.npmjs.org/
npm install @tonkeeper/ui-kit
```

Requires React 18+. Browse every component and variant in the showcase (`yarn dev:showcase` in this
repo).

## Setup

Import the stylesheet once at the app root and wrap the app in `ThemeProvider`:

```tsx
import '@tonkeeper/ui-kit/styles.css';
import { Button, ThemeProvider } from '@tonkeeper/ui-kit';

export const App = () => (
    <ThemeProvider theme="blue">
        <Button variant="primaryBlue">Continue</Button>
    </ThemeProvider>
);
```

`styles.css` carries Tailwind's preflight reset, the design tokens, the fonts, and every utility the
components use, so it works without Tailwind in the host app.

-   `theme` — `blue`, `dark` or `light`. The palette is written onto `:root` as `--tk-*` custom
    properties, so portalled content (modals, toasts) follows it too.
-   `layout` — `desktop` (modals are centred cards) or `mobile` (bottom sheets). Omitted, it follows
    the viewport: `mobile` below 1024px.

## Icons

Each icon is its own module; import only what you use. Size and colour come from the call site.

```tsx
import IcPlus28 from '@tonkeeper/ui-kit/icons/IcPlus28';

<IcPlus28 className="size-7 text-iconPrimary" />;
```

## Tailwind

To style your own markup with the kit's tokens (`bg-backgroundContent`, `text-label1`,
`rounded-medium`, …), add the preset:

```ts
// tailwind.config.ts
import kit from '@tonkeeper/ui-kit/tailwind-preset';

export default {
    presets: [kit],
    content: ['./src/**/*.{ts,tsx}']
};
```

Keep importing `styles.css` — it holds the classes the components themselves use and the fonts.

## Developing

```sh
yarn dev:showcase                           # live catalogue, reads the kit from source
yarn workspace @tonkeeper/ui-kit build      # dist/: ESM modules, types, styles.css, fonts
yarn workspace @tonkeeper/ui-kit icons      # regenerate icon components from src/icons/svg
```

Component tests (`*.ct.tsx`) and their screenshot baselines run in CI only. To regenerate the
baselines, run the **UI Kit** workflow manually on your branch.

## Releasing

Run the **UI Kit Release** workflow with a version: `patch`, `minor` or `major` bumps the latest npm
release; an exact version such as `1.4.0` or `1.5.0-beta.1` is used as is. Stable versions publish
from `main` under the `latest` tag; prereleases may publish from any branch under `next`. Each
private release is tagged `ui-kit-v<version>` with a matching GitHub release. The workflow needs an
`NPM_TOKEN` secret with read and publish access to this package.
