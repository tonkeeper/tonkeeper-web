# @tonkeeper/ui-kit

The Keeper design system for React: components, colour themes, icons and Tailwind tokens.

```sh
npm install @tonkeeper/ui-kit
```

Requires React 18+. Browse every component and variant at
[ui-showcase.keeperwallet.com](https://ui-showcase.keeperwallet.com).

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

`styles.css` carries Tailwind's preflight reset, the design tokens, the bundled Inter face, the
hosted brand face, and every utility the components use, so it works without Tailwind in the host
app.

-   `theme` — `blue`, `dark` or `light`. The palette is written onto `:root` as `--tk-*` custom
    properties, so portalled content (modals, toasts) follows it too.
-   `layout` — `desktop` (modals are centred cards) or `mobile` (bottom sheets). Omitted, it follows
    the viewport: `mobile` below 1024px.

## Fonts

Inter ships with the package. `styles.css` also imports the TT Firs Neue stylesheet from
[fonts.keeperwallet.com](https://fonts.keeperwallet.com/v1/tt-firs-neue.css). The font stack uses TT
Firs Neue first and falls back to Inter for uncovered glyphs. TT Firs Neue is licensed separately
from the kit's Apache-2.0 code; its font files are hosted separately and are not included in the
package. Browser access to the hosted fonts is limited to Keeper apps and their approved preview
domains.

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

Keep importing `styles.css` — it holds the classes the components themselves use and both font
declarations.
