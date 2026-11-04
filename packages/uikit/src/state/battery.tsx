import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKey } from '../libs/queryKey';
import type { RechargeMethods } from '@tonkeeper/core/dist/batteryApi/models/RechargeMethods';

import {
    useActiveAccount,
    useActiveAccountQuery,
    useActiveConfig,
    useActiveTonNetwork
} from './wallet';
import { useSignTonProof } from '../hooks/accountUtils';
import { useEffect, useMemo } from 'react';
import { useAppSdk } from '../hooks/appSdk';
import {
    Account,
    AccountMAM,
    AccountMultichain,
    AccountTonMnemonic,
    isAccountTonWalletStandard
} from '@tonkeeper/core/dist/entries/account';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import BigNumber from 'bignumber.js';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { patchedTokenImage, useJettonList } from './jetton';
import { notNullish } from '@tonkeeper/core/dist/utils/types';
import { toNano } from '@ton/core';
import type { Config } from '@tonkeeper/core/dist/batteryApi/models/Config';
import type { PromoCodeBatteryPurchaseStatusErrorCodeEnum } from '@tonkeeper/core/dist/batteryApi/models/PromoCodeBatteryPurchaseStatusError';
import type {
    PurchasesPurchasesInner,
    PurchasesPurchasesInnerTypeEnum
} from '@tonkeeper/core/dist/batteryApi/models/PurchasesPurchasesInner';
import { JettonEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/jetton-encoder';
import { Configuration, ConnectApi, DefaultApi, WalletApi } from '@tonkeeper/core/dist/batteryApi';
import { getAppVersionHeaders } from '@tonkeeper/core/dist/utils/appVersion';
import {
    isTon,
    TonAsset,
    tonAssetAddressToString
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { batteryPackIcons } from '../components/settings/battery/BatteryIcons';
import { isStandardTonWallet, TonWalletStandard } from '@tonkeeper/core/dist/entries/wallet';
import { multichainApiWalletCredentials } from '@tonkeeper/core/dist/service/chainkit/walletAuthService';
import { createMultichainAuthorizedFetch } from '@tonkeeper/core/dist/service/chainkit/multichainApiAuth';
import { useTwoFAWalletConfig } from './two-fa';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from './tonendpoint';
import { removeLastSlash } from '@tonkeeper/core/dist/utils/url';

/**
 * Accounts whose TON key the app itself holds and can sign a proof with. A
 * multichain (BIP39) account qualifies through its TON wallet, exactly like a
 * TON mnemonic — the relayer keys the battery on that wallet's address.
 */
const isAccountBatteryCapable = (
    account: Account
): account is AccountTonMnemonic | AccountMAM | AccountMultichain =>
    account.type === 'mnemonic' || account.type === 'mam' || account.type === 'multichain';

const useIsAccountSuitableForBattery = () => {
    const network = useActiveTonNetwork();
    const { data: twoFAWalletConfig } = useTwoFAWalletConfig();
    const account = useActiveAccount();

    const isAccountSuitable = isAccountBatteryCapable(account);

    let disableDueToTwoFA = false;
    if (network === Network.MAINNET) {
        disableDueToTwoFA =
            twoFAWalletConfig?.status === 'active' || twoFAWalletConfig?.status === 'disabling';
    }

    return isAccountSuitable && !disableDueToTwoFA;
};

const useCanSpendBattery = () => {
    const batteryEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.BATTERY);
    const { data: balance } = useBatteryBalance();

    if (batteryEnabled) {
        return true;
    }

    return balance?.batteryUnitsBalance.gt(0);
};

export const useCanSeeBattery = () => {
    const isAccountSuitable = useIsAccountSuitableForBattery();
    const canViewOrSpend = useCanSpendBattery();
    return isAccountSuitable && canViewOrSpend;
};

export const useCanBuyBattery = () => {
    const isAccountSuitable = useIsAccountSuitableForBattery();
    const batteryEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.BATTERY);
    return isAccountSuitable && batteryEnabled;
};

/**
 * A multichain wallet is identified to the battery service the way the
 * native apps do it: device JWT plus `X-Wallet-ID` / `X-Wallet-Authorization`
 * alongside the TonProof token. The backend keys the multichain wallet's
 * battery on that id, so with the TonProof alone the web would read (and
 * spend) the balance of a different, address-keyed account.
 */
export const useBatteryApi = () => {
    const config = useActiveConfig();
    const { data: account } = useActiveAccountQuery();
    const credentials = account ? multichainApiWalletCredentials(account) : undefined;
    const walletId = credentials?.walletId;
    const walletAuthKey = credentials?.walletAuthKey;
    return useMemo(() => {
        return new Configuration({
            basePath: removeLastSlash(config.batteryHost),
            headers: getAppVersionHeaders(),
            fetchApi: walletId
                ? createMultichainAuthorizedFetch({ walletId, walletAuthKey })
                : undefined
        });
    }, [config.batteryHost, walletId, walletAuthKey]);
};

export const useBatteryServiceConfigNonSuspense = () => {
    const batteryApi = useBatteryApi();
    return useQuery<Config>([QueryKey.batteryServiceConfig], () =>
        new DefaultApi(batteryApi).getConfig()
    );
};

/**
 * Undefined until the battery service answers. Hooks mounted on the home read
 * it, so a missing config must not throw during render — callers check it at
 * the point they actually build a battery transfer.
 */
export const useBatteryServiceConfig = (): Config | undefined =>
    useBatteryServiceConfigNonSuspense().data;

export const requireBatteryServiceConfig = (config: Config | undefined): Config => {
    if (!config) {
        throw new Error('Battery service config not found');
    }
    return config;
};

export const useBatteryOnChainRechargeMethods = () => {
    const batteryApi = useBatteryApi();

    return useQuery<RechargeMethods['methods']>(
        [QueryKey.batteryOnchainRechargeMethods],
        async () => {
            const res = await new DefaultApi(batteryApi).getRechargeMethods({
                includeRechargeOnly: false
            });
            return res.methods;
        }
    );
};

export const useBatteryAvailableRechargeMethods = () => {
    const { data: methods } = useBatteryOnChainRechargeMethods();
    const { data: jettons } = useJettonList();

    return useMemo<(RechargeMethods['methods'][number] & { key: string })[] | undefined>(() => {
        if (!methods || !jettons) {
            return undefined;
        }

        return methods
            .map(m => {
                if (m.type === 'ton') {
                    return {
                        ...m,
                        image: TON_ASSET.image,
                        key: 'ton'
                    };
                }

                if (jettons.balances.some(b => b.jetton.address === m.jettonMaster)) {
                    return {
                        ...m,
                        key: m.jettonMaster!,
                        image: patchedTokenImage(m.jettonMaster!, m.image!)
                    };
                }

                return null;
            })
            .filter(notNullish);
    }, [methods, jettons]);
};

export const useBatteryAuthToken = () => {
    const account = useActiveAccount();
    const publicKey = isAccountTonWalletStandard(account) ? account.activeTonWallet.publicKey : '';
    const sdk = useAppSdk();

    return useQuery([QueryKey.batteryAuthToken, publicKey], async () => {
        if (!publicKey) {
            return null;
        }

        const val = await sdk.storage.get<{ token: string }>(batteryAuthTokenStorageKey(publicKey));

        return val?.token ?? null;
    });
};

export const useRequestBatteryAuthToken = () => {
    const { data: account } = useActiveAccountQuery();
    const { mutateAsync: signTonProof } = useSignTonProof();
    const batteryApi = useBatteryApi();
    const sdk = useAppSdk();
    const client = useQueryClient();

    return useMutation<
        string,
        Error,
        {
            signer?: (b: Buffer) => Promise<Uint8Array | Buffer>;
            wallet?: TonWalletStandard;
            /** Overrides the active account's battery config, e.g. for a wallet of another account. */
            batteryApi?: Configuration;
        } | void
    >(async args => {
        const api = args?.batteryApi ?? batteryApi;
        let wallet = args?.wallet;
        if (!wallet) {
            if (!account || !isAccountBatteryCapable(account)) {
                throw new Error('Invalid account type');
            }
            wallet = account.activeTonWallet;
        }
        const { payload } = await new ConnectApi(api).getTonConnectPayload();
        const origin = api.basePath;

        const proof = await signTonProof({ payload, origin, signer: args?.signer, wallet });
        const res = await new WalletApi(api).tonConnectProof({
            tonConnectProofRequest: {
                address: wallet.rawAddress,
                proof: {
                    timestamp: proof.timestamp,
                    domain: {
                        value: proof.domain.value,
                        lengthBytes: proof.domain.lengthBytes
                    },
                    signature: proof.signature,
                    payload,
                    stateInit: proof.stateInit
                }
            }
        });

        await sdk.storage.set(batteryAuthTokenStorageKey(wallet.publicKey), {
            token: res.token
        });
        await client.invalidateQueries([QueryKey.batteryAuthToken]);
        return res.token;
    });
};

export const batteryAuthTokenStorageKey = (publicKey: string) =>
    `${AppKey.BATTERY_AUTH_TOKEN}_${publicKey}`;

export const useRemoveBatteryAuthToken = () => {
    const account = useActiveAccount();
    const sdk = useAppSdk();
    const client = useQueryClient();

    return useMutation(async () => {
        const tonWallets = account.allTonWallets;
        for (const wallet of tonWallets) {
            if (isStandardTonWallet(wallet)) {
                await sdk.storage.delete(batteryAuthTokenStorageKey(wallet.publicKey));
            }
        }

        await client.invalidateQueries([QueryKey.batteryAuthToken]);
    });
};

export const useProvideBatteryAuth = () => {
    const tokenQuery = useBatteryAuthToken();
    const { mutate } = useRequestBatteryAuthToken();

    useEffect(() => {
        if (tokenQuery.data !== null) {
            return;
        }

        mutate();
    }, [tokenQuery.data, mutate]);

    return tokenQuery;
};

/**
 * ton relative / unit
 */
export const useBatteryUnitTonRate = () => {
    const { batteryMeanFees } = useActiveConfig();

    return useMemo(() => new BigNumber(batteryMeanFees), [batteryMeanFees]);
};

/**
 * Calculated as follows:
 *
 * `shouldReserveTon = configReservedAmountTon - accountReservedTon`
 *
 * If the purchase is in TON, then:
 *     `min = shouldReserveTon`
 * Otherwise:
 *     `shouldReserveInJetton = shouldReserveTon * batteryUnitToTonPrice / batteryUnitToJettonPrice`
 *     If the BATTERY balance is sufficient to cover the gas fee for the purchase, then:
 *         `min = shouldReserveInJetton`
 *     Otherwise:
 *         `min = Math.MAX(shouldReserveInJetton, minJettonBootstrapValue)`
 */
export const useBatteryMinBootstrapValue = (asset: TonAsset) => {
    const { data: methods } = useBatteryOnChainRechargeMethods();
    const { data: balance } = useBatteryBalance();
    const shouldReserve = useBatteryShouldBeReservedAmount();
    const tokenRate = usePurchaseBatteryUnitTokenRate(tonAssetAddressToString(asset.address));

    return useMemo(() => {
        if (!methods || !balance || !shouldReserve || !tokenRate) {
            return undefined;
        }

        if (isTon(asset.address)) {
            return new AssetAmount({
                asset: TON_ASSET,
                weiAmount: shouldReserve.tonUnits.weiAmount
            });
        }

        const shouldReserveInTokenWei = shouldReserve.batteryUnits.multipliedBy(tokenRate);
        /**
         * if can cover jetton fees with own balance
         */
        if (
            balance.tonUnitsBalance.weiAmount.gt(
                new BigNumber((JettonEncoder.jettonTransferAmount + toNano(0.03)).toString())
            )
        ) {
            return new AssetAmount({
                asset,
                weiAmount: shouldReserveInTokenWei
            });
        }
        const method = methods.find(
            m => m.jettonMaster === tonAssetAddressToString(asset.address)
        )!;

        if (!method.minBootstrapValue) {
            return new AssetAmount({
                asset,
                weiAmount: shouldReserveInTokenWei
            });
        }

        const bootstrapValue = AssetAmount.fromRelativeAmount({
            asset,
            amount: method.minBootstrapValue
        }).weiAmount;
        const min = bootstrapValue.gt(shouldReserveInTokenWei)
            ? bootstrapValue
            : shouldReserveInTokenWei;

        return new AssetAmount({
            asset,
            weiAmount: min
        });
    }, [methods, balance, asset, shouldReserve, tokenRate]);
};

export type BatteryBalance = {
    tonUnitsBalance: AssetAmount<typeof TON_ASSET>;
    tonUnitsReserved: AssetAmount<typeof TON_ASSET>;
    batteryUnitsBalance: BigNumber;
    batteryUnitsReserved: BigNumber;
};

export const useBatteryBalance = () => {
    const { data: token } = useBatteryAuthToken();
    const batteryApi = useBatteryApi();

    const rate = useBatteryUnitTonRate();

    return useQuery<BatteryBalance | null>([QueryKey.batteryBalance, token, rate], async () => {
        if (!token) {
            return null;
        }

        const res = await new DefaultApi(batteryApi).getBalance({
            xTonConnectAuth: token,
            units: 'ton'
        });

        return {
            tonUnitsBalance: AssetAmount.fromRelativeAmount({
                asset: TON_ASSET,
                amount: res.balance
            }),
            tonUnitsReserved: AssetAmount.fromRelativeAmount({
                asset: TON_ASSET,
                amount: res.reserved
            }),
            batteryUnitsBalance: new BigNumber(res.balance)
                .div(rate)
                .integerValue(BigNumber.ROUND_FLOOR),
            batteryUnitsReserved: new BigNumber(res.reserved).div(rate)
        };
    });
};

export class BatteryPromoCodeError extends Error {
    constructor(
        readonly code: PromoCodeBatteryPurchaseStatusErrorCodeEnum | undefined,
        msg: string
    ) {
        super(msg);
        this.name = 'BatteryPromoCodeError';
    }
}

/**
 * Redeems a promo code straight into the battery balance. Resolves with the
 * credited TON amount; a rejected code surfaces as {@link BatteryPromoCodeError}
 * so the field can tell "not valid" apart from a network failure.
 */
export const useRedeemBatteryPromoCode = () => {
    const { data: token } = useBatteryAuthToken();
    const batteryApi = useBatteryApi();
    const client = useQueryClient();

    return useMutation<BigNumber, Error, string>(async promoCode => {
        if (!token) {
            throw new Error('Battery auth token is missing');
        }
        const res = await new DefaultApi(batteryApi).promoCodeBatteryPurchase({
            xTonConnectAuth: token,
            promoCodeBatteryPurchaseRequest: { promoCode: promoCode.trim() }
        });
        if (!res.success) {
            throw new BatteryPromoCodeError(
                res.error?.code,
                res.error?.msg ?? 'Promo code rejected'
            );
        }
        await client.invalidateQueries([QueryKey.batteryBalance]);
        return new BigNumber(res.balanceChange);
    });
};

export type BatteryPurchaseType = PurchasesPurchasesInnerTypeEnum;

export type BatteryPurchaseStatus = 'completed' | 'refund_pending' | 'refunded';

/** Money side of a purchase or of its refund: the charges and what was paid for them. */
export interface BatteryPurchaseValue {
    charges: number;
    /** Paid amount in `BatteryPurchase.currency`; store purchases may carry no price. */
    amount?: string;
}

export interface BatteryPurchase {
    id: number;
    type: BatteryPurchaseType;
    status: BatteryPurchaseStatus;
    timestamp: number;
    charges: number;
    amount?: string;
    currency?: string;
    /** Recipient of a gift purchase, raw TON address. */
    forAccount?: string;
    /** Part already sent back to the wallet. */
    refunded?: BatteryPurchaseValue;
    /** Part the user can still ask back. */
    refundable?: BatteryPurchaseValue;
}

const toBatteryPurchase = (raw: PurchasesPurchasesInner): BatteryPurchase => {
    const refund = raw.refundInformation;
    return {
        id: raw.purchaseId,
        type: raw.type,
        status: refund?.pendingRefund
            ? 'refund_pending'
            : refund?.fullyRefunded
            ? 'refunded'
            : 'completed',
        timestamp: new Date(raw.datetime).getTime(),
        charges: raw.charges,
        amount: raw.amount,
        currency: raw.currency,
        forAccount: raw.forAccountId,
        refunded: refund?.refunded,
        refundable: refund?.refundable
    };
};

/**
 * Every recharge of the wallet's battery, newest first, with its refund
 * state. Refunds settle on the relayer's side, so the list re-polls while
 * it is on screen to move a pending refund to refunded without a reopen.
 */
export const useBatteryPurchases = (enabled = true) => {
    const { data: token } = useBatteryAuthToken();
    const batteryApi = useBatteryApi();

    return useQuery<BatteryPurchase[]>(
        [QueryKey.batteryPurchases, token],
        async () => {
            const res = await new DefaultApi(batteryApi).getPurchases({
                xTonConnectAuth: token!,
                includeGiftsOnTheWay: true
            });
            return res.purchases.map(toBatteryPurchase).sort((a, b) => b.timestamp - a.timestamp);
        },
        { enabled: enabled && !!token, refetchInterval: 10_000 }
    );
};

export const useRequestBatteryRefund = () => {
    const { data: token } = useBatteryAuthToken();
    const batteryApi = useBatteryApi();
    const client = useQueryClient();

    return useMutation<void, Error, number>(async purchaseId => {
        if (!token) {
            throw new Error('Battery auth token is missing');
        }
        await new DefaultApi(batteryApi).requestRefund({
            xTonConnectAuth: token,
            requestRefundRequest: { purchaseId }
        });
        await client.invalidateQueries([QueryKey.batteryPurchases]);
        await client.invalidateQueries([QueryKey.batteryBalance]);
    });
};

export const useBatteryShouldBeReservedAmount = () => {
    const { data: balance } = useBatteryBalance();
    const config = useActiveConfig();
    const rate = useBatteryUnitTonRate();

    return useMemo(() => {
        if (!balance) {
            return undefined;
        }

        const configReservedAmount = new BigNumber(config.batteryReservedAmount);

        const tonUnitsToReserve = configReservedAmount.minus(
            balance.tonUnitsReserved.relativeAmount
        );

        return {
            tonUnits: AssetAmount.fromRelativeAmount({
                asset: TON_ASSET,
                amount: tonUnitsToReserve
            }),
            batteryUnits: tonUnitsToReserve.div(rate)
        };
    }, [balance, config, rate]);
};

/**
 * token relative/unit
 * @param assetAddress
 */
export const usePurchaseBatteryUnitTokenRate = (assetAddress: string) => {
    const { data: methods } = useBatteryOnChainRechargeMethods();
    const unitTonRate = useBatteryUnitTonRate();

    return useMemo(() => {
        if (!methods) {
            return undefined;
        }

        if (assetAddress.toUpperCase() === TON_ASSET.address) {
            return unitTonRate.div(methods.find(m => m.type === 'ton')!.rate);
        }

        /**
         * api rate is ton / jetton
         */
        return unitTonRate.div(methods.find(m => m.jettonMaster === assetAddress)!.rate);
    }, [methods, assetAddress, unitTonRate]);
};

export type BatteryPackName = keyof typeof batteryPackIcons;

const isBatteryPackName = (name: string): name is BatteryPackName => name in batteryPackIcons;

/**
 * The fixed packs the Battery service offers, largest first. Its `other` entry
 * is the custom amount, which every screen renders as its own row.
 */
export const useBatteryPacks = () => {
    const rate = useBatteryUnitTonRate();
    const { data: serviceConfig } = useBatteryServiceConfigNonSuspense();

    return useMemo(
        () =>
            serviceConfig?.packages.flatMap(pkg => {
                const name = pkg.name;
                if (!isBatteryPackName(name) || pkg.charges <= 0) {
                    return [];
                }

                const value = AssetAmount.fromRelativeAmount({
                    asset: TON_ASSET,
                    amount: rate.multipliedBy(pkg.charges)
                });

                return [
                    {
                        id: name,
                        name,
                        price: value,
                        value,
                        image: batteryPackIcons[name]
                    }
                ];
            }),
        [rate, serviceConfig]
    );
};

export const useBatteryPacksReservedApplied = () => {
    const packs = useBatteryPacks();
    const reserveAmount = useBatteryShouldBeReservedAmount();

    return useMemo(() => {
        if (!packs || !reserveAmount) {
            return undefined;
        }

        return packs.map(p => ({
            ...p,
            value: AssetAmount.fromRelativeAmount({
                asset: TON_ASSET,
                amount: p.value.relativeAmount.minus(reserveAmount.tonUnits.relativeAmount)
            })
        }));
    }, [packs, reserveAmount]);
};
