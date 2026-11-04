import { useCallback } from 'react';
import { useNavigate } from '../router/useNavigate';
import {
    AppRoute,
    MULTICHAIN_ACTION_FROM_PARAM,
    MULTICHAIN_ACTION_ADD_FUNDS,
    MULTICHAIN_ACTION_PARAM,
    MULTICHAIN_ACTION_RECEIVE,
    MULTICHAIN_ACTION_SELL,
    MULTICHAIN_ACTION_STAKE,
    MULTICHAIN_BROWSER_CHAIN_PARAM,
    MultichainRoute,
    MultichainSettingsRoute,
    StakingRoute,
    WalletSettingsRoute
} from '../../libs/routes';
import { useActiveAccount } from '../../state/wallet';
import { MIGRATION_FROM_PARAM } from '../../pages/home/multichain/settings/MigrationPage';
import { useBuyNotification } from '../../components/modals/BuyNotificationControlled';
import { useAddWalletFlow } from '../../components/modals/AddWalletFlow';
import {
    BrowserDeeplinkParams,
    DappDeeplinkParams,
    PoolDeeplinkParams,
    RampDeeplinkParams,
    TradeAssetDeeplinkParams,
    TradingDeeplinkParams
} from '@tonkeeper/core/dist/service/deeplinkingService';
import { useOpenBrowserTab } from '../../state/dapp-browser';
import { useMultichainWalletAssets } from '../../state/multichain/useMultichainWalletAssets';
import { parseAssetIdHead } from '../../pages/home/multichain/multichain-utils';
import { useOpenAssetPage } from '../../pages/home/multichain/asset/useOpenAssetPage';
import { setDappBrowserOpenSource } from '../analytics/dapp-browser';
import { setStakingOpenSource } from '../analytics/staking';
import { useTradeAnalytics } from '../analytics/trade';
import { useAppSdk } from '../appSdk';

/**
 * Deeplink destinations depend on the active account's shell: a multichain
 * account renders the `/multichain` routes and keeps several flows (receive,
 * swap, stake, add funds) in the home's local state, reached through the
 * home's action query; a legacy account renders the legacy routes.
 */
const useIsMultichainAccount = () => useActiveAccount().type === 'multichain';

const multichainHomeAction = (action: string, extra?: Record<string, string>) => {
    const params = new URLSearchParams({ [MULTICHAIN_ACTION_PARAM]: action, ...extra });
    return `${MultichainRoute.home}?${params.toString()}`;
};

/** The shell has no screen for this link; the caller surfaces the error toast. */
const unsupported = () => {
    throw new Error('Unsupported link');
};

export const useOpenPoolDeeplink = () => {
    const navigate = useNavigate();
    const isMultichain = useIsMultichainAccount();
    return useCallback(
        (params: PoolDeeplinkParams) => {
            navigate(
                isMultichain
                    ? `${MultichainRoute.staking}/${encodeURIComponent(params.poolAddress)}`
                    : AppRoute.staking + StakingRoute.pool + '/' + params.poolAddress
            );
        },
        [navigate, isMultichain]
    );
};

export const useOpenStakingDeeplink = () => {
    const navigate = useNavigate();
    const isMultichain = useIsMultichainAccount();
    return useCallback(() => {
        if (isMultichain) {
            navigate(multichainHomeAction(MULTICHAIN_ACTION_STAKE));
        } else {
            setStakingOpenSource('deeplink');
            navigate(AppRoute.staking);
        }
    }, [navigate, isMultichain]);
};

export const useOpenBuyTonDeeplink = () => {
    const navigate = useNavigate();
    const isMultichain = useIsMultichainAccount();
    const { onOpen } = useBuyNotification();
    return useCallback(() => {
        if (isMultichain) {
            navigate(
                multichainHomeAction(MULTICHAIN_ACTION_ADD_FUNDS, {
                    [MULTICHAIN_ACTION_FROM_PARAM]: 'deep_link'
                })
            );
        } else {
            onOpen();
        }
    }, [navigate, isMultichain, onOpen]);
};

/**
 * The ramp hints (`ft`, `tt`, `fn`, `tn`, `cm`, `it`) are not applied: the web
 * Add Funds flow picks the asset and method interactively.
 */
export const useOpenDepositDeeplink = () => {
    const navigate = useNavigate();
    const isMultichain = useIsMultichainAccount();
    const { onOpen: openBuy } = useBuyNotification();
    return useCallback(
        (_params: RampDeeplinkParams) => {
            if (isMultichain) {
                navigate(
                    multichainHomeAction(MULTICHAIN_ACTION_ADD_FUNDS, {
                        [MULTICHAIN_ACTION_FROM_PARAM]: 'deep_link'
                    })
                );
            } else {
                openBuy();
            }
        },
        [navigate, isMultichain, openBuy]
    );
};

/**
 * Cash sell lives on the asset page, so the link needs an asset: `ft` names
 * the token symbol and `fn` optionally narrows it to a network code. A link
 * that matches nothing in the wallet is unsupported rather than guessed.
 */
export const useOpenWithdrawDeeplink = () => {
    const navigate = useNavigate();
    const isMultichain = useIsMultichainAccount();
    const { data } = useMultichainWalletAssets();
    return useCallback(
        (params: RampDeeplinkParams) => {
            if (!isMultichain || !params.fromToken) return unsupported();
            const symbol = params.fromToken.toLowerCase();
            const network = params.fromNetwork?.toLowerCase();
            const asset = data?.assets.find(
                a =>
                    a.symbol.toLowerCase() === symbol &&
                    (!network || parseAssetIdHead(a.assetId).network === network)
            );
            if (!asset) return unsupported();
            const query = new URLSearchParams({
                [MULTICHAIN_ACTION_PARAM]: MULTICHAIN_ACTION_SELL
            });
            navigate(`${MultichainRoute.asset}/${encodeURIComponent(asset.assetId)}?${query}`);
        },
        [navigate, isMultichain, data]
    );
};

export const useOpenBatteryDeeplink = () => {
    const navigate = useNavigate();
    const isMultichain = useIsMultichainAccount();
    return useCallback(() => {
        navigate(
            isMultichain
                ? MultichainRoute.settings + MultichainSettingsRoute.battery
                : AppRoute.walletSettings + WalletSettingsRoute.battery
        );
    }, [navigate, isMultichain]);
};

/**
 * `tonkeeper://migration` / `migrate`. Only a multichain account has a
 * migration destination, so the link is a silent no-op on legacy
 * profiles — the same guard the natives apply before opening the flow.
 */
export const useOpenMigrationDeeplink = () => {
    const navigate = useNavigate();
    const isMultichain = useIsMultichainAccount();
    return useCallback(() => {
        if (!isMultichain) {
            return;
        }
        navigate(
            `${
                MultichainRoute.settings + MultichainSettingsRoute.migration
            }?${MIGRATION_FROM_PARAM}=deeplink`
        );
    }, [navigate, isMultichain]);
};

export const useOpenBrowserDeeplink = () => {
    const navigate = useNavigate();
    const isMultichain = useIsMultichainAccount();
    const { mutate: openBrowserTab } = useOpenBrowserTab();
    const sdk = useAppSdk();
    return useCallback(
        (params: BrowserDeeplinkParams) => {
            setDappBrowserOpenSource('deep_link');
            if (sdk.dappBrowser) {
                openBrowserTab('blanc');
            } else if (isMultichain) {
                const query = params.network
                    ? `?${new URLSearchParams({
                          [MULTICHAIN_BROWSER_CHAIN_PARAM]: params.network
                      })}`
                    : '';
                navigate(MultichainRoute.browser + query);
            } else {
                navigate(AppRoute.browser);
            }
        },
        [navigate, isMultichain, openBrowserTab, sdk]
    );
};

/** Shells without an in-app dApp browser hand the URL to the system browser. */
export const useOpenDappDeeplink = () => {
    const { mutate: openBrowserTab } = useOpenBrowserTab();
    const sdk = useAppSdk();
    return useCallback(
        (params: DappDeeplinkParams) => {
            if (sdk.dappBrowser) {
                setDappBrowserOpenSource('deep_link');
                openBrowserTab({ url: params.url });
            } else {
                void sdk.openPage(params.url);
            }
        },
        [openBrowserTab, sdk]
    );
};

export const useOpenTradingDeeplink = () => {
    const navigate = useNavigate();
    const isMultichain = useIsMultichainAccount();
    const tradeAnalytics = useTradeAnalytics();
    return useCallback(
        (params: TradingDeeplinkParams) => {
            if (!isMultichain) return unsupported();
            tradeAnalytics.started('deep_link');
            navigate(
                params.shelf
                    ? `${MultichainRoute.tradeCrypto}?${new URLSearchParams({
                          shelf: params.shelf
                      })}`
                    : MultichainRoute.trade
            );
        },
        [navigate, isMultichain, tradeAnalytics]
    );
};

export const useOpenTradeAssetDeeplink = () => {
    const isMultichain = useIsMultichainAccount();
    const openAssetPage = useOpenAssetPage();
    return useCallback(
        (params: TradeAssetDeeplinkParams) => {
            if (!isMultichain) return unsupported();
            openAssetPage(params.assetId, 'deep_link');
        },
        [isMultichain, openAssetPage]
    );
};

export const useOpenReceiveDeeplink = () => {
    const navigate = useNavigate();
    const isMultichain = useIsMultichainAccount();
    const sdk = useAppSdk();
    return useCallback(() => {
        if (isMultichain) {
            navigate(multichainHomeAction(MULTICHAIN_ACTION_RECEIVE));
        } else {
            sdk.uiEvents.emit('receive', { method: 'receive', params: {} });
        }
    }, [navigate, isMultichain, sdk]);
};

export const useOpenBackupDeeplink = () => {
    const navigate = useNavigate();
    const isMultichain = useIsMultichainAccount();
    return useCallback(() => {
        navigate(
            isMultichain
                ? MultichainRoute.settings + MultichainSettingsRoute.backup
                : AppRoute.walletSettings + WalletSettingsRoute.recovery
        );
    }, [navigate, isMultichain]);
};

export const useOpenAddWalletDeeplink = () => {
    const { onOpen } = useAddWalletFlow();
    return useCallback(() => {
        onOpen();
    }, [onOpen]);
};

export const useOpenMainDeeplink = () => {
    const navigate = useNavigate();
    const isMultichain = useIsMultichainAccount();
    return useCallback(() => {
        navigate(isMultichain ? MultichainRoute.home : AppRoute.home);
    }, [navigate, isMultichain]);
};
