import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { anyOfKeysParts, QueryKey } from '../libs/queryKey';
import { useAppSdk } from '../hooks/appSdk';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import {
    useAccountsState,
    useActiveAccount,
    useActiveApi,
    useActiveConfig,
    useActiveWallet
} from './wallet';
import { useDevSettings } from './dev';
import { AccountId, Account } from '@tonkeeper/core/dist/entries/account';
import { AuthApi, Configuration } from '@tonkeeper/core/dist/2faApi';
import { useEffect, useMemo } from 'react';
import { useSignTonProof } from '../hooks/accountUtils';
import { TwoFAEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/two-fa-encoder';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { useToast } from '../hooks/useNotification';
import { useTranslation } from '../hooks/translation';
import { getMultisigSignerInfo } from './multisig';

export type TwoFATgBotBoundingWalletConfig = {
    status: 'tg-bot-bounding';
    authUrl: string;
    expiresAtUnixSeconds: number;
};

export type TwoFATgBotBoundedWalletConfig = {
    status: 'ready-for-deployment';
    botUrl: string;
};

export type TwoFAActiveWalletConfig = {
    status: 'active';
    botUrl: string;
    pluginAddress: string;
};

export type TwoFADisablingWalletConfig = {
    status: 'disabling';
    pluginAddress: string;
    willBeDisabledAtUnixSeconds: number;
};

export type TwoFAWalletConfig =
    | TwoFATgBotBoundingWalletConfig
    | TwoFATgBotBoundedWalletConfig
    | TwoFAActiveWalletConfig
    | TwoFADisablingWalletConfig
    | null;

const twoFaWalletConfigStorageKey = (walletId: string) =>
    AppKey.TWO_FA_WALLET_CONFIG + '::' + walletId;

export const useIsTwoFAEnabledGlobally = () => {
    const { data: settings } = useDevSettings();
    const config = useActiveConfig();
    if (config.flags?.disable_2fa) {
        return false;
    }

    return settings?.twoFAEnabled ?? false;
};

export const useCanViewTwoFA = () => {
    const isEnabled = useIsTwoFAEnabledGlobally();
    const { data } = useTwoFAWalletConfig();
    const account = useActiveAccount();

    const isSuitableAccount = account.type === 'mnemonic' || account.type === 'mam';

    return (isEnabled && isSuitableAccount) || data?.status === 'active';
};

export const useTwoFAApi = () => {
    const config = useTwoFAServiceConfig();
    return useMemo(() => {
        return new Configuration({
            basePath: config.baseUrl
        });
    }, [config.baseUrl]);
};

export const useTwoFAServiceConfig = () => {
    const config = useActiveConfig();

    return useMemo(() => {
        if (!config['2fa_public_key'] || !config['2fa_api_url']) {
            throw new Error('2fa_public_key not found');
        }

        const servicePubKey = BigInt('0x' + config['2fa_public_key']);

        return {
            baseUrl: config['2fa_api_url'],
            servicePubKey,
            confirmMessageTGTtlSeconds: config['2fa_tg_confirm_send_message_ttl_seconds'] ?? 600,
            confirmConnectionTGTtlSeconds: config['2fa_tg_linked_ttl_seconds'] ?? 600,
            botUrl: config['2fa_bot_url'] ?? 'https://t.me/tonkeeper_2fa_bot'
        };
    }, [config]);
};

export const useTwoFAWalletConfigMayBeOfMultisigHost = () => {
    const accounts = useAccountsState();
    const activeAccount = useActiveAccount();
    let multisigSignerInfo;
    try {
        if (activeAccount.type !== 'ton-multisig') {
            multisigSignerInfo = null;
        } else {
            multisigSignerInfo = getMultisigSignerInfo(accounts, activeAccount);
        }
    } catch (e) {
        multisigSignerInfo = null;
    }

    return useTwoFAWalletConfig(
        multisigSignerInfo
            ? {
                  account: multisigSignerInfo.signerAccount,
                  walletId: multisigSignerInfo.signerWallet.id
              }
            : undefined
    );
};

export const useTwoFAWalletConfig = (options?: { account?: Account; walletId?: WalletId }) => {
    const sdk = useAppSdk();
    const activeAccount = useActiveAccount();
    const account = options?.account ?? activeAccount;

    const wallet = options?.walletId
        ? account.getTonWallet(options.walletId)!
        : account.activeTonWallet;
    const twoFAApi = useTwoFAApi();
    const api = useActiveApi();

    const isSuitableAccount = account.type === 'mnemonic' || account.type === 'mam';
    const serviceConfig = useTwoFAServiceConfig();

    const isEnabled = isSuitableAccount;
    const query = useQuery<TwoFAWalletConfig>(
        [QueryKey.twoFAWalletConfig, wallet.id],
        async () => {
            const twoFAEncoder = new TwoFAEncoder(api, wallet.rawAddress);
            const twoFAState = await new TwoFAEncoder(api, wallet.rawAddress).getPluginState();

            let config = await sdk.storage.get<TwoFAWalletConfig>(
                twoFaWalletConfigStorageKey(wallet.id)
            );
            const originalConfigStatus = config?.status;

            if (twoFAState.type === 'active') {
                config = {
                    status: 'active',
                    pluginAddress: twoFAEncoder.pluginAddress.toRawString(),
                    botUrl: serviceConfig.botUrl
                };
                await sdk.storage.set(twoFaWalletConfigStorageKey(wallet.id), config);
                return config;
            }

            if (twoFAState.type === 'deactivating') {
                config = {
                    status: 'disabling',
                    pluginAddress: twoFAEncoder.pluginAddress.toRawString(),
                    willBeDisabledAtUnixSeconds: twoFAState.willBeDisabledAtUnixSeconds
                };

                await sdk.storage.set(twoFaWalletConfigStorageKey(wallet.id), config);
                return config;
            }

            if (twoFAState.type !== 'not_exist') {
                assertUnreachable(twoFAState);
            }

            if (config?.status === 'active' || config?.status === 'disabling') {
                config = null;
            }

            if (
                config?.status === 'tg-bot-bounding' &&
                config.expiresAtUnixSeconds < Date.now() / 1000
            ) {
                config = null;
            }

            if (config?.status === 'tg-bot-bounding') {
                try {
                    const result = await new AuthApi(twoFAApi).existsExtension({
                        existsExtensionRequest: {
                            wallet: wallet.rawAddress
                        }
                    });

                    if (result.ok) {
                        config = {
                            status: 'ready-for-deployment',
                            botUrl: authUrlToBotUrl(config.authUrl)
                        };
                    }
                } catch (e) {
                    console.error(e);
                }
            }

            if (config?.status !== originalConfigStatus) {
                await sdk.storage.set(twoFaWalletConfigStorageKey(wallet.id), config);
            }

            return config;
        },
        {
            keepPreviousData: true,
            enabled: isEnabled,
            refetchInterval: d =>
                d?.status === 'tg-bot-bounding' || d?.status === 'ready-for-deployment'
                    ? 1000
                    : d?.status === 'disabling' || d?.status === 'active'
                    ? 10000
                    : false
        }
    );

    return {
        ...query,
        isEnabled
    };
};

const authUrlToBotUrl = (authUrl: string) => {
    const u = new URL(authUrl);
    return u.origin + u.pathname;
};

export const useMutateTwoFAWalletConfig = () => {
    const sdk = useAppSdk();
    const wallet = useActiveWallet();
    const client = useQueryClient();

    return useMutation(async (newConfig: Partial<TwoFAWalletConfig>) => {
        const config =
            (await sdk.storage.get<TwoFAWalletConfig>(twoFaWalletConfigStorageKey(wallet.id))) ||
            {};
        await sdk.storage.set(twoFaWalletConfigStorageKey(wallet.id), { ...config, ...newConfig });
        await client.invalidateQueries(anyOfKeysParts(QueryKey.twoFAWalletConfig));
    });
};

export const useRemoveAccountTwoFAData = () => {
    const sdk = useAppSdk();
    const accounts = useAccountsState();

    return useMutation(async (accountId: AccountId) => {
        const account = accounts.find(item => item.id === accountId);
        if (!account) {
            return;
        }
        for (const wallet of account.allTonWallets) {
            await sdk.storage.delete(twoFaWalletConfigStorageKey(wallet.id));
        }
    });
};

export const useGetBoundingTwoFABotLink = (options?: { forReconnect?: boolean }) => {
    const twoFAApi = useTwoFAApi();
    const { mutateAsync: signTonProof } = useSignTonProof();
    const address = useActiveWallet().rawAddress;
    const toast = useToast();
    const { t } = useTranslation();

    return useMutation<string>(async () => {
        try {
            const { payload } = await new AuthApi(twoFAApi).getPayload();
            const origin = 'https://2fa.tonkeeper.com';

            const { timestamp, signature, stateInit, domain } = await signTonProof({
                origin,
                payload
            });

            let res;
            if (options?.forReconnect) {
                res = await new AuthApi(twoFAApi).reConnect({
                    connectRequest: {
                        address,
                        proof: {
                            timestamp,
                            stateInit,
                            domain: domain.value,
                            payload,
                            signature
                        }
                    }
                });
            } else {
                res = await new AuthApi(twoFAApi).connect({
                    connectRequest: {
                        address,
                        proof: {
                            timestamp,
                            stateInit,
                            domain: domain.value,
                            payload,
                            signature
                        }
                    }
                });
            }

            return res.url;
        } catch (e) {
            console.error(e);
            toast(t('please_try_again_later'));
            throw e;
        }
    });
};

export const useBoundTwoFABot = () => {
    const client = useQueryClient();
    const { mutateAsync } = useMutateTwoFAWalletConfig();
    const serviceConfig = useTwoFAServiceConfig();
    const { mutateAsync: getLink } = useGetBoundingTwoFABotLink();

    return useMutation<string>(async () => {
        const authUrl = await getLink();

        await mutateAsync({
            status: 'tg-bot-bounding',
            authUrl,
            expiresAtUnixSeconds:
                Math.round(Date.now() / 1000) + serviceConfig.confirmConnectionTGTtlSeconds
        });
        await client.invalidateQueries([QueryKey.twoFAWalletConfig]);

        return authUrl;
    });
};

export const useIsTwoFAActivationProcess = () => {
    const wallet = useActiveWallet();
    const { data: config } = useTwoFAWalletConfig();

    return useQuery([QueryKey.twoFAActivationProcess, wallet.id], () => false, {
        initialData: false,
        enabled: config?.status === 'active'
    });
};

export const useIsTwoFARemovingProcess = () => {
    const wallet = useActiveWallet();
    const { data: config } = useTwoFAWalletConfig();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (
            config === null &&
            queryClient.getQueryData([QueryKey.twoFARemovingProcess, wallet.id])
        ) {
            queryClient.setQueryData([QueryKey.twoFARemovingProcess, wallet.id], false);
        }
    }, [config, wallet.id]);

    return useQuery(
        [QueryKey.twoFARemovingProcess, wallet.id],
        ctx => queryClient.getQueryData(ctx.queryKey),
        {
            initialData: false
        }
    );
};

export const useIsTwoFACancelRecoveryProcess = () => {
    const wallet = useActiveWallet();
    const { data: config } = useTwoFAWalletConfig();

    return useQuery([QueryKey.twoFACancellRecoveryProcess, wallet.id], () => false, {
        initialData: false,
        enabled: config?.status !== 'disabling'
    });
};
