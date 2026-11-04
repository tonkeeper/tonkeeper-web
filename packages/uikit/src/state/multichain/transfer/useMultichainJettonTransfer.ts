import { useMemo } from 'react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import BigNumber from 'bignumber.js';

import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { packAssetId } from '@tonkeeper/core/dist/entries/crypto/asset/basic-asset';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { scaledUIMultiplierOne } from '@tonkeeper/core/dist/entries/crypto/asset/scaled-ui';
import {
    TonAsset,
    shouldHideTonJettonImageCorners
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TonEstimation } from '@tonkeeper/core/dist/entries/send';
import { NotEnoughBalanceError } from '@tonkeeper/core/dist/errors/NotEnoughBalanceError';
import { NotEnoughBatteryBalanceError } from '@tonkeeper/core/dist/errors/NotEnoughBatteryBalanceError';
import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';
import { multichainApiWalletCredentials } from '@tonkeeper/core/dist/service/chainkit/walletAuthService';
import { JettonEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/jetton-encoder';
import { WalletMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import { JettonVerificationType } from '@tonkeeper/core/dist/tonApiV2';
import { normalizeAnalyticsAssetId } from '@tonkeeper/core/dist/analytics/asset-id';

import {
    toAnalyticsAmount,
    toAnalyticsFeeAsset,
    TransferInitiatedBy,
    useTrackTransactionSent
} from '../../../hooks/analytics/events-hooks';
import {
    BATTERY_SENDER_CHOICE,
    EXTERNAL_SENDER_CHOICE,
    TonSenderChoiceUserAvailable,
    TonSenderTypeUserAvailable,
    useAvailableTonSendersChoices,
    useGetEstimationSender,
    useGetSender
} from '../../../hooks/blockchain/useSender';
import { useTonAssetTransferService } from '../../../hooks/blockchain/useBlockchainService';
import { useToQueryKeyPart } from '../../../hooks/useToQueryKeyPart';
import { QueryKey, anyOfKeysParts } from '../../../libs/queryKey';
import { parseAssetIdHead } from '../../../pages/home/multichain/multichain-utils';
import { useActiveAccount, useActiveApi } from '../../wallet';
import { useBatteryBalance } from '../../battery';
import { registerPendingActivity, schedulePostBroadcastRefresh } from './pendingActivity';

/**
 * TON jettons are the one asset class a multichain account sends through
 * the legacy TON relays (wallet / battery / gasless) instead of chain-kit —
 * the same split the native apps make. Everything else, the TON coin
 * included, pays in the chain coin via chain-kit and has no fee picker.
 */
export const isMultichainJettonAsset = (asset: MultichainWalletAsset): boolean => {
    const { network, type } = parseAssetIdHead(asset.assetId);
    return network === 'ton' && type === 'jetton';
};

const legacyVerification = (
    verification: MultichainWalletAsset['verification']
): JettonVerificationType => {
    switch (verification) {
        case 'trusted':
        case 'whitelist':
            return JettonVerificationType.Whitelist;
        case 'blacklist':
            return JettonVerificationType.Blacklist;
        default:
            return JettonVerificationType.None;
    }
};

/** The legacy `TonAsset` for a multichain jetton row; `undefined` for anything else. */
export const multichainJettonToTonAsset = (asset: MultichainWalletAsset): TonAsset | undefined => {
    if (!isMultichainJettonAsset(asset)) return undefined;
    const contract = asset.assetId.split('/')[3];
    if (!contract) return undefined;
    const address = Address.parse(contract);
    return {
        id: packAssetId(BLOCKCHAIN_NAME.TON, address),
        symbol: asset.symbol,
        name: asset.name,
        decimals: asset.decimals,
        image: asset.image || undefined,
        noImageCorners: shouldHideTonJettonImageCorners(address.toRawString()),
        address,
        blockchain: BLOCKCHAIN_NAME.TON,
        verification: legacyVerification(asset.verification),
        scaledUIMultiplier: scaledUIMultiplierOne
    };
};

/** TON a jetton transfer forwards along with the message, in nanotons; the coin-paid fee sits on top. */
export const jettonTransferForwardAmount = new BigNumber(
    JettonEncoder.jettonTransferAmount.toString()
);

export type MultichainJettonFeeMethod = TonSenderChoiceUserAvailable;
export type MultichainJettonFeeMethodType = TonSenderTypeUserAvailable;

const METHOD_ORDER: Record<MultichainJettonFeeMethodType, number> = {
    external: 0,
    battery: 1,
    gasless: 2
};

/**
 * Fee methods the wallet can pay a jetton transfer with, in the picker's
 * order: chain coin, battery, then the jetton itself. Availability follows
 * the legacy rules (battery needs charges and the "pay for tokens" setting,
 * gasless needs a W5 wallet and a relayer-supported jetton).
 */
export const useMultichainJettonFeeMethods = (asset: TonAsset | undefined) => {
    const query = useAvailableTonSendersChoices({ type: 'transfer', asset: asset ?? TON_ASSET });
    const methods = useMemo(
        () =>
            asset && query.data
                ? [...query.data].sort((a, b) => METHOD_ORDER[a.type] - METHOD_ORDER[b.type])
                : undefined,
        [asset, query.data]
    );
    return { methods, isLoading: !!asset && query.data === undefined };
};

export interface MultichainJettonTransferParams {
    asset: TonAsset;
    toAddress: string;
    /** Amount in the jetton's smallest unit. */
    amount: bigint;
    isMax: boolean;
    comment?: string;
}

const transferParams = (params: MultichainJettonTransferParams) => ({
    to: params.toAddress,
    amount: new AssetAmount({ asset: params.asset, weiAmount: params.amount.toString() }),
    isMax: params.isMax,
    payload: params.comment ? ({ type: 'comment', value: params.comment } as const) : undefined
});

// What the wallet is emulated as holding when it can't cover the transfer:
// the attached coins plus a reserve for gas, as for NFT transfers.
const SHORT_BALANCE_EMULATION_RESERVE = 1_000_000_000n;

interface JettonFeePricing {
    estimation: TonEstimation;
    /** Priced against an emulated balance because the wallet's own can't cover it. */
    shortBalance: boolean;
}

export interface MultichainJettonFeeEstimate {
    method: MultichainJettonFeeMethod;
    estimation: TonEstimation | undefined;
    isLoading: boolean;
    isError: boolean;
    /** The wallet can't cover this method's fee (plus the amount, where the fee is paid in the jetton). */
    insufficient: boolean;
    refetch: () => void;
}

/**
 * Prices every available fee method at once so the picker can show them
 * side by side. Insufficiency mirrors the native rules: the chain coin
 * must cover the fee plus the jetton-transfer forward amount, battery
 * needs at least the estimated charges, and a gasless fee that eats the
 * whole amount is unusable.
 */
export const useMultichainJettonFeeEstimates = ({
    params,
    methods,
    tonBalance,
    enabled
}: {
    params: MultichainJettonTransferParams | undefined;
    methods: MultichainJettonFeeMethod[] | undefined;
    /** Chain-coin balance of the sending TON wallet, in nanotons. */
    tonBalance: BigNumber | undefined;
    enabled: boolean;
}): MultichainJettonFeeEstimate[] => {
    const transferService = useTonAssetTransferService();
    const api = useActiveApi();
    const walletAddress = useActiveAccount().activeTonWallet.rawAddress;
    const { data: batteryBalance } = useBatteryBalance();

    const gaslessChoice = methods?.find(
        (m): m is Extract<MultichainJettonFeeMethod, { type: 'gasless' }> => m.type === 'gasless'
    );
    const getExternalSender = useGetEstimationSender(EXTERNAL_SENDER_CHOICE);
    const getBatterySender = useGetEstimationSender(BATTERY_SENDER_CHOICE);
    const getGaslessSender = useGetEstimationSender(gaslessChoice ?? EXTERNAL_SENDER_CHOICE);
    // One stable key part per sender: the helper tracks identity, so a fresh
    // array literal here would re-key (and restart) the estimates every render.
    const externalSenderKey = useToQueryKeyPart(getExternalSender);
    const batterySenderKey = useToQueryKeyPart(getBatterySender);
    const gaslessSenderKey = useToQueryKeyPart(getGaslessSender);
    const senderKey = `${externalSenderKey}:${batterySenderKey}:${gaslessSenderKey}`;

    const senderOf = (method: MultichainJettonFeeMethod) =>
        method.type === 'external'
            ? getExternalSender
            : method.type === 'battery'
            ? getBatterySender
            : getGaslessSender;

    const queries = useQueries({
        queries: (methods ?? []).map(method => ({
            queryKey: [
                QueryKey.estimate,
                'multichain-jetton',
                method.type,
                params?.asset.id,
                params?.toAddress,
                params?.amount.toString(),
                params?.isMax,
                params?.comment,
                senderKey
            ],
            queryFn: async (): Promise<JettonFeePricing> => {
                const getSender = senderOf(method);
                if (!getSender) throw new Error('Fee method is not ready');
                const sender = await getSender();
                const transfer = transferParams(params!);
                try {
                    return {
                        estimation: await transferService.estimate(sender, transfer),
                        shortBalance: false
                    };
                } catch (e) {
                    // The service refuses to emulate what the wallet can't
                    // afford; the coin row still shows what it would cost, so
                    // the shortfall can name the amount to top up.
                    if (
                        !(
                            e instanceof NotEnoughBalanceError &&
                            e.balance.asset.id === TON_ASSET.id &&
                            sender instanceof WalletMessageSender
                        )
                    ) {
                        throw e;
                    }
                    const outgoing = await new JettonEncoder(api, walletAddress).encodeTransfer({
                        ...transfer,
                        responseAddress: sender.excessAddress
                    });
                    const estimation = await sender.estimate(outgoing, {
                        emulationBalance:
                            JettonEncoder.jettonTransferAmount + SHORT_BALANCE_EMULATION_RESERVE
                    });
                    return { estimation, shortBalance: true };
                }
            },
            enabled: enabled && !!params && !!senderOf(method),
            retry: false,
            keepPreviousData: true
        }))
    });

    return (methods ?? []).map((method, i) => {
        const q = queries[i];
        const estimation = q?.data?.estimation;
        // The legacy service refuses to price a transfer the paying balance
        // can't cover; that is a disabled row, not a broken estimate.
        const shortBalance =
            q?.error instanceof NotEnoughBalanceError ||
            q?.error instanceof NotEnoughBatteryBalanceError;
        let insufficient = shortBalance;
        if (q?.data?.shortBalance) {
            insufficient = true;
        } else if (estimation) {
            if (method.type === 'external') {
                const fee =
                    estimation.fee.type === 'ton-asset' ? estimation.fee.extra.weiAmount : 0;
                const required = jettonTransferForwardAmount.plus(fee);
                insufficient = !!tonBalance && tonBalance.lt(required);
            } else if (method.type === 'battery') {
                insufficient =
                    estimation.fee.type === 'battery' &&
                    !!batteryBalance &&
                    batteryBalance.batteryUnitsBalance.lt(estimation.fee.charges);
            } else if (estimation.fee.type === 'ton-asset' && params) {
                insufficient = estimation.fee.extra.weiAmount.gte(params.amount.toString());
            }
        }
        return {
            method,
            estimation,
            isLoading: !!q && q.isLoading && q.fetchStatus !== 'idle',
            isError: !!q?.isError && !shortBalance,
            insufficient,
            refetch: () => void q?.refetch()
        };
    });
};

/**
 * Default method, native-style: battery when it has the charges, else the
 * first method the wallet can actually afford, else the chain coin.
 */
export const pickDefaultJettonFeeMethod = (
    estimates: MultichainJettonFeeEstimate[]
): MultichainJettonFeeMethodType | undefined => {
    if (estimates.length === 0) return undefined;
    const battery = estimates.find(e => e.method.type === 'battery');
    if (battery?.estimation && !battery.insufficient) return 'battery';
    const affordable = estimates.find(e => e.estimation && !e.insufficient);
    return affordable?.method.type ?? estimates[0].method.type;
};

export interface MultichainJettonSendInput extends MultichainJettonTransferParams {
    method: MultichainJettonFeeMethod;
    estimation: TonEstimation;
    /** Backend asset id of the sent jetton, for the pending-activity report and analytics. */
    assetId: string;
    initiatedBy?: TransferInitiatedBy;
}

export const useMultichainJettonSend = () => {
    const account = useActiveAccount();
    const client = useQueryClient();
    const getSender = useGetSender();
    const transferService = useTonAssetTransferService();
    const trackTransactionSent = useTrackTransactionSent();

    return useMutation<{ hash: string | undefined }, Error, MultichainJettonSendInput>(
        async input => {
            const external = await transferService.send(
                await getSender(input.method),
                input.estimation,
                transferParams(input)
            );
            const hash = external ? external.hash().toString('hex') : undefined;

            trackTransactionSent({
                category: 'transfer',
                category_detail: 'token',
                asset: normalizeAnalyticsAssetId(input.assetId),
                amount: toAnalyticsAmount(input.amount, input.asset.decimals),
                fee_asset: toAnalyticsFeeAsset(input.method.type),
                is_max: input.isMax,
                initiated_by: input.initiatedBy
            });

            if (hash) {
                void registerPendingActivity({
                    credentials: multichainApiWalletCredentials(account),
                    assetId: input.assetId,
                    txHash: hash,
                    activityType: 'send'
                }).then(() =>
                    client.invalidateQueries(anyOfKeysParts(QueryKey.multichainActivity))
                );
            }

            await client.invalidateQueries(anyOfKeysParts(QueryKey.multichainWalletAssets));
            schedulePostBroadcastRefresh(client);
            return { hash };
        }
    );
};
