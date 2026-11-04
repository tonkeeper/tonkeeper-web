# Multichain feature checklist

Acceptance bar for every multichain feature step. Walk this list top-to-bottom against the diff
before marking a task done or opening a PR. If an item is genuinely out of scope for the slice, say
so explicitly — don't silently skip.

See also: `MULTICHAIN_PLAN.md` (roadmap), `CLAUDE.md` (architecture, styling rules, flag contract).

## Design

-   [ ] Matches the Figma mockup. The mockup wins over current code — do not propagate legacy
        visuals "because that's how the app does it today." See CLAUDE.md → "Project context:
        redesign rebuild".
-   [ ] Responsive: both mobile and desktop layouts are implemented, not just one.
-   [ ] Design tokens used wherever the mockup uses one (colors, radii, spacing, typography). No
        hardcoded hex or `px` values when a token exists.
-   [ ] **Icons come from the mockup, via the icon pipeline** — never hand-drawn inline `<svg>` or
        an approximation. Reuse an existing `packages/uikit/src/icons/components/Ic*` if the
        mockup's icon is already in the set; otherwise the SVG source goes in `src/icons/svg/` and
        is compiled by `yarn workspace @tonkeeper/uikit icons` (SVGR + `svgo.config.cjs`, which
        collapses fills to `currentColor`) — see CLAUDE.md → "Icon pipeline". If the curated SVG
        isn't available yet, **do not ship a hand-drawn stand-in silently**: add the icon to the
        "Icons pending export" list at the bottom of this file and leave a `// TODO(icons):`
        pointing at it.

## Behaviour

-   [ ] With `MULTICHAIN_ENABLED = true`: behaviour matches the iOS and Android native apps.
-   [ ] With `MULTICHAIN_ENABLED = false` (if the flag applies to this surface): behaviour is
        byte-identical to legacy production. The ship-safe build must not regress.
-   [ ] iOS and Android are **reference** implementations, not ground truth. Verify the logic before
        porting — they may carry bugs. Do not blind-copy.

## Code

-   [ ] All touched components use Tailwind. No `styled.X`, no template-literal CSS, no
        `createGlobalStyle` in touched files. Legacy components that the feature lands changes in
        get ported in the same PR. See CLAUDE.md → "Styling".
-   [ ] New screens use the existing UI primitives from `packages/uikit/src/primitives/` (buttons,
        inputs, loaders, etc.). Do not import legacy styled-components components or invent one-off
        primitives when the UI library already provides the element.
-   [ ] **Every backend API goes through a generated client — never hand-rolled.** All request
        paths, query params, and request/response types come from an OpenAPI generator driven by the
        backend's spec (see CLAUDE.md → "Regenerating API clients"). No hand-written `fetch(...)`
        wrappers, no hand-declared `Raw*` request/response interfaces, no hardcoded endpoint strings
        or query-param assembly for a backend that has a spec. If a backend has no web generator
        yet, add one (spec source + `generate:<name>Api` script + committed generated output) as
        part of the work — do not add another hand-written service. The multichain backend
        (`multi.tonkeeper.com`) is being moved onto a generated client; don't grow the legacy
        `multichain*Service.ts` fetch wrappers.
-   [ ] All chain interactions go through `chainKit`. No ad-hoc per-chain SDK calls.

## i18n

-   [ ] Every user-facing string uses `t('...')`.
-   [ ] New keys are added to the appropriate `packages/locales/src/<namespace>/en.json`, in one
        namespace only. See CLAUDE.md → "Adding translation keys".
-   [ ] Variables are passed through `t('key', { name })` — never `t('key').replace('%{name}', v)`.

## Tests

-   [ ] Small and medium UI components ship a `*.ct.tsx` screenshot test, mounted in both desktop
        and mobile mode (`screenshotEachMode`). See `packages/uikit/UI_TESTING.md`.
-   [ ] Logic is covered by unit tests — meaningful behaviour only. No tests of constants, no tests
        of JS language features, no tautological tests.

## Icons pending export

Icons the mockups use that are **not yet in** `packages/uikit/src/icons/`. Export each from Figma
(the icon component's own node — exporting the _instance_ from a mockup frame pulls in the whole
frame background/blur; if you only have a framed export, lift the `<g id="28 / ic-…">` glyph out
into a bare `viewBox="0 0 28 28"` SVG), drop it in `src/icons/svg/<name>.svg`, then run
`yarn workspace @tonkeeper/uikit icons`. SVGO collapses the fills to `currentColor` and preserves
the `opacity="0.32"` dimmed layer. List the icon here while it's outstanding and mark its call-site
with `// TODO(icons):`; remove the row once it lands.

| Icon                                       | Used by                                                      | Stand-in today                        |
| ------------------------------------------ | ------------------------------------------------------------ | ------------------------------------- |
| `ic-exclamationmark-circle-36`             | `connect/ConnectRiskWarningSheet.tsx` (unknown-domain state) | `IcExclamationmarkTriangle84` at 56px |
| `ic-qr-code-12` (+ per-source 12px glyphs) | `connect/ConnectedAppRow.tsx` source badge on the app icon   | badge omitted                         |

The multichain nav icons (`IcWallet28`, `IcTrade28`, `IcExplore28`, `IcClock28`, `IcGear28`) have
landed and are wired into `MultichainDesktopTabBar` and the mobile `HomeMultichainHeaderBar` (scan
reuses the existing `IcQrViewfinderOutline28`). Header/tab icons render at `text-iconSecondary`
(#8994a3); the active tab uses `text-textAccent`.
