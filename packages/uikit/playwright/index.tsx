import { beforeMount } from '@playwright/experimental-ct-react/hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { MockAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { BRAND_CONFIG } from '@tonkeeper/core/dist/config/brand';
import { getGlobalPreferences } from '@tonkeeper/core/dist/service/globalPreferencesService';
import { DEFAULT_DUST_FILTERS } from '@tonkeeper/core/dist/service/dustFilterService';
import type { SafeModeState } from '@tonkeeper/core/dist/service/safeModeService';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import type { Config as BatteryConfig } from '@tonkeeper/core/dist/batteryApi';
import { Configuration as ConfigurationV2 } from '@tonkeeper/core/dist/tonApiV2';
import { Network } from '@tonkeeper/core/dist/entries/network';
import {
    defaultTonendpointConfig,
    Tonendpoint
} from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import resources from '../../locales/dist/i18n/default.json';
import tonkeeperEnSource from '../../locales/src/tonkeeper/en.json';
import tonkeeperWebEnSource from '../../locales/src/tonkeeper-web/en.json';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import type { DefaultTheme } from 'styled-components';
import { AppSdkContext } from '../src/hooks/appSdk';
import { AppContext, IAppContext } from '../src/hooks/appContext';
import { formatCount } from '@tonkeeper/core/dist/utils/numberFormat';
import { TranslationContext, tReplace } from '../src/hooks/translation';
import { QueryKey } from '../src/libs/queryKey';
import { multichainWalletAssetsQueryKey } from '../src/state/multichain/useMultichainWalletAssets';
import { defaultTheme } from '../src/styles/defaultTheme';
import { GlobalStyle } from '../src/styles/globalStyle';
import { buildActiveMultichainAccount } from './multichainAccountFixture';
// Tailwind preflight + utilities + design-token :root vars, same stylesheet the
// apps load. Required so Tailwind-styled components render like production (and
// so preflight's resets apply). Compiled by the Tailwind PostCSS plugin wired
// in playwright-ct.config.ts. The :root vars here are the default dark theme,
// which matches the `defaultTheme` used below; UserThemeProvider's runtime var
// sync isn't needed because there's only one theme.
import '../src/styles/tailwind.css';

/**
 * Component-test "mode". Every component should look right on a desktop-sized
 * viewport and on a phone-sized one, so screenshots are taken in both.
 *
 * The mode is forwarded from each test via `mount(..., { hooksConfig: { mode } })`
 * and selects the styled-components theme variant here; the matching viewport is
 * set test-side (see playwright/test.tsx).
 */
export type TestMode = 'desktop' | 'mobile';

export type HooksConfig = {
    mode?: TestMode;
};

const themeForMode = (mode: TestMode): DefaultTheme => ({
    ...defaultTheme,
    displayType: 'full-width',
    proDisplayType: mode === 'mobile' ? 'mobile' : 'desktop',
    os: mode === 'mobile' ? 'ios' : 'mac'
});

// Flatten a namespace's `en.json` into the dotted-free, underscore-joined keys
// the app calls `t()` with. Mirrors `toDict` in locales' `task/build.ts` so the
// keys match what the real build emits; `tReplace` understands the `{{var}}` /
// `{var}` / `%{var}` placeholder forms left intact here, so no message rewrite
// is needed for rendering.
const flattenMessages = (
    obj: Record<string, unknown>,
    parentKey?: string
): Record<string, string> =>
    Object.entries(obj).reduce((acc, [rawKey, value]) => {
        const key = rawKey.replace(/\./g, '_').replace(/-/g, '_');
        const itemKey = parentKey ? `${parentKey}_${key}` : key;
        if (typeof value === 'string') {
            acc[itemKey] = value;
        } else if (value && typeof value === 'object') {
            Object.assign(acc, flattenMessages(value as Record<string, unknown>, itemKey));
        }
        return acc;
    }, {} as Record<string, string>);

// English source of truth = the committed `src/<namespace>/en.json` files. The
// dist `default.json` is a gitignored build artifact, so it can be stale or
// absent. Layering the flattened source UNDER the dist build means any key the
// dist hasn't picked up yet falls through to its real copy instead of rendering
// as the raw key. New keys therefore need no harness edits — add the key to
// `en.json` and the screenshot renders it.
const enTranslations: Record<string, string> = {
    ...flattenMessages(tonkeeperEnSource as Record<string, unknown>),
    ...flattenMessages(tonkeeperWebEnSource as Record<string, unknown>),
    ...(resources.en.translation as Record<string, string>)
};

// Mirrors `useTWithReplaces`, which every app shell wraps its `t` with: the
// brand names are always available as `%{chainName}` / `%{coinName}` /
// `%{coinSymbol}`, and per-call replaces win.
const translate = (key: string, replaces?: Record<string, string | number>) => {
    const withBrand = {
        chainName: BRAND_CONFIG.chainName,
        coinName: BRAND_CONFIG.coinName,
        coinSymbol: BRAND_CONFIG.coinSymbol,
        ...replaces
    };
    const count = typeof replaces?.count === 'number' ? replaces.count : undefined;
    const pluralKey = count === undefined ? undefined : `${key}_${count === 1 ? 'one' : 'other'}`;
    const template = (pluralKey && enTranslations[pluralKey]) ?? enTranslations[key] ?? key;
    return tReplace(
        template,
        count === undefined ? withBrand : { ...withBrand, count: formatCount(count) }
    );
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false, refetchOnWindowFocus: false },
        mutations: { retry: false }
    }
});

const testTonendpointConfig = {
    ...defaultTonendpointConfig,
    supportLink: 'mailto:support@tonkeeper.com',
    // Mirrors the production `/keys/all` explorers block for the chains the
    // asset-menu tests exercise.
    explorers: [
        {
            chain: 'ton',
            name: 'Tonviewer',
            url: 'https://tonviewer.com/transaction/{tx_hash}',
            token_url: 'https://tonviewer.com/{token_address}',
            account_url: 'https://tonviewer.com/{account_address}'
        },
        {
            chain: 'eth',
            name: 'Blockscout',
            url: 'https://eth.blockscout.com/tx/{tx_hash}',
            token_url: 'https://eth.blockscout.com/token/{token_address}',
            account_url: 'https://eth.blockscout.com/address/{account_address}'
        },
        {
            chain: 'btc',
            name: 'Mempool',
            url: 'https://mempool.space/tx/{tx_hash}',
            account_url: 'https://mempool.space/address/{account_address}'
        }
    ],
    '2fa_public_key': '1',
    '2fa_api_url': 'https://example.com/2fa',
    '2fa_bot_url': 'https://t.me/tonkeeper_test_bot'
};

// `useAccountSafeModeState` keys on the server flag, so the seed below has to
// read it from the same config the harness provides.
const SAFE_MODE_SERVER_DEFAULT = testTonendpointConfig.flags?.safe_mode_enabled ?? false;

const testAppContext: IAppContext = {
    mainnetApi: {
        tonApiV2: new ConfigurationV2()
    },
    testnetApi: {
        tonApiV2: new ConfigurationV2()
    },
    fiat: FiatCurrencies.USD,
    mainnetConfig: testTonendpointConfig,
    testnetConfig: testTonendpointConfig,
    // Real client so tests can answer its requests with `page.route`; anything
    // left unanswered is aborted by the `test` fixture in `./test.tsx`.
    tonendpoint: new Tonendpoint({
        platform: 'web',
        lang: 'en',
        build: 'ct',
        network: Network.MAINNET
    }),
    standalone: false,
    extension: false,
    ios: false,
    proFeatures: false,
    hideQrScanner: false,
    defaultWalletVersion: WalletVersion.V5R1,
    multichainEnabled: true,
    tracker: undefined
};

// Wraps every mounted component in the app's real theme + global styles so
// screenshots match production rendering. Add new global providers (i18n,
// query client) here as components start to need them. `MemoryRouter` is
// loaded unconditionally because react-router-dom's `useHistory` /
// `useLocation` throw if mounted outside a router — the multichain
// portfolio rows call `useNavigate`, which transitively touches both.
beforeMount<HooksConfig>(async ({ App, hooksConfig }) => {
    const mode = hooksConfig?.mode ?? 'desktop';
    const testTranslationContext = {
        t: translate,
        i18n: {
            enable: true,
            reloadResources: async () => {},
            changeLanguage: async () => {},
            language: 'en',
            languages: ['en']
        }
    };
    (
        globalThis as typeof globalThis & {
            __TONKEEPER_TEST_I18N_CONTEXT?: typeof testTranslationContext;
        }
    ).__TONKEEPER_TEST_I18N_CONTEXT = testTranslationContext;

    // Default active account: a fully-populated `AccountMultichain` (TON + EVM +
    // BTC + TRON) seeded into a `MockAppSdk`'s in-memory storage and exposed via
    // `AppSdkContext`. Components that read `useActiveAccount()` (the home header,
    // the receive sheet, the balance row) throw "No active account" without one;
    // `useActiveAccountQuery`'s queryFn reads this same storage, so the account
    // survives react-query refetches. Components that don't read it are
    // unaffected — the seeded sdk is otherwise an empty MockAppSdk.
    const sdk = new MockAppSdk();
    const account = buildActiveMultichainAccount();
    await sdk.storage.set(AppKey.ACCOUNTS, [account]);
    await sdk.storage.set(AppKey.ACTIVE_ACCOUNT_ID, account.id);
    await sdk.storage.set(AppKey.FIAT, FiatCurrencies.USD);
    queryClient.clear();
    queryClient.setQueryData([QueryKey.account, QueryKey.wallet], account);
    // `useAccountsState` reads this key (plural `wallets`); without it,
    // callers that do `accounts.length` / `accounts.some` crash on mount.
    queryClient.setQueryData([QueryKey.account, QueryKey.wallets], [account]);
    // Safe mode and the dust filters both resolve from storage to their
    // defaults (off). Seeding them keeps the queries that key on those flags
    // — the asset lists and the fiat totals below — on one stable key instead
    // of refetching once the toggles load.
    const safeMode: SafeModeState = { enabled: false, temporarilyDisabled: false };
    queryClient.setQueryData([QueryKey.safeMode, account.id, SAFE_MODE_SERVER_DEFAULT], safeMode);
    queryClient.setQueryData([QueryKey.dustFilters], DEFAULT_DUST_FILTERS);
    // The wallets list captions each row with the account's fiat total, read
    // off the same portfolio entry the home screen shows — otherwise a live
    // multichain-backend request per row. The key carries the two flags the
    // request would send, so it has to repeat the values seeded above.
    queryClient.setQueryData(
        multichainWalletAssetsQueryKey(
            account.multichainWalletId,
            account.activeTonWallet.id,
            FiatCurrencies.USD,
            safeMode.enabled,
            DEFAULT_DUST_FILTERS.hideDustBalances
        ),
        { assets: [], totalFiat: new BigNumber('17471.74') }
    );
    // Connected-apps screens read these; seeding empty lists keeps the
    // empty state from racing WalletConnect relay init (no project id in ct).
    queryClient.setQueryData([QueryKey.walletConnectSessions], []);
    queryClient.setQueryData([QueryKey.evmInjectedConnections], []);
    // `useUserFiat` throws synchronously when its query is empty, so components
    // that read the wallet's fiat currency (`useMultichainWalletAssets`, the
    // send flow) crash on first render without a seeded value. The queryFn reads
    // the same storage key set above, so it survives react-query refetches.
    queryClient.setQueryData([AppKey.FIAT], FiatCurrencies.USD);
    // `useGlobalPreferences` is a suspense query (`useGlobalPreferencesQuery`
    // sets `suspense: true`), and the harness renders without a Suspense
    // boundary — so any component whose hooks touch it (e.g. `useMutateLogOut`)
    // crashes on first render unless the query is pre-seeded. The queryFn reads
    // the same MockAppSdk storage, so refetches return the same defaults.
    queryClient.setQueryData(
        [QueryKey.globalPreferencesConfig],
        await getGlobalPreferences(sdk.storage)
    );
    // `useBatteryServiceConfigQuery` is a suspense query too, reached by
    // anything that parses a deeplink (`useProcessOpenedLink` needs the
    // excess account to encode jetton transfers). Unseeded, its fetch fails
    // in ct and the error surfaces during render.
    queryClient.setQueryData([QueryKey.batteryServiceConfig], {
        chargeCost: '0',
        fundReceiver: '0:0',
        excessAccount: '0:0',
        messageTtl: 300,
        gasProxy: [],
        meanPrices: {
            batteryMeanPriceSwap: 0,
            batteryMeanPriceJetton: 0,
            batteryMeanPriceNft: 0
        },
        batteryReservedAmount: '0',
        packages: [],
        transferCost: { _default: '0', jettons: [] }
    } satisfies BatteryConfig);

    return (
        <TranslationContext.Provider value={testTranslationContext}>
            <AppSdkContext.Provider value={sdk}>
                <AppContext.Provider value={testAppContext}>
                    <QueryClientProvider client={queryClient}>
                        <ThemeProvider theme={themeForMode(mode)}>
                            <GlobalStyle />
                            <MemoryRouter>
                                <App />
                            </MemoryRouter>
                        </ThemeProvider>
                    </QueryClientProvider>
                </AppContext.Provider>
            </AppSdkContext.Provider>
        </TranslationContext.Provider>
    );
});
