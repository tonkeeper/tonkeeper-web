/* eslint-disable @typescript-eslint/naming-convention */

import { InvalidateQueryFilters } from '@tanstack/react-query';

export enum QueryKey {
    account = 'account',
    wallet = 'wallet',
    wallets = 'wallets',
    walletConfig = 'wallet_config',
    accountConfig = 'accountConfig',
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
    multisigWallets = 'multisigWallets',
    multisigSigners = 'multisigSigners',
    viewedMultisigOrders = 'viewedMultisigOrders',

    tonConnectConnection = 'tonConnectConnection',
    tonConnectLastEventId = 'tonConnectLastEventId',
    subscribed = 'subscribed',
    globalSubscribed = 'globalSubscribed',
    featuredRecommendations = 'recommendations',
    experimental = 'experimental',

    tronAssets = 'tronAssets',
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
    swapCustomToken = 'swapCustomToken',

    multisigWallet = 'multisigWallet',
    multisigOrder = 'multisigOrder',

    batteryServiceConfig = 'batteryServiceConfig',
    batteryOnchainRechargeMethods = 'batteryOnchainRechargeMethods',
    batteryAuthToken = 'batteryAuthToken',
    batteryBalance = 'batteryBalance',
    estimateBatteryPurchase = 'estimateBatteryPurchase',

    gaslessConfig = 'gaslessConfig',

    twoFAWalletConfig = 'twoFAWalletConfig',
    twoFAActivationProcess = 'twoFAActivationProcess',
    twoFARemovingProcess = 'twoFARemovingProcess',
    twoFACancellRecoveryProcess = 'twoFARemovingProcess'
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

export function anyOfKeysParts(...keys: (string | undefined)[]): InvalidateQueryFilters {
    const notEmptyKeys = keys.filter(Boolean);
    return {
        predicate: q => q.queryKey.some(element => notEmptyKeys.includes(element as string))
    };
}
