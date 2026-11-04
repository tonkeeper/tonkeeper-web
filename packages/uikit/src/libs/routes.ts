/* eslint-disable @typescript-eslint/naming-convention */
export enum AppRoute {
    import = '/import',
    settings = '/settings',
    walletSettings = '/wallet-settings',
    accountSettings = '/account-settings',
    browser = '/browser',
    activity = '/activity',
    purchases = '/purchases',
    dns = '/dns',
    coins = '/coins',
    signer = '/signer',
    publish = '/publish',
    swap = '/swap',
    staking = '/staking',
    multisigOrders = '/multisig-orders',
    multisigWallets = '/multisig-wallets',
    home = '/',

    /**
     * Special extension route to bypass browser popup HID access restrictions
     */
    connectLedger = '/connect-ledger'
}

export enum DappBrowserRoute {
    new = '/new',
    tab = '/tab'
}

export enum AppProRoute {
    dashboard = '/dashboard',
    multiSend = '/multi-send'
}

export enum SignerRoute {
    link = 'link'
}

export enum SettingsRoute {
    index = '/',
    localization = '/localization',
    notification = '/notification',
    legal = '/legal',
    theme = '/theme',
    dev = '/dev',
    fiat = '/fiat',
    interceptLinks = '/intercept-links',
    account = '/account',
    recovery = '/recovery',
    version = '/version',
    ledgerIndexes = '/ledger-indexes',
    jettons = '/jettons',
    nft = '/nft',
    security = '/security',
    subscriptions = '/subscriptions',
    pro = '/pro',
    twoFa = '/two-fa'
}

export enum DevSettingsRoute {
    index = '/',
    logs = '/logs'
}

export enum WalletSettingsRoute {
    index = '/',
    recovery = '/recovery',
    recoveryMamWallet = '/recovery-mam-wallet',
    version = '/version',
    ledgerIndexes = '/ledger-indexes',
    jettons = '/jettons',
    nft = '/nft',
    connectedApps = '/connected-apps',
    derivations = '/derivations',
    battery = '/battery',
    chains = '/chains',
    twoFa = '/two-fa',
    notification = '/notification'
}

export enum StakingRoute {
    pool = '/pool',
    stake = '/stake',
    unstake = '/unstake'
}

export enum BrowserRoute {
    index = '/',
    category = '/category'
}

export enum MultichainRoute {
    home = '/multichain',
    asset = '/multichain/asset',
    history = '/multichain/history',
    collectibles = '/multichain/collectibles',
    collectiblesSettings = '/multichain/collectibles/settings',
    trade = '/multichain/trade',
    tradeCrypto = '/multichain/trade/crypto',
    staking = '/multichain/staking',
    browser = '/multichain/browser',
    browserCategory = '/multichain/browser/category',
    settings = '/multichain/settings'
}

/**
 * Subroutes of {@link MultichainRoute.settings}, matched inside
 * `MultichainSettingsRouting`. Values are relative to the settings root.
 */
export enum MultichainSettingsRoute {
    customize = '/customize',
    backup = '/backup',
    migration = '/migration',
    migrationConfirm = '/migration/confirm',
    currency = '/currency',
    interceptLinks = '/intercept-links',
    language = '/language',
    security = '/security',
    notifications = '/notifications',
    connectedApps = '/connected-apps',
    battery = '/battery',
    legal = '/legal',
    dev = '/dev'
}

/**
 * Query flag the history empty-state appends to {@link MultichainRoute.home} so
 * the home opens its Add Funds flow on arrival — that flow lives in the home's
 * local state, so it can only be reached by asking the home to open it, not by
 * a dedicated route.
 */
export const MULTICHAIN_ACTION_PARAM = 'action';
export const MULTICHAIN_ACTION_ADD_FUNDS = 'add_funds';
/**
 * Optional companion to {@link MULTICHAIN_ACTION_ADD_FUNDS}: an onramp asset id
 * (e.g. `ton/mainnet/coin`) that skips the asset picker and opens the payment
 * method screen with that asset preselected. Falls back to the plain Add Funds
 * sheet when the asset isn't purchasable in the user's region.
 */
export const MULTICHAIN_ACTION_ASSET_PARAM = 'asset';
/**
 * Optional companion naming the screen that sent the user to Add Funds, as a
 * `RampSource` analytics value. Absent means the wallet screen.
 */
export const MULTICHAIN_ACTION_FROM_PARAM = 'from';
/** Further home-local flows reachable through {@link MULTICHAIN_ACTION_PARAM}. */
export const MULTICHAIN_ACTION_RECEIVE = 'receive';
export const MULTICHAIN_ACTION_SWAP = 'swap';
export const MULTICHAIN_ACTION_STAKE = 'stake';
/**
 * {@link MULTICHAIN_ACTION_PARAM} value the asset page reads to open its
 * Cash sell flow on arrival; the flow lives in the page's local state.
 */
export const MULTICHAIN_ACTION_SELL = 'sell';
/** Query on {@link MultichainRoute.browser} preselecting the catalog chain filter. */
export const MULTICHAIN_BROWSER_CHAIN_PARAM = 'chain';

/**
 * Routes rendered as a modal over the page that opened them. The page's route
 * is matched without `exact` and nests the overlay route itself, so the page
 * stays mounted underneath; scroll roots reset on the page path rather than
 * the overlay's, so closing the overlay lands where the user left off.
 */
const OVERLAY_ROUTE_PAGES: Record<string, string> = {
    [MultichainRoute.tradeCrypto]: MultichainRoute.trade
};

export const scrollPagePathname = (pathname: string): string =>
    OVERLAY_ROUTE_PAGES[pathname] ?? pathname;

export const any = (route: string): string => {
    return `${route}/*`;
};

export const relative = (path: string): string => {
    return `.${path}`;
};
