import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { comment, internal, SendMode } from '@ton/core';
import BigNumber from 'bignumber.js';

import { TonEstimation } from '@tonkeeper/core/dist/entries/send';
import { NotEnoughBalanceError } from '@tonkeeper/core/dist/errors/NotEnoughBalanceError';
import { NotEnoughBatteryBalanceError } from '@tonkeeper/core/dist/errors/NotEnoughBatteryBalanceError';
import { NFTEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/nft-encoder';
import { WalletMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';

import {
    BATTERY_SENDER_CHOICE,
    EXTERNAL_SENDER_CHOICE,
    useGetEstimationSender
} from '../useSender';
import { useTonRawTransactionService } from '../useBlockchainService';
import { useToQueryKeyPart } from '../../useToQueryKeyPart';
import { QueryKey } from '../../../libs/queryKey';
import { useActiveAccount, useActiveTonWalletConfig } from '../../../state/wallet';
import {
    useBatteryAuthToken,
    useBatteryBalance,
    useCanSeeBattery,
    useRequestBatteryAuthToken
} from '../../../state/battery';

export interface NftTransferParams {
    nftAddress: string;
    /** Resolved recipient — a raw or friendly TON address, never a domain. */
    recipientAddress: string;
    comment?: string;
}

/** Ways to pay an NFT transfer's fee, in the native order: the chain coin, then Battery. */
export type NftTransferFeeMethod = typeof EXTERNAL_SENDER_CHOICE | typeof BATTERY_SENDER_CHOICE;
export type NftTransferFeeMethodType = NftTransferFeeMethod['type'];

export interface NftTransferFeeEstimate {
    method: NftTransferFeeMethod;
    estimation: TonEstimation | undefined;
    isLoading: boolean;
    isError: boolean;
    /** The paying balance can't cover this method: TON for the attached coins plus the fee, battery for the charges. */
    insufficient: boolean;
    refetch: () => void;
}

// What the wallet is emulated as holding when it can't cover the transfer:
// the attached coins plus a reserve for gas, as iOS does for raw transfers.
const SHORT_BALANCE_EMULATION_RESERVE = 1_000_000_000n;

interface NftTransferPricing {
    estimation: TonEstimation;
    /** Priced with an emulated balance: the wallet can't pay this method. */
    shortBalance: boolean;
}

export const encodeNftTransfer = (
    walletAddress: string,
    params: NftTransferParams,
    responseAddress: string | undefined,
    nftTransferAmountWei?: BigNumber
) =>
    new NFTEncoder(walletAddress).encodeNftTransfer({
        nftAddress: params.nftAddress,
        recipientAddress: params.recipientAddress,
        forwardPayload: params.comment ? comment(params.comment) : null,
        nftTransferAmountWei,
        responseAddress
    });

/**
 * Battery is listed whenever the wallet can use it and has NFT fees enabled
 * for it, as on iOS — even with no charges or before the wallet has
 * authorised with the battery service, so the picker can lead to a recharge.
 */
const useNftTransferFeeMethods = (enabled: boolean) => {
    const account = useActiveAccount();
    const canUseBattery = useCanSeeBattery();
    const { data: config } = useActiveTonWalletConfig();
    return useMemo((): { methods: NftTransferFeeMethod[] | undefined; isLoading: boolean } => {
        if (!enabled) return { methods: undefined, isLoading: false };
        if (
            account.type !== 'multichain' &&
            account.type !== 'mnemonic' &&
            account.type !== 'mam'
        ) {
            return { methods: [EXTERNAL_SENDER_CHOICE], isLoading: false };
        }
        if (config === undefined) return { methods: undefined, isLoading: true };
        return {
            methods:
                canUseBattery && config.batterySettings.enabledForNfts
                    ? [EXTERNAL_SENDER_CHOICE, BATTERY_SENDER_CHOICE]
                    : [EXTERNAL_SENDER_CHOICE],
            isLoading: false
        };
    }, [enabled, account.type, canUseBattery, config]);
};

const useNftTransferFeeEstimates = ({
    params,
    methods,
    tonBalance,
    batteryAuthPending,
    enabled
}: {
    params: NftTransferParams | undefined;
    methods: NftTransferFeeMethod[] | undefined;
    tonBalance: BigNumber | undefined;
    batteryAuthPending: boolean;
    enabled: boolean;
}): NftTransferFeeEstimate[] => {
    const rawTransactionService = useTonRawTransactionService();
    const walletAddress = useActiveAccount().activeTonWallet.rawAddress;
    const { data: batteryBalance } = useBatteryBalance();
    const { data: batteryAuthToken } = useBatteryAuthToken();
    const getExternalSender = useGetEstimationSender(EXTERNAL_SENDER_CHOICE);
    const getBatterySender = useGetEstimationSender(BATTERY_SENDER_CHOICE);
    // One stable key part per sender: the helper tracks identity, so a fresh
    // array literal here would re-key (and restart) the estimates every render.
    const externalSenderKey = useToQueryKeyPart(getExternalSender);
    const batterySenderKey = useToQueryKeyPart(getBatterySender);
    const senderKey = `${externalSenderKey}:${batterySenderKey}`;

    const senderOf = (method: NftTransferFeeMethod) =>
        method.type === 'external' ? getExternalSender : getBatterySender;
    // The battery estimate itself would request the auth proof; that is
    // driven explicitly by the relay hook instead, so a declined unlock
    // leaves an unpayable row rather than a failed estimate.
    const canPrice = (method: NftTransferFeeMethod) =>
        method.type === 'external' || !!batteryAuthToken;

    const queries = useQueries({
        queries: (methods ?? []).map(method => ({
            queryKey: [
                QueryKey.estimate,
                'nft-transfer',
                method.type,
                params?.nftAddress,
                params?.recipientAddress,
                params?.comment,
                walletAddress,
                senderKey
            ],
            queryFn: async (): Promise<NftTransferPricing> => {
                const getSender = senderOf(method);
                if (!getSender) throw new Error('Fee method is not ready');
                const sender = await getSender();
                const transfer = encodeNftTransfer(walletAddress, params!, sender.excessAddress);
                try {
                    return {
                        estimation: await rawTransactionService.estimate(sender, transfer),
                        shortBalance: false
                    };
                } catch (e) {
                    // The service refuses to emulate what the wallet can't
                    // afford; the coin row still shows what it would cost.
                    if (
                        !(
                            e instanceof NotEnoughBalanceError &&
                            sender instanceof WalletMessageSender
                        )
                    ) {
                        throw e;
                    }
                    const estimation = await sender.estimate(
                        {
                            messages: [internal(transfer)],
                            sendMode: SendMode.IGNORE_ERRORS
                        },
                        { emulationBalance: transfer.value + SHORT_BALANCE_EMULATION_RESERVE }
                    );
                    return { estimation, shortBalance: true };
                }
            },
            enabled: enabled && !!params && !!senderOf(method) && canPrice(method),
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
        let insufficient = shortBalance || !canPrice(method);
        if (q?.data?.shortBalance) {
            insufficient = true;
        } else if (estimation) {
            if (method.type === 'external') {
                const fee =
                    estimation.fee.type === 'ton-asset' ? estimation.fee.extra.weiAmount : 0;
                const required = new BigNumber(NFTEncoder.nftTransferBase.toString()).plus(fee);
                insufficient = !!tonBalance && tonBalance.lt(required);
            } else {
                insufficient =
                    estimation.fee.type === 'battery' &&
                    !!batteryBalance &&
                    batteryBalance.batteryUnitsBalance.lt(estimation.fee.charges);
            }
        }
        return {
            method,
            estimation,
            isLoading:
                (!!q && q.isLoading && q.fetchStatus !== 'idle' && canPrice(method)) ||
                (method.type === 'battery' && batteryAuthPending),
            isError: !!q?.isError && !shortBalance,
            insufficient,
            refetch: () => void q?.refetch()
        };
    });
};

/**
 * Default method, as on iOS: Battery when it has the charges, else the chain
 * coin when the wallet can afford it, else the first method (so the row
 * still shows the shortfall).
 */
const pickDefaultNftTransferFeeMethod = (
    estimates: NftTransferFeeEstimate[]
): NftTransferFeeMethodType | undefined => {
    if (estimates.length === 0) return undefined;
    const affordable = (type: NftTransferFeeMethodType) =>
        estimates.some(e => e.method.type === type && e.estimation && !e.insufficient);
    if (affordable('battery')) return 'battery';
    if (affordable('external')) return 'external';
    return estimates[0].method.type;
};

/**
 * Prices an NFT transfer with every fee method the wallet may use and keeps
 * the picked one. Inactive (no requests) until `params` is set.
 */
export const useEstimateNftTransfer = (
    params: NftTransferParams | undefined,
    /** Chain-coin balance of the TON wallet, in nanotons. */
    tonBalance: BigNumber | undefined
) => {
    const active = params !== undefined;
    const { methods, isLoading: methodsLoading } = useNftTransferFeeMethods(active);

    // On web the battery auth proof is signed by the TON wallet, so the
    // confirm requests it once when Battery is on the list and the wallet
    // has not authorised yet, as the swap confirm does. Declining leaves
    // Battery unpayable with Recharge.
    const { data: batteryAuthToken } = useBatteryAuthToken();
    const batteryAuth = useRequestBatteryAuthToken();
    const requestBatteryAuth = batteryAuth.mutate;
    const batteryListed = !!methods?.some(m => m.type === 'battery');
    useEffect(() => {
        if (active && batteryListed && batteryAuthToken === null) requestBatteryAuth();
    }, [active, batteryListed, batteryAuthToken, requestBatteryAuth]);

    const estimates = useNftTransferFeeEstimates({
        params,
        methods,
        tonBalance,
        batteryAuthPending: batteryListed && batteryAuthToken === null && batteryAuth.isLoading,
        enabled: active
    });

    // A method that fails to price leaves the picker, as on iOS. Only when
    // every method failed is the failure shown on the row, with a retry.
    const usable = estimates.filter(e => !e.isError && (e.estimation || e.insufficient));
    const pending = active && (methodsLoading || estimates.some(e => e.isLoading));
    const allFailed = active && !pending && estimates.length > 0 && usable.length === 0;

    // The default is chosen once every method is priced, so the row doesn't
    // hop between methods as estimates land. A manual pick sticks; the
    // default is re-chosen only if the current method drops out.
    const [selectedType, setSelectedType] = useState<NftTransferFeeMethodType>();
    const usableSignature = usable.map(e => `${e.method.type}:${e.insufficient}`).join('|');
    useEffect(() => {
        if (!active || pending) return;
        if (selectedType && usable.some(e => e.method.type === selectedType)) return;
        setSelectedType(pickDefaultNftTransferFeeMethod(usable));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, pending, usableSignature, selectedType]);
    useEffect(() => {
        if (!active) setSelectedType(undefined);
    }, [active]);

    const selected = pending ? undefined : usable.find(e => e.method.type === selectedType);

    return {
        estimates,
        usable,
        selected,
        selectedType,
        setSelectedType,
        pending,
        allFailed,
        // As on iOS the picker also opens for a lone method that can't pay,
        // since that is where the recharge / add-funds actions live.
        canPick: usable.length > 1 || !!selected?.insufficient,
        refetchAll: () => estimates.forEach(e => e.refetch())
    };
};
