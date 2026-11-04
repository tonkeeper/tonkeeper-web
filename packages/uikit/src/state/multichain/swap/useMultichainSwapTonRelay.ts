import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { Cell } from '@ton/core';
import BigNumber from 'bignumber.js';

import type {
    CrossSwapAsset,
    CrossSwapPrepare,
    CrossSwapRoute
} from '@tonkeeper/core/dist/swapsApi';
import {
    TON_CONNECT_MSG_VARIANTS_ID,
    TonConnectTransactionPayload
} from '@tonkeeper/core/dist/entries/tonConnect';
import { TonEstimation } from '@tonkeeper/core/dist/entries/send';
import { NotEnoughBalanceError } from '@tonkeeper/core/dist/errors/NotEnoughBalanceError';
import { NotEnoughBatteryBalanceError } from '@tonkeeper/core/dist/errors/NotEnoughBatteryBalanceError';
import {
    isSplitTonSwapRoute,
    isTokenDepositSwapRoute,
    MultichainSwapConfirmation,
    swapWalletAddress,
    tonSwapPayloadMessages,
    validateAndOrderMultichainSwapPayloads
} from '@tonkeeper/core/dist/service/chainkit/multichainSwapService';
import { getMaxMessages } from '@tonkeeper/core/dist/service/tonConnect/connectService';

import { useTonConnectTransactionService } from '../../../hooks/blockchain/useBlockchainService';
import {
    BATTERY_SENDER_CHOICE,
    EXTERNAL_SENDER_CHOICE,
    useGetEstimationSender,
    useGetSender
} from '../../../hooks/blockchain/useSender';
import { useToQueryKeyPart } from '../../../hooks/useToQueryKeyPart';
import { useAnalyticsTrack } from '../../../hooks/analytics';
import { toAnalyticsFeeAsset } from '../../../hooks/analytics/events-hooks';
import { RedMetadata } from '../../../hooks/analytics/red-operation';
import { runSwapRedOperation, toSwapAnalyticsAssetId } from '../../../hooks/analytics/swap';
import { anyOfKeysParts, QueryKey } from '../../../libs/queryKey';
import { isNativeRow, parseAssetIdHead } from '../../../pages/home/multichain/multichain-utils';
import {
    useBatteryAuthToken,
    useBatteryBalance,
    useCanSeeBattery,
    useRequestBatteryAuthToken
} from '../../battery';
import { useActiveAccount, useActiveTonWalletConfig } from '../../wallet';
import { schedulePostBroadcastRefresh } from '../transfer/pendingActivity';
import { reportPendingSwap, useMultichainSwapAddresses } from './useMultichainSwap';

/**
 * Fee methods of a relayed swap, in the native apps' order: the chain coin
 * through the wallet itself, or Battery through the relayer. There is no
 * gasless option for swaps on any platform.
 */
export type MultichainSwapFeeMethod = typeof EXTERNAL_SENDER_CHOICE | typeof BATTERY_SENDER_CHOICE;
export type MultichainSwapFeeMethodType = MultichainSwapFeeMethod['type'];

/**
 * Only a TON jetton swap can have Battery pay its fee. The native apps don't
 * offer Battery for a TON coin swap, and no other chain has a relayer.
 */
const isBatterySwapSource = (source: CrossSwapAsset): boolean =>
    parseAssetIdHead(source.assetId).network === 'ton' && !isNativeRow(source.assetId);

/**
 * Whether a swap is signed by the TON wallet sender rather than chain-kit. A
 * TON jetton swap is, so Battery can pay its fee — unless its route is a
 * jetton deposit descriptor, which is a jetton transfer rather than wallet
 * messages. A TON coin swap is only when its route is split over several
 * messages: chain-kit signs one message per transaction, and every part has
 * to go out in one. Until the route is prepared a jetton swap counts as
 * relayed and a coin swap does not.
 */
export const isRelayedSwap = (
    source: CrossSwapAsset,
    prepared: CrossSwapPrepare | undefined
): boolean => {
    if (parseAssetIdHead(source.assetId).network !== 'ton') return false;
    if (isNativeRow(source.assetId)) return !!prepared && isSplitTonSwapRoute(prepared);
    return !prepared || !isTokenDepositSwapRoute(source, prepared.payloads);
};

/** The relayer and the wallet encoder both want base64 BOCs; some providers ship hex. */
const toBase64Boc = (value: string): string => {
    try {
        Cell.fromBase64(value);
        return value;
    } catch {
        return Cell.fromBoc(Buffer.from(value, 'hex'))[0].toBoc().toString('base64');
    }
};

/**
 * The TON leg of a prepared swap as the wallet-message payload the legacy
 * senders sign. The battery variant carries the same messages: the relayer
 * wraps them and charges the fee off the wallet's battery balance.
 */
export const swapPayloadToTonConnect = (
    swap: MultichainSwapConfirmation
): TonConnectTransactionPayload => {
    const payloads = validateAndOrderMultichainSwapPayloads(swap);
    const messages = payloads.flatMap(payload =>
        tonSwapPayloadMessages(payload).map(message => ({
            address: message.address,
            amount: message.amount,
            payload: message.payload ? toBase64Boc(message.payload) : undefined
        }))
    );
    const validUntil = Math.floor(
        Math.min(...payloads.map(payload => new Date(payload.dateExpire).getTime())) / 1000
    );
    return {
        valid_until: validUntil,
        messages,
        messagesVariants: { [TON_CONNECT_MSG_VARIANTS_ID.BATTERY]: { messages } }
    };
};

/**
 * Battery is listed for a swap it can pay whenever the wallet can use it and
 * has swap fees enabled for it, as on iOS — even with no charges or before
 * the wallet has authorised with the battery service, so the picker can lead
 * to a recharge.
 */
const useMultichainSwapFeeMethods = (
    enabled: boolean,
    batteryEligible: boolean
): { methods: MultichainSwapFeeMethod[] | undefined; isLoading: boolean } => {
    const canUseBattery = useCanSeeBattery();
    const { data: config } = useActiveTonWalletConfig();
    return useMemo(() => {
        if (!enabled) return { methods: undefined, isLoading: false };
        if (!batteryEligible) return { methods: [EXTERNAL_SENDER_CHOICE], isLoading: false };
        if (config === undefined) return { methods: undefined, isLoading: true };
        const battery = canUseBattery && config.batterySettings.enabledForSwaps;
        return {
            methods: battery
                ? [EXTERNAL_SENDER_CHOICE, BATTERY_SENDER_CHOICE]
                : [EXTERNAL_SENDER_CHOICE],
            isLoading: false
        };
    }, [enabled, batteryEligible, canUseBattery, config]);
};

export interface MultichainSwapFeeEstimate {
    method: MultichainSwapFeeMethod;
    estimation: TonEstimation | undefined;
    isLoading: boolean;
    isError: boolean;
    /** The paying balance can't cover this method: TON for the attached coins plus the fee, battery for the charges. */
    insufficient: boolean;
    refetch: () => void;
}

const useMultichainSwapFeeEstimates = ({
    payload,
    methods,
    tonBalance,
    batteryAuthPending,
    enabled,
    analyticsMetadata
}: {
    payload: TonConnectTransactionPayload | undefined;
    methods: MultichainSwapFeeMethod[] | undefined;
    /** Chain-coin balance of the TON wallet, in nanotons. */
    tonBalance: BigNumber | undefined;
    /** The wallet is still authorising with the battery service; its row is loading, not unpayable. */
    batteryAuthPending: boolean;
    enabled: boolean;
    analyticsMetadata: RedMetadata;
}): MultichainSwapFeeEstimate[] => {
    const track = useAnalyticsTrack();
    const service = useTonConnectTransactionService();
    const { data: batteryBalance } = useBatteryBalance();
    const { data: batteryAuthToken } = useBatteryAuthToken();
    const getExternalSender = useGetEstimationSender(EXTERNAL_SENDER_CHOICE);
    const getBatterySender = useGetEstimationSender(BATTERY_SENDER_CHOICE);
    // One stable key part per sender: the helper tracks identity, so a fresh
    // array literal here would re-key (and restart) the estimates every render.
    const externalSenderKey = useToQueryKeyPart(getExternalSender);
    const batterySenderKey = useToQueryKeyPart(getBatterySender);
    const senderKey = `${externalSenderKey}:${batterySenderKey}`;

    const senderOf = (method: MultichainSwapFeeMethod) =>
        method.type === 'external' ? getExternalSender : getBatterySender;
    // The battery estimate itself would request the auth proof; that is
    // driven explicitly by the relay hook instead, so a declined unlock
    // leaves an unpayable row rather than a failed estimate.
    const canPrice = (method: MultichainSwapFeeMethod) =>
        method.type === 'external' || !!batteryAuthToken;

    const queries = useQueries({
        queries: (methods ?? []).map(method => ({
            queryKey: [QueryKey.estimate, 'multichain-swap-relay', method.type, payload, senderKey],
            queryFn: ({ signal }: { signal?: AbortSignal }): Promise<TonEstimation> =>
                runSwapRedOperation(
                    track,
                    {
                        operation: 'emulate',
                        errorType: 'fee_calculation_failed',
                        signal,
                        metadata: {
                            ...analyticsMetadata,
                            fee_paid_in: toAnalyticsFeeAsset(method.type)
                        }
                    },
                    async () => {
                        const getSender = senderOf(method);
                        if (!getSender) throw new Error('Fee method is not ready');
                        return service.estimate(await getSender(), payload!);
                    }
                ),
            enabled: enabled && !!payload && !!senderOf(method) && canPrice(method),
            retry: false,
            keepPreviousData: true
        }))
    });

    const attached = payload
        ? payload.messages.reduce((acc, m) => acc.plus(m.amount), new BigNumber(0))
        : new BigNumber(0);

    return (methods ?? []).map((method, i) => {
        const q = queries[i];
        const estimation = q?.data;
        // The legacy service refuses to price a transfer the paying balance
        // can't cover; that is a disabled row, not a broken estimate.
        const shortBalance =
            q?.error instanceof NotEnoughBalanceError ||
            q?.error instanceof NotEnoughBatteryBalanceError;
        let insufficient = shortBalance || !canPrice(method);
        if (estimation) {
            if (method.type === 'external') {
                const fee =
                    estimation.fee.type === 'ton-asset' ? estimation.fee.extra.weiAmount : 0;
                insufficient = !!tonBalance && tonBalance.lt(attached.plus(fee));
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
 * coin when the wallet can afford it, else whatever is affordable, else the
 * first method (so the row still shows the shortfall).
 */
export const pickDefaultSwapFeeMethod = (
    estimates: MultichainSwapFeeEstimate[]
): MultichainSwapFeeMethodType | undefined => {
    if (estimates.length === 0) return undefined;
    const battery = estimates.find(e => e.method.type === 'battery');
    if (battery?.estimation && !battery.insufficient) return 'battery';
    const coin = estimates.find(e => e.method.type === 'external');
    if (coin?.estimation && !coin.insufficient) return 'external';
    const affordable = estimates.find(e => e.estimation && !e.insufficient);
    return affordable?.method.type ?? estimates[0].method.type;
};

export interface MultichainSwapRelaySendInput {
    sourceAsset: CrossSwapAsset;
    destinationAsset: CrossSwapAsset;
    /** Swap-backend id of the prepared route `payload` was built from. */
    routeId: string;
    /** The aggregator's id of the prepared route, when the prepare minted one. */
    providerRouteId: string | undefined;
    route: CrossSwapRoute | undefined;
    payload: TonConnectTransactionPayload;
    method: MultichainSwapFeeMethod;
    estimation: TonEstimation;
}

const useMultichainSwapRelaySend = () => {
    const account = useActiveAccount();
    const client = useQueryClient();
    const getSender = useGetSender();
    const service = useTonConnectTransactionService();

    return useMutation<{ hashes: string[] }, Error, MultichainSwapRelaySendInput>(async input => {
        const boc = await service.send(
            await getSender(input.method),
            input.estimation,
            input.payload
        );
        const hash = Cell.fromBase64(boc).hash().toString('hex');

        reportPendingSwap(client, account, {
            sourceAsset: input.sourceAsset,
            destinationAsset: input.destinationAsset,
            sourceAddress: account.activeTonWallet.rawAddress,
            routeId: input.routeId,
            providerRouteId: input.providerRouteId,
            route: input.route,
            hashes: [hash]
        });

        await client.invalidateQueries(anyOfKeysParts(QueryKey.multichainWalletAssets));
        if (input.method.type === 'battery') {
            await client.invalidateQueries(anyOfKeysParts(QueryKey.batteryBalance));
        }
        schedulePostBroadcastRefresh(client);
        return { hashes: [hash] };
    });
};

/**
 * Everything the confirm screen needs to price and pay a relayed swap: the
 * priced fee methods, the picked one, and the send. Inactive (all fields
 * empty, no requests) for swaps that are not relayable.
 */
export const useMultichainSwapTonRelay = ({
    source,
    destination,
    route,
    prepared,
    unlimitedApproval,
    tonBalance,
    enabled
}: {
    source: CrossSwapAsset | undefined;
    destination: CrossSwapAsset | undefined;
    route: CrossSwapRoute | undefined;
    prepared: CrossSwapPrepare | undefined;
    unlimitedApproval: boolean;
    /** Chain-coin balance of the TON wallet, in nanotons. */
    tonBalance: BigNumber | undefined;
    enabled: boolean;
}) => {
    const account = useActiveAccount();
    const addresses = useMultichainSwapAddresses();
    const relayed = !!source && isRelayedSwap(source, prepared);
    const active = relayed && enabled;

    // A prepare that can't be signed as confirmed — expired, malformed, or
    // off the confirmed route — fails the confirm, whose retry refreshes the
    // quote behind it.
    const { payload, invalid } = useMemo(() => {
        if (!active || !source || !destination || !route || !prepared || !addresses) {
            return { payload: undefined, invalid: false };
        }
        try {
            return {
                payload: swapPayloadToTonConnect({
                    sourceAsset: source,
                    destinationAsset: destination,
                    destinationAddress: swapWalletAddress(destination.chainId, addresses),
                    prepared,
                    route,
                    unlimitedApproval
                }),
                invalid: false
            };
        } catch {
            return { payload: undefined, invalid: true };
        }
    }, [active, source, destination, route, prepared, unlimitedApproval, addresses]);
    // The wallet contract refuses a transaction with more messages than its
    // version takes, so such a route fails here rather than on-chain.
    const overMessageCap = !!payload && payload.messages.length > getMaxMessages(account);

    const { methods, isLoading: methodsLoading } = useMultichainSwapFeeMethods(
        active,
        !!source && isBatterySwapSource(source)
    );

    // iOS authorises with the battery service silently; on web the proof is
    // signed by the TON wallet, so the confirm requests it once when Battery
    // is on the list and the wallet has not authorised yet, as the Battery
    // screen does on open. Declining leaves Battery unpayable with Recharge.
    const { data: batteryAuthToken } = useBatteryAuthToken();
    const batteryAuth = useRequestBatteryAuthToken();
    const requestBatteryAuth = batteryAuth.mutate;
    const batteryListed = !!methods?.some(m => m.type === 'battery');
    useEffect(() => {
        if (active && batteryListed && batteryAuthToken === null) requestBatteryAuth();
    }, [active, batteryListed, batteryAuthToken, requestBatteryAuth]);

    const estimates = useMultichainSwapFeeEstimates({
        payload,
        methods,
        tonBalance,
        batteryAuthPending: batteryListed && batteryAuthToken === null && batteryAuth.isLoading,
        enabled: active && !overMessageCap,
        analyticsMetadata: {
            from_asset: source && toSwapAnalyticsAssetId(source.assetId),
            to_asset: destination && toSwapAnalyticsAssetId(destination.assetId),
            provider: route?.aggregator
        }
    });

    // A method that fails to price leaves the picker, as on iOS. Only when
    // every method failed is the failure shown on the row, with a retry.
    const usable =
        overMessageCap || invalid
            ? []
            : estimates.filter(e => !e.isError && (e.estimation || e.insufficient));
    const pending =
        active &&
        !overMessageCap &&
        !invalid &&
        (methodsLoading || !payload || estimates.some(e => e.isLoading));
    const allFailed =
        active &&
        !pending &&
        (overMessageCap || invalid || (estimates.length > 0 && usable.length === 0));

    // The default is chosen once every method is priced, so the row doesn't
    // hop between methods as estimates land. A manual pick sticks; the
    // default is re-chosen only if the current method drops out.
    const [selectedType, setSelectedType] = useState<MultichainSwapFeeMethodType>();
    const usableSignature = usable.map(e => `${e.method.type}:${e.insufficient}`).join('|');
    useEffect(() => {
        if (!active || pending) return;
        if (selectedType && usable.some(e => e.method.type === selectedType)) return;
        setSelectedType(pickDefaultSwapFeeMethod(usable));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, pending, usableSignature, selectedType]);
    useEffect(() => {
        if (!active) setSelectedType(undefined);
    }, [active]);

    const selected = pending ? undefined : usable.find(e => e.method.type === selectedType);
    const send = useMultichainSwapRelaySend();

    return {
        relayed,
        payload,
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
        refetchAll: () => estimates.forEach(e => e.refetch()),
        send
    };
};
