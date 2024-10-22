import {
    BatteryMessageSender,
    LedgerMessageSender,
    WalletMessageSender
} from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import { estimationSigner } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
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
import {
    AccountTonMultisig,
    isAccountTonWalletStandard
} from '@tonkeeper/core/dist/entries/account';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { getMultisigSignerInfo, useActiveMultisigAccountHost } from '../../state/multisig';
import { MultisigCreateOrderSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender/multisig-create-order-sender';
import { Signer } from '@tonkeeper/core/dist/entries/signer';
import { MultisigApi } from '@tonkeeper/core/dist/tonApiV2';
import { isStandardTonWallet } from '@tonkeeper/core/dist/entries/wallet';

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

export const useGetEstimationSender = (type: SenderType) => {
    const { api } = useAppContext();
    const batteryApi = useBatteryApi();
    const batteryConfig = useBatteryServiceConfig();
    const wallet = useActiveStandardTonWallet();
    const { data: authToken } = useBatteryAuthToken();
    const activeAccount = useActiveAccount();
    const { mutateAsync } = useRequestBatteryAuthToken();

    return useMemo(() => {
        if (type === 'battery' && authToken === undefined) {
            return undefined;
        }

        return async () => {
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
    }, [type, api, batteryApi, batteryConfig, wallet, authToken, activeAccount, mutateAsync]);
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

export const useGetMultisigSender = (type: 'send' | 'estimate') => {
    const { api } = useAppContext();
    const getSigner = useGetActiveAccountSigner();
    const activeAccount = useActiveAccount();
    const accounts = useAccountsState();

    return useCallback(
        async (ttlSeconds: number) => {
            const { signerWallet } = getMultisigSignerInfo(
                accounts,
                activeAccount as AccountTonMultisig
            );
            let signer: Signer;
            if (type === 'estimate') {
                signer = estimationSigner;
            } else {
                const _signer = await getSigner(signerWallet.id).catch(() => null);
                if (_signer === null) {
                    throw new Error('Signer not found');
                }

                signer = _signer;
            }

            const multisigApi = new MultisigApi(api.tonApiV2);
            const multisig = await multisigApi.getMultisigAccount({
                accountId: activeAccount.activeTonWallet.rawAddress
            });
            if (!multisig) {
                throw new Error('Multisig not found');
            }

            return new MultisigCreateOrderSender(api, multisig, ttlSeconds, signerWallet, signer);
        },
        [api, accounts, getSigner, activeAccount]
    );
};

export const useGetTonConnectSender = (type: 'send' | 'estimate') => {
    const { api } = useAppContext();
    const { signerWallet } = useActiveMultisigAccountHost();
    const getSigner = useGetActiveAccountSigner();
    const activeAccount = useActiveAccount();
    const getMultisigSender = useGetMultisigSender(type);

    return useCallback(
        async (ttlSeconds?: number) => {
            if (activeAccount.type === 'ton-multisig') {
                if (ttlSeconds === undefined) {
                    throw new Error('TTL is required');
                }
                return getMultisigSender(ttlSeconds);
            }

            const signer = type === 'send' ? await getSigner() : estimationSigner;

            if (activeAccount.type === 'ledger') {
                if (signer.type !== 'ledger') {
                    throw new Error("Account and signer types don't match");
                }
                return new LedgerMessageSender(api, activeAccount.activeTonWallet, signer);
            }

            if (!isStandardTonWallet(activeAccount.activeTonWallet)) {
                throw new Error("Can't send a transfer using this wallet");
            }

            if (signer.type !== 'cell') {
                throw new Error("Account and signer types don't match");
            }

            return new WalletMessageSender(api, activeAccount.activeTonWallet, signer);
        },
        [type, api, signerWallet, getSigner, activeAccount, getMultisigSender]
    );
};
