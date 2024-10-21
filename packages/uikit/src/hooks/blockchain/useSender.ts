import {
    BatteryMessageSender,
    LedgerMessageSender,
    WalletMessageSender
} from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import { estimationSigner } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { useAppContext } from '../appContext';
import {
    useActiveAccount,
    useActiveStandardTonWallet,
    useActiveTonWalletConfig
} from '../../state/wallet';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import {
    useBatteryApi,
    useBatteryAuthToken,
    useBatteryBalance,
    useBatteryServiceConfig,
    useRequestBatteryAuthToken
} from '../../state/battery';
import { useGetActiveAccountSigner } from '../../state/mnemonic';
import { useCallback, useMemo } from 'react';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';

export type SenderType = 'external' | 'battery';

export const useAvailableSendersTypes = (
    operation: { type: 'transfer'; asset: TonAsset } | { type: 'swap' } | { type: 'nfr_transfer' }
) => {
    const { data: config } = useActiveTonWalletConfig();
    const { data: batteryBalance } = useBatteryBalance();
    const account = useActiveAccount();
    const {
        config: { batteryReservedAmount }
    } = useAppContext();

    const asset = 'asset' in operation ? operation.asset : undefined;

    return useMemo<SenderType[]>(() => {
        if (account.type === 'ledger') {
            return ['external'];
        }
        let batteryAvailable = false;

        if (operation.type === 'transfer') {
            batteryAvailable =
                !!config?.batterySettings.enabledForTokens && asset?.id !== TON_ASSET.id;
        } else if (operation.type === 'swap') {
            batteryAvailable = !!config?.batterySettings.enabledForSwaps;
        } else if (operation.type === 'nfr_transfer') {
            batteryAvailable = !!config?.batterySettings.enabledForNfts;
        }

        if (!batteryBalance) {
            return batteryAvailable ? ['external', 'battery'] : ['external'];
        }

        if (
            batteryReservedAmount &&
            batteryBalance.tonUnitsReserved.relativeAmount.lt(batteryReservedAmount)
        ) {
            return ['external'];
        }
        return batteryAvailable ? ['battery', 'external'] : ['external'];
    }, [operation.type, asset, config, batteryBalance, account.type, batteryReservedAmount]);
};

export const useEstimationSender = (type: SenderType) => {
    const { api } = useAppContext();
    const batteryApi = useBatteryApi();
    const batteryConfig = useBatteryServiceConfig();
    const wallet = useActiveStandardTonWallet();
    const { data: authToken } = useBatteryAuthToken();
    const activeAccount = useActiveAccount();
    const { mutate } = useRequestBatteryAuthToken();

    return useMemo(() => {
        if (!isAccountTonWalletStandard(activeAccount)) {
            throw new Error("Can't send a transfer using this account");
        }

        if (activeAccount.type === 'ledger') {
            if (type !== 'external') {
                throw new Error("Can't send a transfer using this account");
            }
            return new WalletMessageSender(api, wallet, estimationSigner);
        }

        if (type === 'external') {
            return new WalletMessageSender(api, wallet, estimationSigner);
        }

        if (type === 'battery') {
            if (authToken === null) {
                mutate();
                return undefined;
            }
            if (!authToken) {
                return undefined;
            }

            return new BatteryMessageSender(
                {
                    jettonResponseAddress: batteryConfig.excess_account,
                    messageTtl: batteryConfig.message_ttl,
                    authToken
                },
                {
                    tonApi: api,
                    batteryApi
                },
                wallet,
                estimationSigner
            );
        }

        assertUnreachable(type);
    }, [type, api, batteryApi, batteryConfig, wallet, authToken, activeAccount, mutate]);
};

export const useGetSender = (presetType?: SenderType) => {
    const { api } = useAppContext();
    const batteryApi = useBatteryApi();
    const batteryConfig = useBatteryServiceConfig();
    const wallet = useActiveStandardTonWallet();
    const { data: authToken } = useBatteryAuthToken();
    const getSigner = useGetActiveAccountSigner();
    const activeAccount = useActiveAccount();
    const { mutateAsync } = useRequestBatteryAuthToken();

    return useCallback(
        async (type?: SenderType) => {
            if (!isAccountTonWalletStandard(activeAccount)) {
                throw new Error("Can't send a transfer using this account");
            }

            if (!type) {
                type = presetType || 'external';
            }
            const signer = await getSigner();

            if (!signer) {
                throw new Error("Can't send a transfer using this account");
            }

            if (signer.type === 'ledger') {
                if (type !== 'external') {
                    throw new Error("Can't send a transfer using this account");
                }
                return new LedgerMessageSender(api, wallet, signer);
            }

            if (type === 'external') {
                return new WalletMessageSender(api, wallet, signer);
            }

            if (type === 'battery') {
                let batteryToken = authToken;
                if (authToken === null) {
                    batteryToken = await mutateAsync();
                }
                if (!batteryToken) {
                    throw new Error('Auth token not found');
                }
                return new BatteryMessageSender(
                    {
                        jettonResponseAddress: batteryConfig.excess_account,
                        messageTtl: batteryConfig.message_ttl,
                        authToken: batteryToken
                    },
                    {
                        tonApi: api,
                        batteryApi
                    },
                    wallet,
                    signer
                );
            }

            assertUnreachable(type);
        },
        [
            presetType,
            api,
            batteryApi,
            batteryConfig,
            wallet,
            authToken,
            getSigner,
            activeAccount,
            mutateAsync
        ]
    );
};
