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
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import BigNumber from 'bignumber.js';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { patchedTokenImage, useJettonList } from './jetton';
import { notNullish } from '@tonkeeper/core/dist/utils/types';
import { toNano } from '@ton/core';
import type { Config } from '@tonkeeper/core/dist/batteryApi/models/Config';
import { JettonEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/jetton-encoder';
import { Configuration, ConnectApi, DefaultApi, WalletApi } from '@tonkeeper/core/dist/batteryApi';
import {
    isTon,
    TonAsset,
    tonAssetAddressToString
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { useTwoFAWalletConfig } from './two-fa';
import { batteryImagesMap, FallbackBatteryIcon } from '../components/settings/battery/BatteryIcons';
import { isStandardTonWallet, TonWalletStandard } from '@tonkeeper/core/dist/entries/wallet';
import { useIsOnIosReview } from '../hooks/ios';

export const useCanUseBattery = () => {
    const { disableWhole: disableWholeBattery } = useBatteryEnabledConfig();
    const account = useActiveAccount();
    return (account.type === 'mnemonic' || account.type === 'mam') && !disableWholeBattery;
};

export const useBatteryApi = () => {
    const config = useActiveConfig();
    return useMemo(() => {
        return new Configuration({
            basePath: config.batteryHost || 'https://battery.tonkeeper.com'
        });
    }, []);
};

export const useBatteryServiceConfigQuery = () => {
    const batteryApi = useBatteryApi();

    return useQuery<Config>(
        [QueryKey.batteryServiceConfig],
        async () => {
            return new DefaultApi(batteryApi).getConfig();
        },
        {
            keepPreviousData: true,
            suspense: true
        }
    );
};

export const useBatteryServiceConfig = () => {
    const { data } = useBatteryServiceConfigQuery();

    if (!data) {
        throw new Error('Battery service config not found');
    }

    return data;
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

        const val = await sdk.storage.get<{ token: string }>(tokenStorageKey(publicKey));

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
        { signer?: (b: Buffer) => Promise<Uint8Array | Buffer>; wallet?: TonWalletStandard } | void
    >(async args => {
        let wallet = args?.wallet;
        if (!wallet) {
            if (account?.type !== 'mnemonic' && account?.type !== 'mam') {
                throw new Error('Invalid account type');
            }
            wallet = account.activeTonWallet;
        }
        const { payload } = await new ConnectApi(batteryApi).getTonConnectPayload();
        const origin = batteryApi.basePath;

        const proof = await signTonProof({ payload, origin, signer: args?.signer, wallet });
        const res = await new WalletApi(batteryApi).tonConnectProof({
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

        await sdk.storage.set(tokenStorageKey(wallet.publicKey), {
            token: res.token
        });
        await client.invalidateQueries([QueryKey.batteryAuthToken]);
        return res.token;
    });
};

const tokenStorageKey = (publicKey: string) => `${AppKey.BATTERY_AUTH_TOKEN}_${publicKey}`;

export const useRemoveBatteryAuthToken = () => {
    const account = useActiveAccount();
    const sdk = useAppSdk();
    const client = useQueryClient();

    return useMutation(async () => {
        const tonWallets = account.allTonWallets;
        for (const wallet of tonWallets) {
            if (isStandardTonWallet(wallet)) {
                await sdk.storage.delete(tokenStorageKey(wallet.publicKey));
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

    return useMemo(() => new BigNumber(batteryMeanFees || '0.0026'), [batteryMeanFees]);
};

export const useBatteryEnabledConfig = () => {
    const network = useActiveTonNetwork();
    const { battery_beta, disable_battery, disable_battery_send } = useActiveConfig();
    const { data: twoFAWalletConfig } = useTwoFAWalletConfig();
    const disableDueToIosReview = useIsOnIosReview();

    const disableDueToTwoFA =
        twoFAWalletConfig?.status === 'active' || twoFAWalletConfig?.status === 'disabling';

    return useMemo(() => {
        if (network === Network.TESTNET) {
            return {
                isBeta: false,
                disableWhole: disableDueToIosReview,
                disableOperations: disableDueToIosReview
            };
        }

        const disableWhole =
            disableDueToIosReview || disableDueToTwoFA || (disable_battery ?? false);

        return {
            isBeta: battery_beta ?? false,
            disableWhole,
            disableOperations: disableWhole ? true : disable_battery_send ?? false
        };
    }, [
        battery_beta,
        disable_battery,
        disable_battery_send,
        network,
        disableDueToTwoFA,
        disableDueToIosReview
    ]);
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
    const methods = useBatteryAvailableRechargeMethods();
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
    }, [methods, balance, asset, shouldReserve]);
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

export const useBatteryShouldBeReservedAmount = () => {
    const { data: balance } = useBatteryBalance();
    const config = useActiveConfig();
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

/**
 * token relative/unit
 * @param assetAddress
 */
export const usePurchaseBatteryUnitTokenRate = (assetAddress: string) => {
    const methods = useBatteryAvailableRechargeMethods();
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
    }, [methods, assetAddress]);
};

const imgUrlToName = (url: string) => {
    return (url.split('/').pop() as string).replace('.png', '').replace('.webp', '');
};

export const useBatteryPacks = () => {
    const rate = useBatteryUnitTonRate();
    const config = useActiveConfig();

    const configPackages = useMemo<
        {
            value: number;
            image: string;
        }[]
    >(() => {
        if (!config.battery_packages) {
            return [
                {
                    value: 1000,
                    image: 'https://wallet.tonkeeper.com/img/battery/battery-max.png'
                },
                {
                    value: 400,
                    image: 'https://wallet.tonkeeper.com/img/battery/battery-100.png'
                },
                {
                    value: 250,
                    image: 'https://wallet.tonkeeper.com/img/battery/battery-75.png'
                },
                {
                    value: 150,
                    image: 'https://wallet.tonkeeper.com/img/battery/battery-25.png'
                }
            ];
        }

        return config.battery_packages;
    }, [config.battery_packages]);

    return useMemo(() => {
        const shouldUseSvgImages = configPackages.every(p =>
            Object.keys(batteryImagesMap).some(key => key === imgUrlToName(p.image))
        );
        return configPackages.map(pkg => ({
            id: pkg.value.toString(),
            price: AssetAmount.fromRelativeAmount({
                asset: TON_ASSET,
                amount: rate.multipliedBy(pkg.value)
            }),
            value: AssetAmount.fromRelativeAmount({
                asset: TON_ASSET,
                amount: rate.multipliedBy(pkg.value)
            }),
            image: shouldUseSvgImages ? (
                batteryImagesMap[imgUrlToName(pkg.image) as keyof typeof batteryImagesMap]
            ) : (
                <FallbackBatteryIcon url={pkg.image} />
            )
        }));
    }, [rate, configPackages]);
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
