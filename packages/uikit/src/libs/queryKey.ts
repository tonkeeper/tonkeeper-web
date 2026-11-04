/* eslint-disable @typescript-eslint/naming-convention */

import { InvalidateQueryFilters } from '@tanstack/react-query';

export enum QueryKey {
    account = 'account',
    wallet = 'wallet',
    wallets = 'wallets',
    walletConfig = 'wallet_config',
    accountConfig = 'accountConfig',
    lock = 'lock',
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
    allowedFiatCurrencies = 'allowedFiatCurrencies',

    tonConnectConnection = 'tonConnectConnection',
    tonConnectLastEventId = 'tonConnectLastEventId',
    walletConnectSessions = 'walletConnectSessions',
    evmInjectedConnections = 'evmInjectedConnections',
    subscribed = 'subscribed',
    globalSubscribed = 'globalSubscribed',
    featuredRecommendations = 'recommendations',
    experimental = 'experimental',

    tronAssets = 'tronAssets',
    multichainWalletAssets = 'multichainWalletAssets',
    walletsListFiatTotals = 'walletsListFiatTotals',
    multichainActivity = 'multichainActivity',
    multichainFavorites = 'multichainFavorites',
    multichainTonRecipient = 'multichainTonRecipient',
    multichainMigrationWallets = 'multichainMigrationWallets',
    multichainMigrationPrepare = 'multichainMigrationPrepare',
    multichainMigrationOpened = 'multichainMigrationOpened',
    multichainFinishSetup = 'multichainFinishSetup',
    safeMode = 'safeMode',
    dustFilters = 'dustFilters',
    tradingAssetDetails = 'tradingAssetDetails',
    tradingAssetCharts = 'tradingAssetCharts',
    tradingAssetsCatalog = 'tradingAssetsCatalog',
    tradingAssetsByIds = 'tradingAssetsByIds',
    tradingAssetMarket = 'tradingAssetMarket',
    tradingShelvesConfig = 'tradingShelvesConfig',
    browserCatalog = 'browserCatalog',
    rate = 'rate',
    total = 'total',
    distribution = 'distribution',
    pro = 'pro',
    proAuthToken = 'proAuthToken',
    plans = 'plans',
    proBackup = 'proBackup',
    supportToken = 'supportToken',
    formattedProPrice = 'formattedProPrice',
    trialAvailability = 'trialAvailability',
    allWalletsTotalBalance = 'allWalletsTotalBalance',
    originalTransactionId = 'originalTransactionId',
    currentIosSubscriptionInfo = 'currentIosSubscriptionInfo',

    dashboardColumnsForm = 'dashboardColumnsForm',
    dashboardColumns = 'dashboardColumns',
    selectedDashboardColumns = 'selectedDashboardColumns',
    dashboardData = 'dashboardData',

    stonfiAssets = 'stonfiAssets',
    swapAllAssets = 'swapAllAssets',
    swapWalletAssets = 'swapWalletAssets',
    swapCustomToken = 'swapCustomToken',
    crossSwapAssets = 'crossSwapAssets',
    crossSwapAsset = 'crossSwapAsset',
    crossSwapConfig = 'crossSwapConfig',
    crossSwapQuote = 'crossSwapQuote',
    crossSwapPrepare = 'crossSwapPrepare',

    onrampConfiguration = 'onrampConfiguration',
    onrampChains = 'onrampChains',
    onrampAsset = 'onrampAsset',
    onrampMerchants = 'onrampMerchants',
    offrampAsset = 'offrampAsset',
    exchangeLayout = 'exchangeLayout',

    multisigWallet = 'multisigWallet',
    multisigOrder = 'multisigOrder',

    batteryServiceConfig = 'batteryServiceConfig',
    batteryOnchainRechargeMethods = 'batteryOnchainRechargeMethods',
    batteryAuthToken = 'batteryAuthToken',
    batteryBalance = 'batteryBalance',
    batteryPurchases = 'batteryPurchases',
    estimateBatteryPurchase = 'estimateBatteryPurchase',

    gaslessConfig = 'gaslessConfig',

    twoFAWalletConfig = 'twoFAWalletConfig',
    twoFAActivationProcess = 'twoFAActivationProcess',
    twoFARemovingProcess = 'twoFARemovingProcess',
    twoFACancellRecoveryProcess = 'twoFARemovingProcess',
    isOnReview = 'isOnReview',
    browserTabs = 'browserTabs',
    searchEngineRecommendations = 'searchEngineRecommendations',
    appCountryInfo = 'appCountryInfo',

    trc20TrxDefaultFee = 'trc20TrxDefaultFee',
    trc20FreeTransfersConfig = 'trc20FreeTransfersConfig',

    legacyPlugins = 'legacyPlugins',

    staking = 'staking'
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
