import {
    BatteryMessageSender,
    GaslessMessageSender,
    LedgerMessageSender,
    MultisigCreateOrderSender,
    Sender,
    WalletMessageSender
} from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import { useAppContext } from '../appContext';
import {
    useAccountsState,
    useActiveAccount,
    useActiveApi,
    useActiveConfig,
    useActiveTonWalletConfig
} from '../../state/wallet';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import {
    useBatteryApi,
    useBatteryAuthToken,
    useBatteryBalance,
    useBatteryEnabledConfig,
    useBatteryServiceConfig,
    useBatteryUnitTonRate,
    useRequestBatteryAuthToken
} from '../../state/battery';
import { getTronSigner, useGetAccountSigner } from '../../state/mnemonic';
import { useCallback, useMemo } from 'react';
import {
    TonAsset,
    tonAssetAddressToString
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import {
    Account,
    AccountTonMultisig,
    isAccountTronCompatible
} from '@tonkeeper/core/dist/entries/account';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { getMultisigSignerInfo } from '../../state/multisig';
import { GaslessConfig, Multisig } from '@tonkeeper/core/dist/tonApiV2';
import { estimationSigner } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { isStandardTonWallet, WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { useGaslessConfig } from '../../state/gasless';
import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TonConnectTransactionService } from '@tonkeeper/core/dist/service/ton-blockchain/ton-connect-transaction.service';
import { useAssets } from '../../state/home';
import { JettonEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/jetton-encoder';
import { toNano } from '@ton/core';
import {
    useTwoFAWalletConfigMayBeOfMultisigHost,
    useTwoFAApi,
    useTwoFAServiceConfig,
    useTwoFAWalletConfig
} from '../../state/two-fa';
import { TwoFAMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender/two-fa-message-sender';
import { useConfirmTwoFANotification } from '../../components/modals/ConfirmTwoFANotificationControlled';
import { useTronApi } from '../../state/tron/tron';
import { TronSender } from '@tonkeeper/core/dist/service/tron-blockchain/tron-sender';
import { useAppSdk } from '../appSdk';
import { useCheckTouchId } from '../../state/password';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import { QueryKey } from '../../libs/queryKey';

export type SenderChoice =
    | { type: 'multisig'; ttlSeconds: number }
    | { type: 'external' }
    | { type: 'battery' }
    | { type: 'gasless'; asset: TonAsset };

export type SenderChoiceUserAvailable = Exclude<
    SenderChoice,
    { type: 'multisig'; ttlSeconds: number }
>;

export type SenderTypeUserAvailable = SenderChoiceUserAvailable['type'];

export const useAvailableSendersChoices = (
    operation:
        | { type: 'transfer'; asset: TonAsset | TronAsset }
        | { type: 'multisend-transfer'; asset: TonAsset }
        | { type: 'nfr_transfer' }
) => {
    const { data: config } = useActiveTonWalletConfig();
    const { data: batteryBalance } = useBatteryBalance();
    const account = useActiveAccount();
    const { batteryReservedAmount } = useActiveConfig();
    const gaslessConfig = useGaslessConfig();
    const batteryEnableConfig = useBatteryEnabledConfig();
    const [walletInfo] = useAssets();
    const { data: twoFaConfig, isEnabled: isTwoFAEnabled } = useTwoFAWalletConfig();

    const asset = 'asset' in operation ? operation.asset : undefined;

    return useQuery<SenderChoiceUserAvailable[]>(
        [
            'available-sender-choices',
            operation.type,
            asset,
            config,
            batteryBalance,
            account.type,
            batteryReservedAmount,
            gaslessConfig,
            batteryEnableConfig.disableOperations,
            walletInfo,
            twoFaConfig
        ],
        () => {
            if (asset?.blockchain === BLOCKCHAIN_NAME.TRON) {
                return [EXTERNAL_SENDER_CHOICE];
            }
            if (account.type !== 'mnemonic' && account.type !== 'mam') {
                return [EXTERNAL_SENDER_CHOICE];
            }
            if (operation.type === 'multisend-transfer') {
                return [EXTERNAL_SENDER_CHOICE];
            }

            if (twoFaConfig?.status === 'active') {
                return [EXTERNAL_SENDER_CHOICE];
            }

            let batteryAvailable = false;
            if (operation.type === 'transfer') {
                batteryAvailable =
                    !!config?.batterySettings.enabledForTokens && asset?.id !== TON_ASSET.id;
            } else if (operation.type === 'nfr_transfer') {
                batteryAvailable = !!config?.batterySettings.enabledForNfts;
            }

            if (batteryEnableConfig.disableOperations) {
                batteryAvailable = false;
            }

            const potentialSenders: {
                choice: SenderChoiceUserAvailable;
                priority: number;
            }[] = [{ choice: EXTERNAL_SENDER_CHOICE, priority: 2 }];

            if (batteryAvailable) {
                if (!batteryBalance || !batteryReservedAmount) {
                    potentialSenders.push({
                        choice: BATTERY_SENDER_CHOICE,
                        priority: 0
                    });
                } else if (
                    batteryBalance.tonUnitsReserved.relativeAmount.gte(batteryReservedAmount)
                ) {
                    potentialSenders.push({
                        choice: BATTERY_SENDER_CHOICE,
                        priority: 4
                    });
                }
            }

            if (isGaslessAvailable({ asset, account, gaslessConfig })) {
                if (
                    walletInfo!.ton.info.balance <
                    JettonEncoder.jettonTransferAmount + toNano(0.005)
                ) {
                    potentialSenders.push({
                        choice: { type: 'gasless', asset: asset! },
                        priority: 3
                    });
                } else {
                    potentialSenders.push({
                        choice: { type: 'gasless', asset: asset! },
                        priority: 1
                    });
                }
            }
            potentialSenders.sort((s1, s2) => s2.priority - s1.priority);

            return potentialSenders.map(s => s.choice);
        },
        {
            enabled:
                batteryBalance !== undefined &&
                walletInfo !== undefined &&
                config !== undefined &&
                (!isTwoFAEnabled || twoFaConfig !== undefined)
        }
    );
};

export const useTonConnectAvailableSendersChoices = (payload: TonConnectTransactionPayload) => {
    const api = useActiveApi();
    const batteryApi = useBatteryApi();
    const { data: batteryAuthToken } = useBatteryAuthToken();
    const account = useActiveAccount();
    const batteryConfig = useBatteryServiceConfig();
    const batteryEnableConfig = useBatteryEnabledConfig();
    const { data: twoFaConfig } = useTwoFAWalletConfig();
    const batteryUnitTonRate = useBatteryUnitTonRate();

    return useQuery<SenderChoiceUserAvailable[]>(
        [
            'ton-connect-sender-choices',
            payload,
            account,
            batteryAuthToken,
            batteryEnableConfig.disableOperations,
            batteryConfig,
            twoFaConfig?.status,
            batteryUnitTonRate
        ],
        async () => {
            if (account.type === 'ledger' || twoFaConfig?.status === 'active') {
                return [EXTERNAL_SENDER_CHOICE];
            }
            const choices: SenderChoiceUserAvailable[] = [EXTERNAL_SENDER_CHOICE];

            const tonConnectService = new TonConnectTransactionService(
                api,
                account.activeTonWallet
            );

            if (
                !batteryEnableConfig.disableOperations &&
                batteryAuthToken &&
                isStandardTonWallet(account.activeTonWallet)
            ) {
                const batterySender = new BatteryMessageSender(
                    {
                        messageTtl: batteryConfig.messageTtl,
                        excessAddress: batteryConfig.excessAccount,
                        authToken: batteryAuthToken,
                        batteryUnitTonRate
                    },
                    { batteryApi, tonApi: api },
                    account.activeTonWallet,
                    estimationSigner
                );

                try {
                    await tonConnectService.estimate(batterySender, payload);

                    choices.unshift(BATTERY_SENDER_CHOICE);
                } catch (e) {
                    console.error(e);
                }
            }

            return choices;
        },
        {
            enabled: batteryAuthToken !== undefined
        }
    );
};

export const EXTERNAL_SENDER_CHOICE = { type: 'external' } as const satisfies SenderChoice;
export const BATTERY_SENDER_CHOICE = { type: 'battery' } as const satisfies SenderChoice;

export const useGetEstimationSender = (senderChoice: SenderChoice = EXTERNAL_SENDER_CHOICE) => {
    const appContext = useAppContext();
    const api = useActiveApi();
    const batteryApi = useBatteryApi();
    const batteryConfig = useBatteryServiceConfig();
    const { data: authToken } = useBatteryAuthToken();
    const activeAccount = useActiveAccount();
    const { mutateAsync } = useRequestBatteryAuthToken();
    const accounts = useAccountsState();
    const gaslessConfig = useGaslessConfig();
    const twoFaApi = useTwoFAApi();
    const { data: twoFAConfig } = useTwoFAWalletConfigMayBeOfMultisigHost();
    const batteryUnitTonRate = useBatteryUnitTonRate();
    const client = useQueryClient();

    const wallet = activeAccount.activeTonWallet;

    const multisigChoiceCallback = useCallback(async () => {
        if (senderChoice.type !== 'multisig' || activeAccount.type !== 'ton-multisig') {
            throw new Error('Multisig sender available only for multisig accounts');
        }

        const { signerWallet } = getMultisigSignerInfo(
            accounts,
            activeAccount as AccountTonMultisig
        );

        const multisig = await client.fetchQuery<Multisig>([
            QueryKey.multisigWallet,
            activeAccount.activeTonWallet.rawAddress
        ]);
        if (!multisig) {
            throw new Error('Multisig not found');
        }

        let hostWalletSender;
        if (twoFAConfig?.status === 'active') {
            hostWalletSender = new TwoFAMessageSender(
                { tonApi: api, twoFaApi },
                signerWallet,
                estimationSigner,
                twoFAConfig.pluginAddress
            );
        } else {
            hostWalletSender = new WalletMessageSender(api, signerWallet, estimationSigner);
        }

        return new MultisigCreateOrderSender(
            api,
            multisig,
            senderChoice.ttlSeconds,
            signerWallet,
            hostWalletSender
        );
    }, [senderChoice.type, accounts, activeAccount, client, twoFAConfig, api]);

    const otherChoicesCallback = useMemo(() => {
        if (!senderChoice) {
            return undefined;
        }
        if (senderChoice.type === 'battery' && authToken === undefined) {
            return undefined;
        }

        return async () => {
            if (activeAccount.type === 'watch-only') {
                throw new Error("Can't send a transfer using this account");
            }

            if (senderChoice.type === 'multisig') {
                throw new Error('Unexpected sender choice: multisig');
            }

            if (!isStandardTonWallet(wallet)) {
                throw new Error("Can't send a transfer using this wallet type");
            }

            if (activeAccount.type === 'ledger') {
                if (senderChoice.type !== 'external') {
                    throw new Error("Can't send a transfer using this account");
                }
                return new WalletMessageSender(api, wallet, estimationSigner);
            }

            if (twoFAConfig?.status === 'active' || twoFAConfig?.status === 'disabling') {
                return new TwoFAMessageSender(
                    { tonApi: api, twoFaApi },
                    wallet,
                    estimationSigner,
                    twoFAConfig.pluginAddress
                );
            }

            if (senderChoice.type === 'external') {
                return new WalletMessageSender(api, wallet, estimationSigner);
            }

            if (senderChoice.type === 'gasless') {
                if (
                    !isGaslessAvailable({
                        asset: senderChoice.asset,
                        account: activeAccount,
                        gaslessConfig
                    })
                ) {
                    throw new Error(
                        `Jetton ${senderChoice.asset.symbol} not configured for gasless`
                    );
                }
                return new GaslessMessageSender(
                    {
                        payWithAsset: senderChoice.asset,
                        relayerAddress: gaslessConfig.relayAddress
                    },
                    api,
                    wallet,
                    estimationSigner
                );
            }

            if (senderChoice.type === 'battery') {
                let _authToken = authToken;
                if (_authToken === null) {
                    _authToken = await mutateAsync();
                }

                return new BatteryMessageSender(
                    {
                        excessAddress: batteryConfig.excessAccount,
                        messageTtl: batteryConfig.messageTtl,
                        authToken: _authToken!,
                        batteryUnitTonRate
                    },
                    {
                        tonApi: api,
                        batteryApi
                    },
                    wallet,
                    estimationSigner
                );
            }

            assertUnreachable(senderChoice);
        };
    }, [
        senderChoice,
        authToken,
        activeAccount,
        accounts,
        appContext,
        wallet,
        batteryApi,
        batteryConfig,
        mutateAsync,
        gaslessConfig,
        twoFaApi,
        twoFAConfig,
        batteryUnitTonRate
    ]);

    return senderChoice.type === 'multisig' ? multisigChoiceCallback : otherChoicesCallback;
};

export const useGetSender = () => {
    const appContext = useAppContext();
    const api = useActiveApi();
    const batteryApi = useBatteryApi();
    const batteryConfig = useBatteryServiceConfig();
    const { data: authToken } = useBatteryAuthToken();
    const getSigner = useGetAccountSigner();
    const activeAccount = useActiveAccount();
    const { mutateAsync } = useRequestBatteryAuthToken();
    const accounts = useAccountsState();
    const gaslessConfig = useGaslessConfig();
    const twoFaApi = useTwoFAApi();

    const { data: twoFAConfig } = useTwoFAWalletConfigMayBeOfMultisigHost();
    const { onOpen: openTwoFaConfirmTelegram, onClose: closeTwoFaConfirmTelegram } =
        useConfirmTwoFANotification();
    const twoFAServiceConfig = useTwoFAServiceConfig();
    const batteryUnitTonRate = useBatteryUnitTonRate();

    const wallet = activeAccount.activeTonWallet;

    const client = useQueryClient();

    return useCallback(
        // eslint-disable-next-line complexity
        async (senderChoice: SenderChoice = EXTERNAL_SENDER_CHOICE): Promise<Sender> => {
            if (activeAccount.type === 'watch-only') {
                throw new Error("Can't send a transfer using this account");
            }

            /**
             * create multisig order
             */
            if (senderChoice.type === 'multisig') {
                if (activeAccount.type !== 'ton-multisig') {
                    throw new Error('Multisig sender available only for multisig accounts');
                }

                const { signerAccount, signerWallet } = getMultisigSignerInfo(
                    accounts,
                    activeAccount as AccountTonMultisig
                );
                const signer = await getSigner(signerAccount.id, signerWallet.id);

                const multisig = await client.fetchQuery<Multisig>([
                    QueryKey.multisigWallet,
                    activeAccount.activeTonWallet.rawAddress
                ]);
                if (!multisig) {
                    throw new Error('Multisig not found');
                }

                let hostWalletSender;

                if (signer.type === 'ledger') {
                    hostWalletSender = new LedgerMessageSender(api, signerWallet, signer);
                } else if (twoFAConfig?.status === 'active') {
                    hostWalletSender = new TwoFAMessageSender(
                        { tonApi: api, twoFaApi },
                        signerWallet,
                        signer,
                        twoFAConfig.pluginAddress,
                        {
                            openConfirmModal: () => {
                                openTwoFaConfirmTelegram();
                                return closeTwoFaConfirmTelegram;
                            },
                            confirmMessageTGTtlSeconds:
                                twoFAServiceConfig.confirmMessageTGTtlSeconds
                        }
                    );
                } else {
                    hostWalletSender = new WalletMessageSender(api, signerWallet, signer);
                }

                return new MultisigCreateOrderSender(
                    api,
                    multisig,
                    senderChoice.ttlSeconds,
                    signerWallet,
                    hostWalletSender
                );
            }

            /**
             * sign existing multisig order
             */
            if (activeAccount.type === 'ton-multisig') {
                if (senderChoice.type !== 'external') {
                    throw new Error('Multisig signes existing orders only via external sender');
                }

                const { signerAccount, signerWallet } = getMultisigSignerInfo(
                    accounts,
                    activeAccount as AccountTonMultisig
                );
                const signer = await getSigner(signerAccount.id, signerWallet.id);

                if (signer.type === 'ledger') {
                    return new LedgerMessageSender(api, signerWallet, signer);
                } else if (twoFAConfig?.status === 'active') {
                    return new TwoFAMessageSender(
                        { tonApi: api, twoFaApi },
                        signerWallet,
                        signer,
                        twoFAConfig.pluginAddress,
                        {
                            openConfirmModal: () => {
                                openTwoFaConfirmTelegram();
                                return closeTwoFaConfirmTelegram;
                            },
                            confirmMessageTGTtlSeconds:
                                twoFAServiceConfig.confirmMessageTGTtlSeconds
                        }
                    );
                } else {
                    return new WalletMessageSender(api, signerWallet, signer);
                }
            }

            if (!isStandardTonWallet(wallet)) {
                throw new Error("Can't send a transfer using this wallet type");
            }

            const signer = await getSigner(activeAccount.id);

            if (!signer) {
                throw new Error("Can't send a transfer using this account");
            }

            if (signer.type === 'ledger') {
                if (senderChoice.type !== 'external') {
                    throw new Error("Can't send a transfer using this account");
                }
                return new LedgerMessageSender(api, wallet, signer);
            }

            if (twoFAConfig?.status === 'active' || twoFAConfig?.status === 'disabling') {
                return new TwoFAMessageSender(
                    { tonApi: api, twoFaApi },
                    wallet,
                    signer,
                    twoFAConfig.pluginAddress,
                    {
                        openConfirmModal: () => {
                            openTwoFaConfirmTelegram();
                            return closeTwoFaConfirmTelegram;
                        },
                        confirmMessageTGTtlSeconds: twoFAServiceConfig.confirmMessageTGTtlSeconds
                    }
                );
            }

            if (senderChoice.type === 'external') {
                return new WalletMessageSender(api, wallet, signer);
            }

            if (senderChoice.type === 'gasless') {
                if (
                    !isGaslessAvailable({
                        asset: senderChoice.asset,
                        account: activeAccount,
                        gaslessConfig
                    })
                ) {
                    throw new Error(
                        `Jetton ${senderChoice.asset.symbol} not configured for gasless`
                    );
                }
                return new GaslessMessageSender(
                    {
                        payWithAsset: senderChoice.asset,
                        relayerAddress: gaslessConfig.relayAddress
                    },
                    api,
                    wallet,
                    signer
                );
            }

            if (senderChoice.type === 'battery') {
                let batteryToken = authToken;
                if (authToken === null) {
                    batteryToken = await mutateAsync();
                }
                if (!batteryToken) {
                    throw new Error('Auth token not found');
                }
                return new BatteryMessageSender(
                    {
                        excessAddress: batteryConfig.excessAccount,
                        messageTtl: batteryConfig.messageTtl,
                        authToken: batteryToken,
                        batteryUnitTonRate
                    },
                    {
                        tonApi: api,
                        batteryApi
                    },
                    wallet,
                    signer
                );
            }

            assertUnreachable(senderChoice);
        },
        [
            accounts,
            appContext,
            batteryApi,
            batteryConfig,
            wallet,
            authToken,
            getSigner,
            activeAccount,
            mutateAsync,
            gaslessConfig,
            twoFaApi,
            twoFAConfig,
            openTwoFaConfirmTelegram,
            closeTwoFaConfirmTelegram,
            twoFAServiceConfig.confirmMessageTGTtlSeconds,
            batteryUnitTonRate,
            client
        ]
    );
};

const isGaslessAvailable = ({
    gaslessConfig,
    account,
    asset
}: {
    gaslessConfig: GaslessConfig;
    asset: TonAsset | undefined;
    account: Account;
}) => {
    return (
        asset &&
        gaslessConfig.gasJettons.some(j => j.masterId === tonAssetAddressToString(asset.address)) &&
        isStandardTonWallet(account.activeTonWallet) &&
        account.activeTonWallet.version === WalletVersion.V5R1
    );
};

export const useGetTronSender = () => {
    const sdk = useAppSdk();
    const tronApi = useTronApi();
    const activeAccount = useActiveAccount();
    const { mutateAsync: checkTouchId } = useCheckTouchId();
    const { mutateAsync: requestToken } = useRequestBatteryAuthToken();
    const { data: authToken } = useBatteryAuthToken();

    return useCallback(async () => {
        const signer = getTronSigner(sdk, tronApi, activeAccount, checkTouchId);

        if (!isAccountTronCompatible(activeAccount) || !activeAccount.activeTronWallet) {
            throw new Error('Tron is not enabled for the active wallet');
        }

        const token = authToken ?? (await requestToken());

        return new TronSender(tronApi, activeAccount.activeTronWallet, signer, token);
    }, [tronApi, activeAccount, checkTouchId]);
};

export const useGetTronEstimationSender = () => {
    const tronApi = useTronApi();
    const activeAccount = useActiveAccount();

    return useCallback(() => {
        const signer = (): Promise<never> => {
            throw new Error('Unexpected call');
        };

        if (!isAccountTronCompatible(activeAccount) || !activeAccount.activeTronWallet) {
            throw new Error('Tron is not enabled for the active wallet');
        }

        return new TronSender(tronApi, activeAccount.activeTronWallet, signer, '');
    }, [tronApi]);
};
