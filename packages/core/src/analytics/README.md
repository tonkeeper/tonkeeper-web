# Analytics

Event types are generated from [tonkeeper/analytics-schemas](https://github.com/tonkeeper/analytics-schemas) (private). The generated `AnalyticsEvent` union in `events.ts` is the source of truth: only events from it (plus the small `LegacyAnalyticsEvent` carve-out) can be tracked.

## Track an event

```ts
import { useAnalyticsTrack } from '@tonkeeper/uikit/dist/hooks/analytics';

const track = useAnalyticsTrack();
track({ eventName: 'tc_request', dapp_url: 'https://example.com' });
```

`eventName` is the discriminator — pick one and TypeScript narrows to the required fields for that event.

## Add or change an event

1. Add/edit the event in `tonkeeper/analytics-schemas` and merge upstream.
2. Set a GitHub PAT with `Contents: Read` on that repo: `export GITHUB_TOKEN=<token>`.
3. From `packages/core`: `yarn generate:analytics`.
4. Rebuild: `yarn workspace @tonkeeper/core build && yarn workspace @tonkeeper/uikit build`.

`generate:analytics` clones the schema repo, patches upstream's broken local `$ref`s (see `resource/preprocess-analytics-schemas.js`), bundles with `@redocly/cli`, runs `openapi-typescript-codegen`, and emits `events.ts`. It overwrites `src/analytics/generated/` and `src/analytics/events.ts` — both are committed.

## Legacy events

`LegacyAnalyticsEvent` (in `packages/uikit/src/hooks/analytics/common.ts`) is a typed carve-out for events not yet defined upstream (`page_view`, `dapp_click`). The deprecated 2-arg `track(name, params)` form is the escape hatch for call sites whose payload shape doesn't yet match a schema event (e.g. `send_open` / `send_click` / `send_confirm` / `send_success` — schema exists but requires fields the call sites don't currently provide).

Both are marked `@deprecated`. Migrate to typed object events when feasible, then remove the carve-out / overload.
