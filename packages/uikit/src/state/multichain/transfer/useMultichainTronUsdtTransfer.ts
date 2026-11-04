import { useCallback, useMemo } from 'react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { Cell } from '@ton/core';
import { sign } from '@ton/crypto';
import BigNumber from 'bignumber.js';
import type { Transaction } from 'tronweb/src/types/Transaction';

import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { loadChainkitWallet } from '@tonkeeper/core/dist/chains/chainkitLoader';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import { TronEstimation } from '@tonkeeper/core/dist/entries/send';
import { TronTransactionFee } from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { TronNotEnoughBalanceEstimationError } from '@tonkeeper/core/dist/errors/TronNotEnoughBalanceEstimationError';
import { MultiTransactionsSigner, TronSigner } from '@tonkeeper/core/dist/entries/signer';
import { TronWallet } from '@tonkeeper/core/dist/entries/tron/tron-wallet';
import { isStandardTonWallet } from '@tonkeeper/core/dist/entries/wallet';
import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';
import { multichainApiWalletCredentials } from '@tonkeeper/core/dist/service/chainkit/walletAuthService';
import { mnemonicToKeypair } from '@tonkeeper/core/dist/service/mnemonicService';
import { getAccountSecret } from '@tonkeeper/core/dist/service/sign/secrets';
import { ITronSender } from '@tonkeeper/core/dist/service/tron-blockchain/sender/I-tron-sender';
import { TronBatterySender } from '@tonkeeper/core/dist/service/tron-blockchain/sender/tron-battery-sender';
import { TronTonSender } from '@tonkeeper/core/dist/service/tron-blockchain/sender/tron-ton-sender';
import { TronTrxSender } from '@tonkeeper/core/dist/service/tron-blockchain/sender/tron-trx-sender';
import { TronApi } from '@tonkeeper/core/dist/tronApi';
import { normalizeAnalyticsAssetId } from '@tonkeeper/core/dist/analytics/asset-id';

import {
    toAnalyticsAmount,
    toAnalyticsFeeAsset,
    TransferInitiatedBy,
    useTrackTransactionSent
} from '../../../hooks/analytics/events-hooks';
import { TRON_SENDER_TYPE } from '../../../hooks/blockchain/sender/useTronSender';
import { useAppSdk } from '../../../hooks/appSdk';
import { useToQueryKeyPart } from '../../../hooks/useToQueryKeyPart';
import { QueryKey, anyOfKeysParts } from '../../../libs/queryKey';
import { parseAssetIdHead } from '../../../pages/home/multichain/multichain-utils';
import { useActiveAccount, useActiveApi, useActiveWalletForChain } from '../../wallet';
import {
    useBatteryApi,
    useBatteryAuthToken,
    useBatteryBalance,
    useBatteryUnitTonRate,
    useRequestBatteryAuthToken
} from '../../battery';
import { useIsTronEnabledGlobally, useTrc20TransferDefaultFees, useTronApi } from '../../tron/tron';
import { registerPendingActivity, schedulePostBroadcastRefresh } from './pendingActivity';

/**
 * TRON USD₮ is the one TRON asset the natives relay: battery, a TON-paid
 * fee, or TRX from the wallet itself. TRX and every other TRC20 stay on
 * chain-kit and pay in TRX with no picker.
 */
export const isMultichainTronUsdtAsset = (asset: MultichainWalletAsset): boolean => {
    const { network, type } = parseAssetIdHead(asset.assetId);
    return (
        network === 'tron' &&
        type === 'trc20' &&
        asset.assetId.split('/')[3] === TRON_USDT_ASSET.address
    );
};

export type MultichainTronFeeMethodType =
    | TRON_SENDER_TYPE.BATTERY
    | TRON_SENDER_TYPE.TON_ASSET
    | TRON_SENDER_TYPE.TRX;

/** Picker order, as on iOS: battery, then the TON-paid fee, then TRX. */
const METHOD_ORDER: MultichainTronFeeMethodType[] = [
    TRON_SENDER_TYPE.BATTERY,
    TRON_SENDER_TYPE.TON_ASSET,
    TRON_SENDER_TYPE.TRX
];

/** iOS keeps a 0.01 TON gas buffer on top of the TON-paid fee. */
const TON_FEE_GAS_BUFFER = new BigNumber(0.01).shiftedBy(9);

/** The multichain account's TRON wallet in the legacy senders' shape. */
export const useMultichainTronWallet = (): TronWallet | undefined => {
    const wallet = useActiveWalletForChain('tron');
    return useMemo(
        () => (wallet ? { address: wallet.rawAddress, id: wallet.id } : undefined),
        [wallet]
    );
};

const bip39Mnemonic = async (sdk: IAppSdk, account: Account): Promise<string[]> => {
    if (account.type !== 'multichain') {
        throw new Error('Multichain TRON signing needs a multichain account');
    }
    const secret = await getAccountSecret(sdk, account.id);
    if (secret.type !== 'mnemonic') {
        throw new Error('Unexpected secret type');
    }
    return secret.mnemonic;
};

/** TronWeb bound to the BIP39-derived TRON key (chain-kit's `m/44'/195'/0'/0/0`). */
const tronWebFor = async (tronApi: TronApi, mnemonic: string[]) => {
    const [chainkitWallet, { TronWeb }] = await Promise.all([
        loadChainkitWallet(),
        import('tronweb')
    ]);
    const hex = chainkitWallet.derivePrivateKeyHex(mnemonic.join(' '), 'tron');
    return new TronWeb({
        fullHost: tronApi.tronGridBaseUrl,
        privateKey: hex.startsWith('0x') ? hex.slice(2) : hex
    });
};

const multichainTronSigner =
    (sdk: IAppSdk, tronApi: TronApi, account: Account): TronSigner =>
    async (tx: Transaction) => {
        const tronWeb = await tronWebFor(tronApi, await bip39Mnemonic(sdk, account));
        return tronWeb.trx.sign(tx);
    };

/** Signs the TRON transfer and the TON fee message of a TON-paid fee in one unlock. */
const multichainMultiPayloadSigner =
    (sdk: IAppSdk, tronApi: TronApi, account: Account): MultiTransactionsSigner =>
    async txs => {
        const mnemonic = await bip39Mnemonic(sdk, account);
        const [tronWeb, tonKeyPair] = await Promise.all([
            tronWebFor(tronApi, mnemonic),
            mnemonicToKeypair(mnemonic, 'bip39')
        ]);
        return Promise.all(
            txs.map(tx =>
                tx instanceof Cell ? sign(tx.hash(), tonKeyPair.secretKey) : tronWeb.trx.sign(tx)
            )
        );
    };

const estimationOnlySigner = (): Promise<never> => {
    throw new Error('Estimation sender cannot sign');
};

/**
 * Fee methods the wallet can pay a TRON USD₮ transfer with. Battery and the
 * TON-paid fee are relayer paths, so they need the relayer switched on and
 * a battery session; TRX is always there.
 */
export const useMultichainTronFeeMethods = (): {
    methods: MultichainTronFeeMethodType[] | undefined;
    isLoading: boolean;
} => {
    const relayerEnabled = useIsTronEnabledGlobally();
    const { data: batteryAuthToken } = useBatteryAuthToken();
    const { batterySenderFee, tonSenderFee } = useTrc20TransferDefaultFees();
    const account = useActiveAccount();
    const hasTonWallet = isStandardTonWallet(account.activeTonWallet);

    return useMemo(() => {
        if (batteryAuthToken === undefined) return { methods: undefined, isLoading: true };
        const relayed = relayerEnabled && !!batteryAuthToken;
        const methods = METHOD_ORDER.filter(type => {
            switch (type) {
                case TRON_SENDER_TYPE.BATTERY:
                    return relayed && batterySenderFee.charges != null;
                case TRON_SENDER_TYPE.TON_ASSET:
                    return relayed && hasTonWallet && !tonSenderFee.ton.weiAmount.isZero();
                case TRON_SENDER_TYPE.TRX:
                    return true;
                default:
                    return false;
            }
        });
        return { methods, isLoading: false };
    }, [
        batteryAuthToken,
        relayerEnabled,
        batterySenderFee.charges,
        tonSenderFee.ton,
        hasTonWallet
    ]);
};

export interface MultichainTronTransferParams {
    toAddress: string;
    /** Amount in USD₮ smallest units. */
    amount: bigint;
    isMax: boolean;
}

const usdtAmount = (params: MultichainTronTransferParams) =>
    new AssetAmount<TronAsset>({ asset: TRON_USDT_ASSET, weiAmount: params.amount.toString() });

/** Builds a sender for each method; `forSigning` decides whether it can broadcast. */
const useTronSenderFactory = (forSigning: boolean) => {
    const sdk = useAppSdk();
    const tronApi = useTronApi();
    const tonApi = useActiveApi();
    const batteryApi = useBatteryApi();
    const account = useActiveAccount();
    const tronWallet = useMultichainTronWallet();
    const batteryUnitTonRate = useBatteryUnitTonRate();
    const { data: authToken } = useBatteryAuthToken();
    const { mutateAsync: requestAuthToken } = useRequestBatteryAuthToken();

    return useCallback(
        async (type: MultichainTronFeeMethodType): Promise<ITronSender> => {
            if (!tronWallet) throw new Error('The account has no TRON wallet');
            const tronSigner = forSigning
                ? multichainTronSigner(sdk, tronApi, account)
                : estimationOnlySigner;
            if (type === TRON_SENDER_TYPE.TRX) {
                return new TronTrxSender(tronApi, tronWallet, tronSigner);
            }
            const token = authToken ?? (forSigning ? await requestAuthToken() : undefined);
            if (!token) throw new Error('Battery session is missing');
            if (type === TRON_SENDER_TYPE.BATTERY) {
                return new TronBatterySender(
                    tronApi,
                    batteryApi,
                    tronWallet,
                    tronSigner,
                    batteryUnitTonRate,
                    token
                );
            }
            const tonWallet = account.activeTonWallet;
            if (!isStandardTonWallet(tonWallet)) {
                throw new Error('The account has no TON wallet to pay the fee from');
            }
            return new TronTonSender(
                tronApi,
                tonApi,
                batteryApi,
                tronWallet,
                tonWallet,
                forSigning
                    ? multichainMultiPayloadSigner(sdk, tronApi, account)
                    : estimationOnlySigner,
                token
            );
        },
        [
            forSigning,
            sdk,
            tronApi,
            tonApi,
            batteryApi,
            account,
            tronWallet,
            batteryUnitTonRate,
            authToken,
            requestAuthToken
        ]
    );
};

export interface MultichainTronFeeEstimate {
    method: MultichainTronFeeMethodType;
    /** The priced fee; present even when the method can't be afforded. */
    fee: TronTransactionFee | undefined;
    /** Full estimation, only when the sender could complete it — required to send. */
    estimation: TronEstimation | undefined;
    isLoading: boolean;
    isError: boolean;
    /** The paying balance can't cover this method's fee. */
    insufficient: boolean;
    refetch: () => void;
}

/**
 * A sender's estimate, or the fee it managed to price before finding the
 * paying balance short. The senders report the shortfall as an error that
 * carries the fee, so the picker can still show what the method would cost.
 */
interface TronFeeQuote {
    fee: TronTransactionFee;
    estimation?: TronEstimation;
    insufficient: boolean;
}

/** `null` when the relayer doesn't offer this method for the transfer (no TON instant fee). */
const quote = async (
    sender: ITronSender,
    to: string,
    amount: AssetAmount<TronAsset>
): Promise<TronFeeQuote | null> => {
    try {
        const estimation = await sender.estimate(to, amount);
        return { fee: estimation.fee, estimation, insufficient: false };
    } catch (e) {
        if (e instanceof TronNotEnoughBalanceEstimationError && e.fee) {
            return { fee: e.fee, insufficient: true };
        }
        if (e instanceof Error && e.message === 'Instant fee for ton not allowed') {
            return null;
        }
        throw e;
    }
};

/**
 * Prices every method for the picker. Insufficiency follows iOS: battery
 * needs the charges, the TON-paid fee needs the fee plus a 0.01 TON gas
 * buffer, TRX needs the burn amount.
 */
export const useMultichainTronFeeEstimates = ({
    params,
    methods,
    tonBalance,
    trxBalance,
    enabled
}: {
    params: MultichainTronTransferParams | undefined;
    methods: MultichainTronFeeMethodType[] | undefined;
    /** TON wallet balance in nanotons. */
    tonBalance: BigNumber | undefined;
    /** TRON wallet TRX balance in sun. */
    trxBalance: BigNumber | undefined;
    enabled: boolean;
}): MultichainTronFeeEstimate[] => {
    const makeSender = useTronSenderFactory(false);
    const senderKey = useToQueryKeyPart(makeSender);
    const tronWallet = useMultichainTronWallet();
    const { data: batteryBalance } = useBatteryBalance();

    const queries = useQueries({
        queries: (methods ?? []).map(method => ({
            queryKey: [
                QueryKey.estimate,
                'multichain-tron-usdt',
                method,
                tronWallet?.address,
                params?.toAddress,
                params?.amount.toString(),
                senderKey
            ],
            queryFn: async (): Promise<TronFeeQuote | null> =>
                quote(await makeSender(method), params!.toAddress, usdtAmount(params!)),
            enabled: enabled && !!params && !!tronWallet,
            retry: false,
            keepPreviousData: true
        }))
    });

    const estimates: (MultichainTronFeeEstimate | undefined)[] = (methods ?? []).map(
        (method, i) => {
            const q = queries[i];
            // The relayer doesn't offer this method for the transfer.
            if (q?.data === null) return undefined;
            const data = q?.data ?? undefined;
            let insufficient = !!data?.insufficient;
            if (data && !insufficient) {
                const { fee } = data;
                if (fee.type === 'battery') {
                    insufficient =
                        !!batteryBalance && batteryBalance.batteryUnitsBalance.lt(fee.charges);
                } else if (fee.type === 'ton-asset-relayed') {
                    insufficient =
                        !!tonBalance && tonBalance.lt(fee.extra.weiAmount.plus(TON_FEE_GAS_BUFFER));
                } else if (fee.type === 'tron-asset') {
                    insufficient = !!trxBalance && trxBalance.lt(fee.extra.weiAmount);
                }
            }
            return {
                method,
                fee: data?.fee,
                estimation: data?.estimation,
                isLoading: !!q && q.isLoading && q.fetchStatus !== 'idle',
                isError: !!q?.isError,
                insufficient,
                refetch: () => void q?.refetch()
            };
        }
    );
    return estimates.filter((e): e is MultichainTronFeeEstimate => !!e);
};

/**
 * iOS default: battery first; when battery lacks the charges and TRX is
 * affordable, TRX (not the TON-paid fee); otherwise the first method the
 * wallet can afford, else the first listed.
 */
export const pickDefaultTronFeeMethod = (
    estimates: MultichainTronFeeEstimate[]
): MultichainTronFeeMethodType | undefined => {
    if (estimates.length === 0) return undefined;
    const battery = estimates.find(e => e.method === TRON_SENDER_TYPE.BATTERY);
    if (battery?.fee && !battery.insufficient) return battery.method;
    const trx = estimates.find(e => e.method === TRON_SENDER_TYPE.TRX);
    if (battery?.insufficient && trx?.fee && !trx.insufficient) return trx.method;
    const affordable = estimates.find(e => e.fee && !e.insufficient);
    return affordable?.method ?? estimates[0].method;
};

export interface MultichainTronSendInput extends MultichainTronTransferParams {
    method: MultichainTronFeeMethodType;
    estimation: TronEstimation;
    /** Backend asset id of the sent USD₮, for the pending-activity report and analytics. */
    assetId: string;
    initiatedBy?: TransferInitiatedBy;
}

export const useMultichainTronUsdtSend = () => {
    const account = useActiveAccount();
    const client = useQueryClient();
    const makeSender = useTronSenderFactory(true);
    const trackTransactionSent = useTrackTransactionSent();

    return useMutation<{ hash: string }, Error, MultichainTronSendInput>(async input => {
        const sender = await makeSender(input.method);
        const hash = await sender.send(input.toAddress, usdtAmount(input), input.estimation);

        trackTransactionSent({
            category: 'transfer',
            category_detail: 'token',
            asset: normalizeAnalyticsAssetId(input.assetId),
            amount: toAnalyticsAmount(input.amount, TRON_USDT_ASSET.decimals),
            fee_asset: toAnalyticsFeeAsset(input.method),
            is_max: input.isMax,
            initiated_by: input.initiatedBy
        });

        void registerPendingActivity({
            credentials: multichainApiWalletCredentials(account),
            assetId: input.assetId,
            txHash: hash,
            activityType: 'send'
        }).then(() => client.invalidateQueries(anyOfKeysParts(QueryKey.multichainActivity)));

        await client.invalidateQueries(anyOfKeysParts(QueryKey.multichainWalletAssets));
        schedulePostBroadcastRefresh(client);
        return { hash };
    });
};
