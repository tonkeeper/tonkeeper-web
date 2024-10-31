import {
    BatteryMessageSender,
    LedgerMessageSender,
    WalletMessageSender,
    MultisigCreateOrderSender,
    GaslessMessageSender,
    Sender
} from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import { useAppContext } from '../appContext';
import { useAccountsState, useActiveAccount, useActiveTonWalletConfig } from '../../state/wallet';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import {
    useBatteryApi,
    useBatteryAuthToken,
    useBatteryBalance,
    useBatteryEnabledConfig,
    useBatteryServiceConfig,
    useRequestBatteryAuthToken
} from '../../state/battery';
import { useGetAccountSigner } from '../../state/mnemonic';
import { useCallback, useMemo } from 'react';
import {
    TonAsset,
    tonAssetAddressToString
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import {
    Account,
    AccountTonMultisig,
    getNetworkByAccount
} from '@tonkeeper/core/dist/entries/account';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { getMultisigSignerInfo } from '../../state/multisig';
import { GaslessConfig, MultisigApi } from '@tonkeeper/core/dist/tonApiV2';
import { estimationSigner } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { isStandardTonWallet, WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { useGaslessConfig } from '../../state/gasless';
import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { useQuery } from '@tanstack/react-query';
import { TonConnectTransactionService } from '@tonkeeper/core/dist/service/ton-blockchain/ton-connect-transaction.service';
import { useAssets } from '../../state/home';
import { JettonEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/jetton-encoder';
import { toNano } from '@ton/core';
import { getContextApiByNetwork } from '@tonkeeper/core/dist/service/walletService';

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
        | { type: 'transfer'; asset: TonAsset }
        | { type: 'multisend-transfer'; asset: TonAsset }
        | { type: 'nfr_transfer' }
) => {
    const { data: config } = useActiveTonWalletConfig();
    const { data: batteryBalance } = useBatteryBalance();
    const account = useActiveAccount();
    const {
        config: { batteryReservedAmount }
    } = useAppContext();
    const gaslessConfig = useGaslessConfig();
    const batteryEnableConfig = useBatteryEnabledConfig();
    const [walletInfo] = useAssets();

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
            walletInfo
        ],
        () => {
            if (account.type !== 'mnemonic' && account.type !== 'mam') {
                return [EXTERNAL_SENDER_CHOICE];
            }
            if (operation.type === 'multisend-transfer') {
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
                batteryBalance !== undefined && walletInfo !== undefined && config !== undefined
        }
    );
};

export const useTonConnectAvailableSendersChoices = (payload: TonConnectTransactionPayload) => {
    const appContext = useAppContext();
    const batteryApi = useBatteryApi();
    const { data: batteryAuthToken } = useBatteryAuthToken();
    const account = useActiveAccount();
    const batteryConfig = useBatteryServiceConfig();
    const batteryEnableConfig = useBatteryEnabledConfig();

    return useQuery<SenderChoiceUserAvailable[]>(
        [
            'ton-connect-sender-choices',
            payload,
            account,
            batteryAuthToken,
            batteryEnableConfig.disableOperations,
            batteryConfig
        ],
        async () => {
            if (account.type === 'ledger') {
                return [EXTERNAL_SENDER_CHOICE];
            }

            const network = getNetworkByAccount(account);
            const [api] = getContextApiByNetwork(appContext, network);
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
                        jettonResponseAddress: batteryConfig.excessAccount,
                        authToken: batteryAuthToken
                    },
                    { batteryApi, tonApi: api },
                    account.activeTonWallet,
                    estimationSigner,
                    network
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

export const useGetEstimationSender = (senderChoice: SenderChoice = { type: 'external' }) => {
    const appContext = useAppContext();
    const batteryApi = useBatteryApi();
    const batteryConfig = useBatteryServiceConfig();
    const { data: authToken } = useBatteryAuthToken();
    const activeAccount = useActiveAccount();
    const { mutateAsync } = useRequestBatteryAuthToken();
    const accounts = useAccountsState();
    const gaslessConfig = useGaslessConfig();

    const wallet = activeAccount.activeTonWallet;

    return useMemo(() => {
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

            const network = getNetworkByAccount(activeAccount);
            const [api] = getContextApiByNetwork(appContext, network);

            if (senderChoice.type === 'multisig') {
                if (activeAccount.type !== 'ton-multisig') {
                    throw new Error('Multisig sender available only for multisig accounts');
                }

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

                return new MultisigCreateOrderSender(
                    api,
                    multisig,
                    senderChoice.ttlSeconds,
                    signerWallet,
                    signer,
                    network
                );
            }

            if (!isStandardTonWallet(wallet)) {
                throw new Error("Can't send a transfer using this wallet type");
            }

            if (activeAccount.type === 'ledger') {
                if (senderChoice.type !== 'external') {
                    throw new Error("Can't send a transfer using this account");
                }
                return new WalletMessageSender(api, wallet, estimationSigner, network);
            }

            if (senderChoice.type === 'external') {
                return new WalletMessageSender(api, wallet, estimationSigner, network);
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
                    estimationSigner,
                    network
                );
            }

            if (senderChoice.type === 'battery') {
                let _authToken = authToken;
                if (_authToken === null) {
                    _authToken = await mutateAsync();
                }

                return new BatteryMessageSender(
                    {
                        jettonResponseAddress: batteryConfig.excessAccount,
                        messageTtl: batteryConfig.messageTtl,
                        authToken: _authToken!
                    },
                    {
                        tonApi: api,
                        batteryApi
                    },
                    wallet,
                    estimationSigner,
                    network
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
        gaslessConfig
    ]);
};

export const useGetSender = () => {
    const appContext = useAppContext();
    const batteryApi = useBatteryApi();
    const batteryConfig = useBatteryServiceConfig();
    const { data: authToken } = useBatteryAuthToken();
    const getSigner = useGetAccountSigner();
    const activeAccount = useActiveAccount();
    const { mutateAsync } = useRequestBatteryAuthToken();
    const accounts = useAccountsState();
    const gaslessConfig = useGaslessConfig();

    const wallet = activeAccount.activeTonWallet;

    return useCallback(
        async (senderChoice: SenderChoice = { type: 'external' }): Promise<Sender> => {
            if (activeAccount.type === 'watch-only') {
                throw new Error("Can't send a transfer using this account");
            }

            const network = getNetworkByAccount(activeAccount);
            const [api] = getContextApiByNetwork(appContext, network);

            if (senderChoice.type === 'multisig') {
                if (activeAccount.type !== 'ton-multisig') {
                    throw new Error('Multisig sender available only for multisig accounts');
                }

                const { signerAccount, signerWallet } = getMultisigSignerInfo(
                    accounts,
                    activeAccount as AccountTonMultisig
                );
                const signer = await getSigner(signerAccount.id, signerWallet.id);

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
                    senderChoice.ttlSeconds,
                    signerWallet,
                    signer,
                    network
                );
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
                return new LedgerMessageSender(api, wallet, signer, network);
            }

            if (senderChoice.type === 'external') {
                return new WalletMessageSender(api, wallet, signer, network);
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
                    signer,
                    network
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
                        jettonResponseAddress: batteryConfig.excessAccount,
                        messageTtl: batteryConfig.messageTtl,
                        authToken: batteryToken
                    },
                    {
                        tonApi: api,
                        batteryApi
                    },
                    wallet,
                    signer,
                    network
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
            gaslessConfig
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
