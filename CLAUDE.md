# Tonkeeper Web

Monorepo для кроссплатформенного крипто-кошелька TON.

## Структура проекта

```
packages/core/       — бизнес-логика, API клиенты (openapi-codegen), encoders, аккаунт менеджмент
packages/uikit/      — React компоненты, хуки, state management, desktop/mobile страницы
packages/locales/    — i18n переводы (i18next)
apps/desktop/        — Electron desktop приложение
apps/web/            — Web приложение
apps/twa/            — Telegram Web App
apps/web-swap-widget/ — встраиваемый swap-виджет (НЕ ТРОГАТЬ — это отдельный артефакт)
```

**ВАЖНО:** `apps/web-swap-widget/` — изолированный артефакт. Не модифицировать, не рефакторить, не использовать как образец.

## Tech stack

- **React 18**, TypeScript 4.9
- **Styled-components v6** — стилизация (theme-aware: `p.theme.backgroundContent`)
- **React Router DOM v5.3.4** — маршрутизация (`<Switch>`, `<Route path={...} component={...} />`, НЕ `element`)
- **@tanstack/react-query v4.3.4** — server state (`useQuery`, `useMutation`, `QueryKey` enum)
- **@ton/core 0.56.0**, **@ton/crypto 3.2.0** — работа с TON blockchain
- **Electron v32** — desktop
- **Yarn v4.3.0** workspaces + TurboRepo

## Ключевые паттерны

### Feature flags
```typescript
// packages/uikit/src/state/tonendpoint.ts
enum FLAGGED_FEATURE { BATTERY = 'battery', SWAPS = 'swaps', ... }
const flagsMapping: Record<FLAGGED_FEATURE, keyof TonendpointConfig['flags']>
// Использование: <IfFeatureEnabled feature={FLAGGED_FEATURE.SWAPS}>...</IfFeatureEnabled>
```

### Encoders (blockchain)
Standalone классы в `packages/core/src/service/ton-blockchain/encoder/`:
- `TonEncoder` — конструктор `(api: APIConfig)`, instance-методы (arrow functions), возвращает `WalletOutgoingMessage`
- `JettonEncoder` — статические методы, без конструктора, возвращает `WalletOutgoingMessage`
- Используют `@ton/core`: `beginCell()`, `Cell`, `Address`, `toNano()`
- Типы: `WalletOutgoingMessage` (внутренний), `TonConnectTransactionPayload` (для TonConnect/UI)
- НЕ наследуют от базового класса

### React Query хуки
- Хуки данных в `packages/uikit/src/state/` по доменам
- `useQuery` для чтения, `useMutation` для записи
- Ключи кеша через `QueryKey` enum

### Desktop страницы
- Layout: `DesktopViewPageLayout` → `DesktopViewHeader` → контент
- Обёртки: `HideOnReview > IfFeatureEnabled > ErrorBoundary`
- Маршрут: `<Route path={AppRoute.xxx} component={Page} />` в `apps/desktop/src/app/App.tsx`

### Guards
- `useIsActiveWalletWatchOnly()` — read-only кошелёк
- `useActiveTonNetwork()` — mainnet/testnet
- `useActiveAccount()` — текущий аккаунт

### Транзакции
Подтверждение и отправка через `TonTransactionNotification`:
1. Encode → `TonConnectTransactionPayload`
2. Передать в `TonTransactionNotification`
3. Компонент показывает estimation, подтверждение, отправляет

## Работа с Figma-дизайнами

При получении Figma node-id через `get_design_context` / `get_screenshot`:

1. **Бери из дизайна контент и структуру** — какие поля, секции, информация показывается, порядок элементов, логика состояний (empty/filled/error)
2. **Игнорируй навигацию, меню, хедеры** — они могут быть устаревшими или неточными в Figma. Используй существующие компоненты проекта (`DesktopViewPageLayout`, `WalletAsideMenu`, etc.)
3. **НЕ делай pixel-perfect** — стилизация через существующие styled-components и тему проекта (`p.theme.*`). Figma даёт представление о layout, а не точные пиксели
4. **При сомнениях — ориентируйся на код** — если Figma противоречит паттернам кодовой базы (например SwapMainForm), следуй паттернам кода. Код — источник правды для стилей и компонентной структуры
5. **Ищи аналог в коде** — для каждого UI элемента из Figma ищи ближайший существующий компонент (SwapFromField, SwapButton и т.д.) и адаптируй его

## Команды

```bash
yarn install          # установка зависимостей
npx tsc --noEmit      # проверка типов
yarn build            # полная сборка
```

## API

Сгенерированные клиенты в `packages/core/src/tonApiV2/` (openapi-codegen).
Основные: `AccountsApi`, `JettonApi`, `StakingApi`, `WalletApi`.
