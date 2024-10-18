import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Battery } from '@tonkeeper/core/dist/batteryApi';
import { QueryKey } from '../libs/queryKey';
import type { RechargeMethods } from '@tonkeeper/core/dist/batteryApi/models/RechargeMethods';

import { useActiveAccount } from './wallet';
import { useSignTonProof } from '../hooks/accountUtils';
import { useEffect, useMemo } from 'react';
import { useAppSdk } from '../hooks/appSdk';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { useAppContext } from '../hooks/appContext';
import BigNumber from 'bignumber.js';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET, TON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { useJettonList } from './jetton';
import { tonAssetAddressToString } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { notNullish } from '@tonkeeper/core/dist/utils/types';
import { jettonTransferAmount } from '@tonkeeper/core/dist/service/transfer/jettonService';
import { toNano } from '@ton/core';

export const useBatteryApi = () => {
    const { config } = useAppContext();
    return useMemo(
        () => new Battery({ BASE: config.batteryHost || 'https://battery.tonkeeper.com' }),
        []
    );
};

export const useBatteryOnChainRechargeMethods = () => {
    return useQuery<RechargeMethods['methods']>(
        [QueryKey.batteryOnchainRechargeMethods],
        async () => {
            const res = await new Battery().default.getRechargeMethods(false);
            if ('error' in res) {
                throw new Error(res.error);
            }

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

                if (m.jetton_master === tonAssetAddressToString(TON_USDT_ASSET.address)) {
                    return { ...m, key: m.jetton_master! };
                }

                if (jettons.balances.some(b => b.jetton.address === m.jetton_master)) {
                    return { ...m, key: m.jetton_master! };
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

        const val = await sdk.storage.get<{ token: string }>(tokenStorageKey(publicKey));

        return val?.token ?? null;
    });
};

export const useRequestBatteryAuthToken = () => {
    const account = useActiveAccount();
    const { mutateAsync: signTonProof } = useSignTonProof();
    const batteryApi = useBatteryApi();
    const sdk = useAppSdk();
    const client = useQueryClient();

    return useMutation(async () => {
        if (account.type !== 'mnemonic' && account.type !== 'mam') {
            throw new Error('Invalid account type');
        }
        const { payload } = await batteryApi.connect.getTonConnectPayload();
        const origin = batteryApi.request.config.BASE;

        const proof = await signTonProof({ payload, origin });
        const res = await batteryApi.wallet.tonConnectProof({
            address: account.activeTonWallet.rawAddress,
            proof: {
                timestamp: proof.timestamp,
                domain: {
                    value: proof.domain.value,
                    length_bytes: proof.domain.lengthBytes
                },
                signature: proof.signature,
                payload,
                state_init: proof.stateInit
            }
        });

        await sdk.storage.set(tokenStorageKey(account.activeTonWallet.publicKey), {
            token: res.token
        });
        await client.invalidateQueries([QueryKey.batteryAuthToken]);
    });
};

const tokenStorageKey = (publicKey: string) => `${AppKey.BATTERY_AUTH_TOKEN}_${publicKey}`;

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

export const useBatteryUnitTonRate = () => {
    const {
        config: { batteryMeanFees }
    } = useAppContext();

    return useMemo(() => new BigNumber(batteryMeanFees || '0.0026'), [batteryMeanFees]);
};

export const useBatteryMinBootstrapValue = (assetAddress: string) => {
    const methods = useBatteryAvailableRechargeMethods();
    const { data: balance } = useBatteryBalance();

    return useMemo(() => {
        if (!methods || !balance) {
            return undefined;
        }

        if (assetAddress.toUpperCase() === TON_ASSET.address) {
            return new BigNumber(0);
        }

        if (
            balance.tonUnitsBalance.weiAmount.gt(
                new BigNumber((jettonTransferAmount + toNano(0.03)).toString())
            )
        ) {
            return new BigNumber(0);
        }
        const method = methods.find(m => m.jetton_master === assetAddress)!;

        if (!method.min_bootstrap_value) {
            return new BigNumber(0);
        }

        return new BigNumber(method.min_bootstrap_value);
    }, [methods, balance, assetAddress]);
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

        const res = await batteryApi.default.getBalance(token, 'ton');
        if ('error' in res) {
            throw new Error(res.error);
        }

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

export const useBatteryShouldBeReservedAmount = () => {
    const { data: balance } = useBatteryBalance();
    const { config } = useAppContext();
    const rate = useBatteryUnitTonRate();

    return useMemo(() => {
        if (!balance) {
            return undefined;
        }

        const configReservedAmount = new BigNumber(config.batteryReservedAmount || 0.065);

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

export const usePurchaseBatteryUnitTokenRate = (assetAddress: string) => {
    const unitTonRate = useBatteryUnitTonRate();
    const methods = useBatteryAvailableRechargeMethods();

    return useMemo(() => {
        if (!methods) {
            return undefined;
        }

        if (assetAddress.toUpperCase() === TON_ASSET.address) {
            return unitTonRate.div(methods.find(m => m.type === 'ton')!.rate);
        }

        return unitTonRate.div(methods.find(m => m.jetton_master === assetAddress)!.rate);
    }, [unitTonRate, methods, assetAddress]);
};

export const useBatteryPacks = () => {
    const rate = useBatteryUnitTonRate();

    return useMemo(
        () =>
            [
                {
                    type: 'large',
                    price: AssetAmount.fromRelativeAmount({
                        asset: TON_ASSET,
                        amount: rate.multipliedBy(400)
                    }),
                    value: AssetAmount.fromRelativeAmount({
                        asset: TON_ASSET,
                        amount: rate.multipliedBy(400)
                    })
                },
                {
                    type: 'medium',
                    price: AssetAmount.fromRelativeAmount({
                        asset: TON_ASSET,
                        amount: rate.multipliedBy(250)
                    }),
                    value: AssetAmount.fromRelativeAmount({
                        asset: TON_ASSET,
                        amount: rate.multipliedBy(250)
                    })
                },
                {
                    type: 'small',
                    price: AssetAmount.fromRelativeAmount({
                        asset: TON_ASSET,
                        amount: rate.multipliedBy(150)
                    }),
                    value: AssetAmount.fromRelativeAmount({
                        asset: TON_ASSET,
                        amount: rate.multipliedBy(150)
                    })
                }
            ] as const,
        [rate]
    );
};

export const useBatteryPacksReservedApplied = () => {
    const packs = useBatteryPacks();
    const reserveAmount = useBatteryShouldBeReservedAmount();

    return useMemo(() => {
        if (!reserveAmount) {
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
