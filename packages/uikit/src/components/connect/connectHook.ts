import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TransferOrigin } from '@tonkeeper/core/dist/AppSdk';
import {
    ConnectEvent,
    DAppManifest,
    RpcMethod,
    TonConnectEventPayload,
    WalletResponse
} from '@tonkeeper/core/dist/entries/tonConnect';
import {
    parseAddWalletDeeplink,
    parseAssetIdTransfer,
    parseBackupDeeplink,
    parseBatteryDeeplink,
    parseBrowserDeeplink,
    parseBuyTonDeeplink,
    parseDappDeeplink,
    parseDepositDeeplink,
    parseEthereumTransferLink,
    parseMainDeeplink,
    parseMigrationDeeplink,
    parsePoolDeeplink,
    parseReceiveDeeplink,
    parseStakingDeeplink,
    parseSwapDeeplink,
    parseTonTransaction,
    parseTradeAssetDeeplink,
    parseTradingDeeplink,
    parseTronTransferWithAddress,
    parseWithdrawDeeplink,
    rewriteTonAssetIdToLegacyLink,
    seeIfBringToFrontLink,
    BrowserDeeplinkParams,
    DappDeeplinkParams,
    PoolDeeplinkParams,
    RampDeeplinkParams,
    SwapDeeplinkParams,
    TradeAssetDeeplinkParams,
    TradingDeeplinkParams
} from '@tonkeeper/core/dist/service/deeplinkingService';
import {
    connectErrorResponse,
    parseTonConnect,
    saveWalletTonConnect,
    tonConnectUserRejectError
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import {
    AccountConnectionHttp,
    TonConnectHttpConnectionParams,
    TonConnectInjectedConnectionParams
} from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { sendEventToBridge } from '@tonkeeper/core/dist/service/tonConnect/httpBridge';
import {
    isWalletConnectRedirectUrl,
    parseWalletConnectUri
} from '@tonkeeper/core/dist/service/walletConnect/wcUri';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { useToast } from '../../hooks/useNotification';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { useTonTransactionNotification } from '../modals/TonTransactionNotificationControlled';
import { useActiveAccount, useActiveApi, useActiveWallet } from '../../state/wallet';
import { requireBatteryServiceConfig, useBatteryServiceConfig } from '../../state/battery';
import { useGaslessConfig } from '../../state/gasless';
import { TonConnectError } from '@tonkeeper/core/dist/entries/exception';
import { useAppContext } from '../../hooks/appContext';

export const useProcessOpenedLink = (options?: {
    hideLoadingToast?: boolean;
    hideErrorToast?: boolean;
    /**
     * Where the link came from. Scanned links are `qr_code`; everything the OS or
     * another app hands us is a deep link.
     */
    origin?: TransferOrigin;
    onSwapDeeplink?: (params: SwapDeeplinkParams) => void;
    onPoolDeeplink?: (params: PoolDeeplinkParams) => void;
    onBuyTonDeeplink?: () => void;
    onBatteryDeeplink?: () => void;
    onMigrationDeeplink?: () => void;
    onBrowserDeeplink?: (params: BrowserDeeplinkParams) => void;
    onStakingDeeplink?: () => void;
    onDepositDeeplink?: (params: RampDeeplinkParams) => void;
    onWithdrawDeeplink?: (params: RampDeeplinkParams) => void;
    onTradingDeeplink?: (params: TradingDeeplinkParams) => void;
    onTradeAssetDeeplink?: (params: TradeAssetDeeplinkParams) => void;
    onDappDeeplink?: (params: DappDeeplinkParams) => void;
    onReceiveDeeplink?: () => void;
    onBackupDeeplink?: () => void;
    onAddWalletDeeplink?: () => void;
    onMainDeeplink?: () => void;
    onWalletConnectUri?: (uri: string) => void;
}) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const notifyError = useToast();
    const { onOpen: openTransactionNotification } = useTonTransactionNotification();
    const api = useActiveApi();
    const walletAddress = useActiveWallet().rawAddress;
    const isMultichainAccount = useActiveAccount().type === 'multichain';
    const batteryConfig = useBatteryServiceConfig();
    const gaslessConfig = useGaslessConfig();

    return useMutation<null | TonConnectHttpConnectionParams, Error, string>(async openedUrl => {
        let url = openedUrl;
        try {
            const bring = seeIfBringToFrontLink({ url });
            if (bring != null) {
                // TODO: save ret parameter and user after confirm transaction
                return null;
            }

            const showLoadingToast = () => {
                if (!options?.hideLoadingToast) {
                    sdk.uiEvents.emit('copy', {
                        method: 'copy',
                        id: Date.now(),
                        params: t('loading')
                    });
                }
            };

            // `asset_id` names the asset canonically and beats the legacy
            // `jetton` param. TON ids fold into the legacy link form and
            // continue down the TON pipeline (confirm screen, DNS
            // recipients); ids on other chains — and ERC-681 `ethereum:`
            // links — open the multichain send flow. Legacy accounts
            // ignore both, as before.
            if (isMultichainAccount) {
                const tonLegacyUrl = rewriteTonAssetIdToLegacyLink(url);
                if (tonLegacyUrl !== null) {
                    url = tonLegacyUrl;
                } else {
                    const assetTransfer =
                        parseAssetIdTransfer(url) ?? parseEthereumTransferLink(url);
                    if (assetTransfer) {
                        showLoadingToast();

                        sdk.uiEvents.emit('transfer', {
                            method: 'transfer',
                            id: Date.now(),
                            params: {
                                ...assetTransfer,
                                from: 'qr-code',
                                origin: options?.origin ?? 'deep_link'
                            }
                        });
                        return null;
                    }
                }
            }

            const transactionRequest = await parseTonTransaction(url, {
                api,
                walletAddress,
                batteryResponse: requireBatteryServiceConfig(batteryConfig).excessAccount,
                gaslessResponse: gaslessConfig?.relayAddress
            });
            if (transactionRequest) {
                if (transactionRequest.type === 'complex') {
                    openTransactionNotification({
                        params: transactionRequest.params
                    });
                } else {
                    showLoadingToast();

                    sdk.uiEvents.emit('transfer', {
                        method: 'transfer',
                        id: Date.now(),
                        params: {
                            chain: BLOCKCHAIN_NAME.TON,
                            ...transactionRequest.params,
                            from: 'qr-code',
                            origin: options?.origin ?? 'deep_link'
                        }
                    });
                }
                return null;
            }

            const tronTransfer = parseTronTransferWithAddress({ url });
            if (tronTransfer) {
                showLoadingToast();

                sdk.uiEvents.emit('transfer', {
                    method: 'transfer',
                    id: Date.now(),
                    params: {
                        chain: BLOCKCHAIN_NAME.TRON,
                        ...tronTransfer,
                        from: 'qr-code',
                        origin: options?.origin ?? 'deep_link'
                    }
                });
                return null;
            }

            const swapDeeplinkParams = parseSwapDeeplink(url);
            if (swapDeeplinkParams) {
                options?.onSwapDeeplink?.(swapDeeplinkParams);
                return null;
            }

            const poolDeeplinkParams = parsePoolDeeplink(url);
            if (poolDeeplinkParams) {
                options?.onPoolDeeplink?.(poolDeeplinkParams);
                return null;
            }

            if (parseBuyTonDeeplink(url)) {
                options?.onBuyTonDeeplink?.();
                return null;
            }

            if (parseBatteryDeeplink(url)) {
                options?.onBatteryDeeplink?.();
                return null;
            }

            if (parseMigrationDeeplink(url)) {
                options?.onMigrationDeeplink?.();
                return null;
            }

            const browserDeeplinkParams = parseBrowserDeeplink(url);
            if (browserDeeplinkParams) {
                options?.onBrowserDeeplink?.(browserDeeplinkParams);
                return null;
            }

            if (parseStakingDeeplink(url)) {
                options?.onStakingDeeplink?.();
                return null;
            }

            const depositDeeplinkParams = parseDepositDeeplink(url);
            if (depositDeeplinkParams) {
                options?.onDepositDeeplink?.(depositDeeplinkParams);
                return null;
            }

            const withdrawDeeplinkParams = parseWithdrawDeeplink(url);
            if (withdrawDeeplinkParams) {
                options?.onWithdrawDeeplink?.(withdrawDeeplinkParams);
                return null;
            }

            const tradingDeeplinkParams = parseTradingDeeplink(url);
            if (tradingDeeplinkParams) {
                options?.onTradingDeeplink?.(tradingDeeplinkParams);
                return null;
            }

            const tradeAssetDeeplinkParams = parseTradeAssetDeeplink(url);
            if (tradeAssetDeeplinkParams) {
                options?.onTradeAssetDeeplink?.(tradeAssetDeeplinkParams);
                return null;
            }

            const dappDeeplinkParams = parseDappDeeplink(url);
            if (dappDeeplinkParams) {
                options?.onDappDeeplink?.(dappDeeplinkParams);
                return null;
            }

            if (parseReceiveDeeplink(url)) {
                options?.onReceiveDeeplink?.();
                return null;
            }

            if (parseBackupDeeplink(url)) {
                options?.onBackupDeeplink?.();
                return null;
            }

            if (parseAddWalletDeeplink(url)) {
                options?.onAddWalletDeeplink?.();
                return null;
            }

            if (parseMainDeeplink(url)) {
                options?.onMainDeeplink?.();
                return null;
            }

            // WalletConnect pairing links only reach a handler where the
            // multichain WalletConnect UI is mounted (apps/web); shells
            // without one fall through to the unsupported-link error.
            if (options?.onWalletConnectUri) {
                const walletConnectUri = parseWalletConnectUri(url);
                if (walletConnectUri) {
                    options.onWalletConnectUri(walletConnectUri);
                    return null;
                }
            }

            // A `/wc` link without a pairing URI is a dApp's redirect-back
            // ping — nothing to pair, nothing to report. A present-but-
            // malformed `uri` still falls through to the error below.
            if (isWalletConnectRedirectUrl(url)) {
                return null;
            }

            const params = parseTonConnect({ url });

            if (typeof params === 'string') {
                console.error(params);
                throw new Error('Unsupported link');
            }

            showLoadingToast();

            return params;
        } catch (e) {
            if (!options?.hideErrorToast) {
                notifyError(String(e).replace(/^Error ?: ?/, ''));
            }
            throw e;
        }
    });
};

export const useCompleteHttpConnection = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const { mainnetConfig } = useAppContext();

    return useMutation<
        undefined,
        Error,
        {
            params: TonConnectHttpConnectionParams;
            result:
                | {
                      replyItems: TonConnectEventPayload;
                      manifest: DAppManifest;
                      account: Account;
                      walletId: WalletId;
                  }
                | null
                | TonConnectError;
        }
    >(async ({ params, result }) => {
        if (!result || result instanceof TonConnectError) {
            await sendEventToBridge({
                response: connectErrorResponse(result ?? tonConnectUserRejectError()),
                sessionKeyPair: params.sessionKeyPair,
                clientSessionId: params.clientSessionId,
                bridgeEndpoint: mainnetConfig.ton_connect_bridge
            });
        } else {
            const response = await saveWalletTonConnect({
                storage: sdk.storage,
                account: result.account,
                walletId: result.walletId,
                manifest: result.manifest,
                params,
                replyItems: result.replyItems
            });

            await sendEventToBridge({
                response,
                sessionKeyPair: params.sessionKeyPair,
                clientSessionId: params.clientSessionId,
                bridgeEndpoint: mainnetConfig.ton_connect_bridge
            });

            await client.invalidateQueries([QueryKey.tonConnectConnection]);

            if (sdk.notifications) {
                try {
                    const wallet = result.account.getTonWallet(result.walletId);
                    if (!wallet) {
                        throw new Error('Wallet not found');
                    }
                    const enable = await sdk.notifications.subscribed(wallet.rawAddress);
                    if (enable) {
                        await sdk.notifications.subscribeTonConnect(
                            params.clientSessionId,
                            new URL(params.request.manifestUrl).host
                        );
                    }
                } catch (e) {
                    if (e instanceof Error) sdk.topMessage(e.message);
                }
            }
        }
        await client.invalidateQueries([QueryKey.tonConnectLastEventId]);

        return undefined;
    });
};

export const useCompleteInjectedConnection = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();

    return useMutation<
        undefined,
        Error,
        {
            params: TonConnectInjectedConnectionParams;
            result:
                | {
                      replyItems: TonConnectEventPayload;
                      manifest: DAppManifest;
                      account: Account;
                      walletId: WalletId;
                  }
                | null
                | TonConnectError;
            sendBridgeResponse: (result: ConnectEvent) => void;
        }
    >(async ({ params, result, sendBridgeResponse }) => {
        if (!result || result instanceof TonConnectError) {
            sendBridgeResponse(connectErrorResponse(result ?? tonConnectUserRejectError()));
        } else {
            const response = await saveWalletTonConnect({
                storage: sdk.storage,
                account: result.account,
                walletId: result.walletId,
                manifest: result.manifest,
                params,
                replyItems: result.replyItems
            });

            sendBridgeResponse(response);

            await client.invalidateQueries([QueryKey.tonConnectConnection]);
        }

        return undefined;
    });
};

export interface ResponseSendProps {
    connection: AccountConnectionHttp;
    response: WalletResponse<RpcMethod>;
}

export const useTonConnectHttpResponseMutation = () => {
    const { mainnetConfig } = useAppContext();

    return useMutation<void, Error, ResponseSendProps>(async ({ connection, response }) => {
        return sendEventToBridge({
            response,
            sessionKeyPair: connection.sessionKeyPair,
            clientSessionId: connection.clientSessionId,
            bridgeEndpoint: mainnetConfig.ton_connect_bridge
        });
    });
};
