import {
    BatteryMessageSender,
    LedgerMessageSender,
    WalletMessageSender
} from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import { useAppContext } from '../appContext';
import {
    useAccountsState,
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
import { AccountTonMultisig } from '@tonkeeper/core/dist/entries/account';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { getMultisigSignerInfo } from '../../state/multisig';
import { MultisigCreateOrderSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender/multisig-create-order-sender';
import { MultisigApi } from '@tonkeeper/core/dist/tonApiV2';
import { estimationSigner } from '@tonkeeper/core/dist/service/ton-blockchain/utils';

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

export const useGetEstimationSender = (type: SenderType = 'external') => {
    const { api } = useAppContext();
    const batteryApi = useBatteryApi();
    const batteryConfig = useBatteryServiceConfig();
    const wallet = useActiveStandardTonWallet();
    const { data: authToken } = useBatteryAuthToken();
    const activeAccount = useActiveAccount();
    const { mutateAsync } = useRequestBatteryAuthToken();
    const accounts = useAccountsState();

    return useMemo(() => {
        if (type === 'battery' && authToken === undefined) {
            return undefined;
        }

        return async () => {
            if (activeAccount.type === 'watch-only') {
                throw new Error("Can't send a transfer using this account");
            }

            if (activeAccount.type === 'ton-multisig') {
                const { signerWallet } = getMultisigSignerInfo(
                    accounts,
                    activeAccount as AccountTonMultisig
                );

                const signer = estimationSigner;

                const multisigApi = new MultisigApi(api.tonApiV2);
                const multisig = await multisigApi.getMultisigAccount({
                    accountId: activeAccount.activeTonWallet.rawAddress
                });
                if (!multisig) {
                    throw new Error('Multisig not found');
                }

                const multisigTtlSeconds = 5 * 60;

                return new MultisigCreateOrderSender(
                    api,
                    multisig,
                    multisigTtlSeconds,
                    signerWallet,
                    signer
                );
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
                let _authToken = authToken;
                if (_authToken === null) {
                    _authToken = await mutateAsync();
                }

                return new BatteryMessageSender(
                    {
                        jettonResponseAddress: batteryConfig.excess_account,
                        messageTtl: batteryConfig.message_ttl,
                        authToken: _authToken!
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
        };
    }, [
        type,
        authToken,
        activeAccount,
        accounts,
        api,
        wallet,
        batteryApi,
        batteryConfig,
        mutateAsync
    ]);
};

export const useGetSender = () => {
    const { api } = useAppContext();
    const batteryApi = useBatteryApi();
    const batteryConfig = useBatteryServiceConfig();
    const wallet = useActiveStandardTonWallet();
    const { data: authToken } = useBatteryAuthToken();
    const getSigner = useGetActiveAccountSigner();
    const activeAccount = useActiveAccount();
    const { mutateAsync } = useRequestBatteryAuthToken();
    const accounts = useAccountsState();

    return useCallback(
        async ({
            type,
            multisigTtlSeconds
        }: {
            type?: SenderType;
            multisigTtlSeconds?: number;
        } = {}) => {
            if (activeAccount.type === 'watch-only') {
                throw new Error("Can't send a transfer using this account");
            }

            if (activeAccount.type === 'ton-multisig') {
                if (multisigTtlSeconds === undefined) {
                    throw new Error('TTL is required');
                }
                const { signerWallet } = getMultisigSignerInfo(
                    accounts,
                    activeAccount as AccountTonMultisig
                );
                const signer = await getSigner(signerWallet.id);

                const multisigApi = new MultisigApi(api.tonApiV2);
                const multisig = await multisigApi.getMultisigAccount({
                    accountId: activeAccount.activeTonWallet.rawAddress
                });
                if (!multisig) {
                    throw new Error('Multisig not found');
                }

                return new MultisigCreateOrderSender(
                    api,
                    multisig,
                    multisigTtlSeconds,
                    signerWallet,
                    signer
                );
            }

            if (!type) {
                type = 'external';
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
            accounts,
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
