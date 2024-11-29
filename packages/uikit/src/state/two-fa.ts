import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { anyOfKeysParts, QueryKey } from '../libs/queryKey';
import { useAppSdk } from '../hooks/appSdk';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { useAccountsState, useActiveAccount, useActiveWallet } from './wallet';
import nacl from 'tweetnacl';
import { useDevSettings } from './dev';
import { useAppContext } from '../hooks/appContext';
import { AccountId } from '@tonkeeper/core/dist/entries/account';
import { AuthApi, Configuration } from '@tonkeeper/core/dist/2faApi';
import { useMemo } from 'react';
import { TwoFADeviceKey } from '@tonkeeper/core/dist/service/ton-blockchain/sender/two-fa-message-sender';

export type TwoFAReadyForActivationWalletConfig = {
    status: 'initial';
    deviceKey: TwoFADeviceKey;
};

export type TwoFATgBotBoundingWalletConfig = {
    status: 'tg-bot-bounding';
    authUrl: string;
    expiresAtUnixSeconds: number;
    deviceKey: TwoFADeviceKey;
};

export type TwoFATgBotBoundedWalletConfig = {
    status: 'ready-for-deployment';
    botUrl: string;
    deviceKey: TwoFADeviceKey;
};

export type TwoFAActiveWalletConfig = {
    status: 'active';
    botUrl: string;
    deviceKey: TwoFADeviceKey;
    pluginAddress: string;
};

export type TwoFADisablingWalletConfig = {
    status: 'disabling';
    deviceKey: TwoFADeviceKey;
    pluginAddress: string;
    willBeDisabledAtUnixSeconds: number;
};

export type TwoFAWalletConfig =
    | TwoFAReadyForActivationWalletConfig
    | TwoFATgBotBoundingWalletConfig
    | TwoFATgBotBoundedWalletConfig
    | TwoFAActiveWalletConfig
    | TwoFADisablingWalletConfig;

const twoFaWalletConfigStorageKey = (walletId: string) =>
    AppKey.TWO_FA_WALLET_CONFIG + '::' + walletId;

export const useIsTwoFAEnabledGlobally = () => {
    const { data: settings } = useDevSettings();

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
    const { config } = useAppContext();
    return useMemo(() => {
        return new Configuration({
            basePath: config['2fa_api_url'] || 'https://2fa.tonapi.io'
        });
    }, []);
};

export const useTwoFAServiceConfig = () => {
    const { config } = useAppContext();

    return useMemo(() => {
        if (!config['2fa_public_key']) {
            throw new Error('2fa_public_key not found');
        }

        const servicePubKey = BigInt(
            '0x' + Buffer.from(config['2fa_public_key'], 'base64').toString('hex')
        );

        return {
            servicePubKey,
            confirmMessageTGTtlSeconds: 60 * 3, // TODO
            confirmConnectionTGTtlSeconds: 60 * 3 // TODO
        };
    }, [config]);
};

export const useTwoFAWalletConfig = () => {
    const sdk = useAppSdk();
    const account = useActiveAccount();
    const isTwoFAEnabledGlobally = useIsTwoFAEnabledGlobally();

    const wallet = account.activeTonWallet;
    const api = useTwoFAApi();

    const isSuitableAccount = account.type === 'mnemonic' || account.type === 'mam';

    return useQuery<TwoFAWalletConfig>(
        [QueryKey.twoFAWalletConfig, wallet.id, isTwoFAEnabledGlobally],
        async () => {
            let config = await sdk.storage.get<TwoFAWalletConfig>(
                twoFaWalletConfigStorageKey(wallet.id)
            );
            const originalConfigStatus = config?.status;
            if (!config) {
                config = {
                    status: 'initial',
                    deviceKey: createNewDeviceKey()
                };
            }

            if (
                config.status === 'tg-bot-bounding' &&
                config.expiresAtUnixSeconds < Date.now() / 1000
            ) {
                config = {
                    status: 'initial',
                    deviceKey: createNewDeviceKey()
                };
            }

            if (config.status === 'tg-bot-bounding') {
                try {
                    const result = await new AuthApi(api).authCheck({
                        authCheckRequest: { devicePublicKey: config.deviceKey.publicKey.slice(2) }
                    });

                    if (result.ok) {
                        config = {
                            status: 'ready-for-deployment',
                            botUrl: authUrlToBotUrl(config.authUrl),
                            deviceKey: config.deviceKey
                        };
                    }
                } catch (e) {
                    console.error(e);
                }
            }

            if (config.status !== originalConfigStatus) {
                await sdk.storage.set(twoFaWalletConfigStorageKey(wallet.id), config);
            }

            return config;
        },
        {
            keepPreviousData: true,
            enabled: isSuitableAccount,
            refetchInterval: d =>
                d?.status === 'tg-bot-bounding' || d?.status === 'disabling' ? 1000 : false
        }
    );
};

const authUrlToBotUrl = (authUrl: string) => {
    const u = new URL(authUrl);
    return u.origin + u.pathname;
};

function createNewDeviceKey(): TwoFADeviceKey {
    const keypair = nacl.sign.keyPair();

    return {
        publicKey: `0x${uint8ArrayToHexString(keypair.publicKey)}`,
        secretKey: `0x${uint8ArrayToHexString(keypair.secretKey)}`
    };
}

function uint8ArrayToHexString(byteArray: Uint8Array): string {
    let hexString = '';
    byteArray.forEach(byte => {
        hexString += ('0' + (byte & 0xff).toString(16)).slice(-2);
    });
    return hexString;
}

export const useMarkTwoFAWalletAsActive = () => {
    const { mutateAsync } = useMutateTwoFAWalletConfig();
    const config = useTwoFAWalletConfig().data;

    return useMutation<void, Error, { pluginAddress: string }>(async ({ pluginAddress }) => {
        if (!config) {
            throw new Error('Config not found');
        }

        await mutateAsync({
            status: 'active',
            deviceKey: config.deviceKey,
            pluginAddress
        });
    });
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

export const useBoundTwoFABot = () => {
    const twoFAApi = useTwoFAApi();
    const client = useQueryClient();
    const twoFaConfig = useTwoFAWalletConfig().data?.deviceKey;
    const { mutateAsync } = useMutateTwoFAWalletConfig();

    return useMutation<string>(async () => {
        if (!twoFaConfig) {
            throw new Error('Unexpected two fa config');
        }
        const { payload } = await new AuthApi(twoFAApi).getAuthPayload();

        const signature = nacl.sign.detached(
            Buffer.from(`two_fa_auth${payload}`, 'utf8'),
            Buffer.from(twoFaConfig.secretKey.slice(2), 'hex')
        );

        const res = await new AuthApi(twoFAApi).auth({
            authRequest: {
                payload,
                signature: Buffer.from(signature).toString('hex'),
                devicePublicKey: twoFaConfig.publicKey.slice(2)
            }
        });

        await mutateAsync({
            status: 'tg-bot-bounding',
            authUrl: res.url,
            expiresAtUnixSeconds: Math.round(Date.now() / 1000) + 60 * 30
        });
        await client.invalidateQueries([QueryKey.twoFAWalletConfig]);

        return res.url;
    });
};

export const useDisconnectTwoFABot = () => {
    const client = useQueryClient();
    const twoFaConfig = useTwoFAWalletConfig().data;
    const sdk = useAppSdk();
    const wallet = useActiveWallet();

    return useMutation(async () => {
        if (!twoFaConfig) {
            throw new Error('Unexpected two fa config');
        }

        if (
            twoFaConfig.status !== 'tg-bot-bounding' &&
            twoFaConfig.status !== 'ready-for-deployment'
        ) {
            throw new Error(`Cannot disconnect bot for status ${twoFaConfig.status}`);
        }

        const newConfig = {
            status: 'initial',
            deviceKey: createNewDeviceKey()
        } as const;

        await sdk.storage.set(twoFaWalletConfigStorageKey(wallet.id), newConfig);
        await client.invalidateQueries([QueryKey.twoFAWalletConfig]);
    });
};
