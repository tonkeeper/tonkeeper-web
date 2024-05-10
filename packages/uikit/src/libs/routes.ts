/* eslint-disable @typescript-eslint/naming-convention */
export enum AppRoute {
    import = '/import',
    settings = '/settings',
    walletSettings = '/wallet-settings',
    browser = '/browser',
    activity = '/activity',
    purchases = '/purchases',
    coins = '/coins',
    signer = '/signer',
    publish = '/publish',
    home = '/',

    notcoin = '/notcoin'
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
    ledger = '/ledger'
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
    jettons = '/jettons',
    security = '/security',
    subscriptions = '/subscriptions',
    country = '/country',
    pro = '/pro'
}

export enum WalletSettingsRoute {
    index = '/',
    recovery = '/recovery',
    version = '/version',
    jettons = '/jettons'
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
