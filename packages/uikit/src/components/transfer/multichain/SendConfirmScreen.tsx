import { FC, Suspense, useMemo } from 'react';
import BigNumber from 'bignumber.js';

import {
    MultichainTransferInput,
    parseTransferAsset
} from '@tonkeeper/core/dist/service/chainkit/multichainTransferService';
import { chainKitAddressTypeOfWallet } from '@tonkeeper/core/dist/service/chainkit/chainKitClient';
import { isChainKitInsufficientFunds } from '@tonkeeper/core/dist/service/chainkit/chainKitErrors';
import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { formatAmount } from '@tonkeeper/core/dist/utils/numberFormat';
import { BRAND_CONFIG } from '@tonkeeper/core/dist/config/brand';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { useTranslation } from '../../../hooks/translation';
import { useAppContext } from '../../../hooks/appContext';
import IcBatteryFlash44 from '../../../icons/components/IcBatteryFlash44';
import { TRON_SENDER_TYPE } from '../../../hooks/blockchain/sender/useTronSender';
import { useActiveWalletForChain } from '../../../state/wallet';
import {
    useMultichainEstimateTransfer,
    useMultichainSendTransfer
} from '../../../state/multichain/transfer/useMultichainTransfer';
import {
    MultichainJettonFeeEstimate,
    MultichainJettonFeeMethodType,
    MultichainJettonTransferParams,
    isMultichainJettonAsset,
    jettonTransferForwardAmount,
    multichainJettonToTonAsset,
    pickDefaultJettonFeeMethod,
    useMultichainJettonFeeEstimates,
    useMultichainJettonFeeMethods,
    useMultichainJettonSend
} from '../../../state/multichain/transfer/useMultichainJettonTransfer';
import {
    MultichainTronFeeEstimate,
    MultichainTronFeeMethodType,
    MultichainTronTransferParams,
    isMultichainTronUsdtAsset,
    pickDefaultTronFeeMethod,
    useMultichainTronFeeEstimates,
    useMultichainTronFeeMethods,
    useMultichainTronUsdtSend
} from '../../../state/multichain/transfer/useMultichainTronUsdtTransfer';
import { parseAssetIdHead } from '../../../pages/home/multichain/multichain-utils';
import { NetworkFeeValue } from './NetworkFeeValue';
import {
    FeeMethodEstimate,
    RelayedSendConfirm,
    SendConfirmScreenProps,
    SendConfirmShell,
    Shortfall,
    fiatOf,
    useNativeAsset
} from './SendConfirmShell';
import { FeeMethodBatteryIcon } from './SendFeeMethodSheet';
import { AssetIcon } from './multichainSendShared';
import { rampSourceToInitiatedBy } from '../../../hooks/analytics/send';

export type { SendConfirmScreenProps } from './SendConfirmShell';

const TON_COIN_ASSET_ID = 'ton/mainnet/coin';

/**
 * Confirm step of the multichain send flow, forked on the asset the way the
 * native apps do: TON jettons and TRON USD₮ go through the legacy relays and
 * get the fee-method picker; everything else, the TON coin included, pays
 * the fee in the chain coin through chain-kit with a plain fee row.
 */
export const SendConfirmScreen: FC<SendConfirmScreenProps> = props => {
    const { asset } = props.state;
    // The relayed paths read the battery service config through the legacy
    // suspending hook; the boundary keeps that suspension inside the sheet.
    if (isMultichainJettonAsset(asset)) {
        return (
            <Suspense fallback={null}>
                <JettonSendConfirmScreen {...props} />
            </Suspense>
        );
    }
    if (isMultichainTronUsdtAsset(asset)) {
        return (
            <Suspense fallback={null}>
                <TronUsdtSendConfirmScreen {...props} />
            </Suspense>
        );
    }
    return <ChainKitSendConfirmScreen {...props} />;
};

const ChainKitSendConfirmScreen: FC<SendConfirmScreenProps> = props => {
    const { isOpen, state } = props;
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const fromWallet = useActiveWalletForChain(state.asset.chain);

    const send = useMultichainSendTransfer();

    const { asset } = state;
    const network = parseAssetIdHead(asset.assetId).network;

    const input = useMemo<MultichainTransferInput | undefined>(() => {
        const parsed = parseTransferAsset(asset.assetId, {
            symbol: asset.symbol,
            name: asset.name,
            decimals: asset.decimals
        });
        if (!parsed || !fromWallet?.rawAddress) return undefined;
        return {
            asset: parsed,
            fromAddress: fromWallet.rawAddress,
            fromAddressType: chainKitAddressTypeOfWallet(fromWallet),
            toAddress: state.toAddress,
            amount: state.amount,
            isMax: state.isMax,
            comment: state.comment
        };
    }, [asset, fromWallet, state]);

    const estimate = useMultichainEstimateTransfer({ input, enabled: isOpen && !!input });
    const nativeAsset = useNativeAsset(network);

    const fee = useMemo(
        () =>
            estimate.data
                ? new BigNumber(estimate.data.feeAmount.toString()).shiftedBy(
                      -estimate.data.feeDecimals
                  )
                : undefined,
        [estimate.data]
    );

    const sentAmount = useMemo(
        () =>
            new BigNumber((estimate.data?.amount ?? state.amount).toString()).shiftedBy(
                -asset.decimals
            ),
        [estimate.data, state.amount, asset.decimals]
    );

    const brokeOnFunds = send.isError && isChainKitInsufficientFunds(send.error);

    // Chain-kit names a short balance only once the send fails (its fee
    // estimation even falls back to a heuristic default on failure), so
    // sufficiency is checked deterministically before sending: the native
    // coin must cover the fee, plus the amount itself when the sent asset is
    // the coin. A shortage only the chain saw (a fee the estimate under-
    // priced) opens the same sheet with the best numbers at hand; without a
    // priced fee and with the amount itself covered there are none that
    // would read as short, so the inline error stays instead.
    const shortfall = useMemo<Shortfall | undefined>(() => {
        if (!nativeAsset) return undefined;
        const describe = (required: BigNumber, of: MultichainWalletAsset): Shortfall => ({
            required: `${formatAmount(required)} ${of.symbol}`,
            balance: `${formatAmount(new BigNumber(of.balance).shiftedBy(-of.decimals))} ${
                of.symbol
            }`,
            buySymbol: of.symbol,
            buyAssetId: of.assetId
        });
        const sendsCoin = parseAssetIdHead(asset.assetId).type === 'coin';
        const coinBalance = new BigNumber(nativeAsset.balance).shiftedBy(-nativeAsset.decimals);
        const coinRequired = fee && (sendsCoin ? fee.plus(sentAmount) : fee);
        if (coinRequired?.gt(coinBalance)) return describe(coinRequired, nativeAsset);
        if (!brokeOnFunds) return undefined;
        if (!sendsCoin && sentAmount.gt(new BigNumber(asset.balance).shiftedBy(-asset.decimals))) {
            return describe(sentAmount, asset);
        }
        if (coinRequired) return describe(coinRequired, nativeAsset);
        return sendsCoin && sentAmount.gt(coinBalance)
            ? describe(sentAmount, nativeAsset)
            : undefined;
    }, [fee, nativeAsset, asset, sentAmount, brokeOnFunds]);

    return (
        <SendConfirmShell
            {...props}
            amountDisplay={sentAmount.toFixed()}
            feeLabel={t('transaction_fee')}
            fee={
                <NetworkFeeValue
                    loading={estimate.isLoading}
                    error={estimate.isError}
                    onRetry={() => estimate.refetch()}
                    value={
                        fee && estimate.data
                            ? `${formatAmount(fee)} ${estimate.data.feeSymbol}`
                            : undefined
                    }
                />
            }
            feeSub={fiatOf(fiat, fee, nativeAsset?.price)}
            feeLoading={estimate.isLoading}
            feeError={estimate.isError}
            estimating={estimate.isFetching}
            estimateError={estimate.error}
            feeAsset="coin"
            shortfall={shortfall}
            send={send}
            canSend={!!input}
            onSend={() =>
                input && send.mutate({ ...input, initiatedBy: rampSourceToInitiatedBy(state.from) })
            }
        />
    );
};

const batteryIcon = (
    <FeeMethodBatteryIcon>
        <IcBatteryFlash44 />
    </FeeMethodBatteryIcon>
);

const coinIcon = (asset: MultichainWalletAsset | undefined) =>
    asset ? <AssetIcon asset={asset} size={44} withChainBadge={false} /> : null;

const JettonSendConfirmScreen: FC<SendConfirmScreenProps> = props => {
    const { isOpen, state } = props;
    const { t } = useTranslation();

    const { asset } = state;
    const tonAsset = useMemo(() => multichainJettonToTonAsset(asset), [asset]);
    const nativeTon = useNativeAsset('ton');
    const tonBalance = useMemo(
        () => (nativeTon ? new BigNumber(nativeTon.balance) : undefined),
        [nativeTon]
    );

    const params = useMemo<MultichainJettonTransferParams | undefined>(
        () =>
            tonAsset && {
                asset: tonAsset,
                toAddress: state.toAddress,
                amount: state.amount,
                isMax: state.isMax,
                comment: state.comment
            },
        [tonAsset, state]
    );

    const { methods, isLoading: methodsLoading } = useMultichainJettonFeeMethods(tonAsset);
    const raw = useMultichainJettonFeeEstimates({
        params,
        methods,
        tonBalance,
        enabled: isOpen && !!params
    });
    const byKey = useMemo(() => new Map(raw.map(e => [e.method.type, e] as const)), [raw]);

    const estimates: FeeMethodEstimate<MultichainJettonFeeMethodType>[] = raw.map(e => ({
        key: e.method.type,
        title:
            e.method.type === 'battery'
                ? t('battery_title')
                : e.method.type === 'external'
                ? nativeTon?.symbol ?? BRAND_CONFIG.coinSymbol
                : asset.symbol,
        icon:
            e.method.type === 'battery'
                ? batteryIcon
                : coinIcon(e.method.type === 'external' ? nativeTon : asset),
        fee: e.estimation?.fee,
        isLoading: e.isLoading,
        isError: e.isError,
        insufficient: e.insufficient,
        refetch: e.refetch,
        topUp:
            e.method.type === 'battery'
                ? 'battery'
                : e.method.type === 'external'
                ? { assetId: nativeTon?.assetId ?? TON_COIN_ASSET_ID }
                : undefined
    }));

    const send = useMultichainJettonSend();

    // Paying the fee in the coin is the one method the add-funds sheet can
    // help with; battery and gasless shortfalls just disable the row.
    const shortfallFor = (
        selected: FeeMethodEstimate<MultichainJettonFeeMethodType>
    ): Shortfall | undefined => {
        if (
            selected.key !== 'external' ||
            !selected.insufficient ||
            selected.fee?.type !== 'ton-asset'
        ) {
            return undefined;
        }
        // A wallet with no coin at all has no coin row to read from.
        const symbol = nativeTon?.symbol ?? BRAND_CONFIG.coinSymbol;
        const balance = nativeTon
            ? new BigNumber(nativeTon.balance).shiftedBy(-nativeTon.decimals)
            : new BigNumber(0);
        const required = selected.fee.extra.relativeAmount
            .abs()
            .plus(jettonTransferForwardAmount.shiftedBy(-TON_ASSET.decimals));
        return {
            required: `${formatAmount(required)} ${symbol}`,
            balance: `${formatAmount(balance)} ${symbol}`,
            buySymbol: symbol,
            buyAssetId: nativeTon?.assetId ?? TON_COIN_ASSET_ID
        };
    };

    return (
        <RelayedSendConfirm
            {...props}
            estimates={estimates}
            methodsLoading={methodsLoading}
            pickDefault={list =>
                pickDefaultJettonFeeMethod(
                    list
                        .map(e => byKey.get(e.key))
                        .filter((e): e is MultichainJettonFeeEstimate => !!e)
                )
            }
            send={send}
            canSend={() => !!params}
            onSend={selected => {
                const estimate = byKey.get(selected.key);
                if (!params || !estimate?.estimation) return;
                send.mutate({
                    ...params,
                    method: estimate.method,
                    estimation: estimate.estimation,
                    assetId: asset.assetId,
                    initiatedBy: rampSourceToInitiatedBy(state.from)
                });
            }}
            shortfallFor={shortfallFor}
            jetton={tonAsset && { id: tonAsset.id, price: asset.price }}
        />
    );
};

const TronUsdtSendConfirmScreen: FC<SendConfirmScreenProps> = props => {
    const { isOpen, state } = props;
    const { t } = useTranslation();

    const { asset } = state;
    const nativeTon = useNativeAsset('ton');
    const nativeTrx = useNativeAsset('tron');
    const tonBalance = useMemo(
        () => (nativeTon ? new BigNumber(nativeTon.balance) : undefined),
        [nativeTon]
    );
    const trxBalance = useMemo(
        () => (nativeTrx ? new BigNumber(nativeTrx.balance) : undefined),
        [nativeTrx]
    );

    const params = useMemo<MultichainTronTransferParams>(
        () => ({ toAddress: state.toAddress, amount: state.amount, isMax: state.isMax }),
        [state]
    );

    const { methods, isLoading: methodsLoading } = useMultichainTronFeeMethods();
    const raw = useMultichainTronFeeEstimates({
        params,
        methods,
        tonBalance,
        trxBalance,
        enabled: isOpen
    });
    const byKey = useMemo(() => new Map(raw.map(e => [e.method, e] as const)), [raw]);

    const estimates: FeeMethodEstimate<MultichainTronFeeMethodType>[] = raw.map(e => ({
        key: e.method,
        title:
            e.method === TRON_SENDER_TYPE.BATTERY
                ? t('battery_title')
                : e.method === TRON_SENDER_TYPE.TON_ASSET
                ? nativeTon?.symbol ?? ''
                : nativeTrx?.symbol ?? 'TRX',
        icon:
            e.method === TRON_SENDER_TYPE.BATTERY
                ? batteryIcon
                : coinIcon(e.method === TRON_SENDER_TYPE.TON_ASSET ? nativeTon : nativeTrx),
        fee: e.fee,
        isLoading: e.isLoading,
        isError: e.isError,
        insufficient: e.insufficient,
        refetch: e.refetch,
        topUp:
            e.method === TRON_SENDER_TYPE.BATTERY
                ? 'battery'
                : e.method === TRON_SENDER_TYPE.TON_ASSET
                ? nativeTon && { assetId: nativeTon.assetId }
                : nativeTrx && { assetId: nativeTrx.assetId }
    }));

    const send = useMultichainTronUsdtSend();

    return (
        <RelayedSendConfirm
            {...props}
            estimates={estimates}
            methodsLoading={methodsLoading}
            pickDefault={list =>
                pickDefaultTronFeeMethod(
                    list
                        .map(e => byKey.get(e.key))
                        .filter((e): e is MultichainTronFeeEstimate => !!e)
                )
            }
            send={send}
            canSend={() => true}
            onSend={selected => {
                const estimate = byKey.get(selected.key);
                if (!estimate?.estimation) return;
                send.mutate({
                    ...params,
                    method: estimate.method,
                    estimation: estimate.estimation,
                    assetId: asset.assetId,
                    initiatedBy: rampSourceToInitiatedBy(state.from)
                });
            }}
        />
    );
};
