import { InvalidateQueryFilters } from '@tanstack/react-query';

export enum QueryKey {
    account = 'account',
    wallet = 'wallet',
    wallets = 'wallets',
    walletConfig = 'wallet_config',
    lock = 'lock',
    touchId = 'touchId',
    canPromptTouchId = 'canPromptTouchId',
    country = 'country',
    password = 'password',
    addresses = 'addresses',
    info = 'info',
    jettons = 'jettons',
    nft = 'nft',
    nftCollection = 'nftCollection',
    activity = 'activity',
    tonkeeperApi = 'tonkeeperApi',
    estimate = 'estimate',
    dns = 'dns',
    system = 'system',
    syncDate = 'syncDate',
    analytics = 'analytics',
    language = 'language',
    walletVersions = 'walletVersions',
    globalPreferencesConfig = 'globalPreferencesConfig',

    tonConnectConnection = 'tonConnectConnection',
    tonConnectLastEventId = 'tonConnectLastEventId',
    subscribed = 'subscribed',
    featuredRecommendations = 'recommendations',
    experimental = 'experimental',

    tron = 'tron',
    rate = 'rate',
    total = 'total',
    distribution = 'distribution',
    pro = 'pro',
    proBackup = 'proBackup',
    allWalletsTotalBalance = 'allWalletsTotalBalance',

    dashboardColumnsForm = 'dashboardColumnsForm',
    dashboardColumns = 'dashboardColumns',
    selectedDashboardColumns = 'selectedDashboardColumns',
    dashboardData = 'dashboardData',

    stonfiAssets = 'stonfiAssets',
    swapCalculate = 'swapCalculate',
    swapGasConfig = 'swapCalculate',
    swapMaxValue = 'swapMaxValue',
    swapAllAssets = 'swapAllAssets',
    swapWalletAssets = 'swapWalletAssets',
    swapCustomToken = 'swapCustomToken'
}

export enum JettonKey {
    info,
    history,
    balance,
    raw
}

export enum TonkeeperApiKey {
    config,
    stock,
    fiat
}

export function anyOfKeysParts(...keys: string[]): InvalidateQueryFilters {
    return {
        predicate: q => q.queryKey.some(element => keys.includes(element as string))
    };
}
