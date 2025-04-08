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
    multisigOrders = '/multisig-orders',
    multisigWallets = '/multisig-wallets',
    home = '/'
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

export enum BrowserRoute {
    index = '/',
    category = '/category'
}

export const any = (route: string): string => {
    return `${route}/*`;
};

export const relative = (path: string): string => {
    return `.${path}`;
};
