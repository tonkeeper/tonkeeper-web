/* eslint-disable @typescript-eslint/naming-convention */
export enum AppRoute {
    import = '/import',
    settings = '/settings',
    walletSettings = '/wallet-settings',
    browser = '/browser',
    activity = '/activity',
    purchases = '/purchases',
    dns = '/dns',
    coins = '/coins',
    signer = '/signer',
    publish = '/publish',
    swap = '/swap',
    home = '/'
}

export enum AppProRoute {
    dashboard = '/dashboard',
    multiSend = '/multi-send'
}

export enum SignerRoute {
    link = 'link'
}

export enum ImportRoute {
    import = '/import',
    create = '/create',
    signer = '/signer',
    ledger = '/ledger',
    keystone = '/keystone',
    readOnly = '/watch-only'
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
    country = '/country',
    pro = '/pro'
}

export enum WalletSettingsRoute {
    index = '/',
    recovery = '/recovery',
    version = '/version',
    ledgerIndexes = '/ledger-indexes',
    jettons = '/jettons',
    nft = '/nft',
    connectedApps = '/connected-apps'
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
