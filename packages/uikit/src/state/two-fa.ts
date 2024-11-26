import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { anyOfKeysParts, QueryKey } from '../libs/queryKey';
import { useAppSdk } from '../hooks/appSdk';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { useAccountsState, useActiveAccount, useActiveWallet } from './wallet';
import nacl from 'tweetnacl';
import { HexStringPrefixed } from '@tonkeeper/core/dist/utils/types';
import { useDevSettings } from './dev';
import { useAppContext } from '../hooks/appContext';
import { AccountId } from '@tonkeeper/core/dist/entries/account';
import { AuthApi, Configuration } from '@tonkeeper/core/dist/2faApi';
import { useMemo } from 'react';

export type TwoFADeviceKey = {
    publicKey: HexStringPrefixed;
    secretKey: HexStringPrefixed;
};

export type TwoFAReadyForActivationWalletConfig = {
    status: 'ready-for-activation';
    deviceKey: TwoFADeviceKey;
};

export type TwoFATgBotBoundingWalletConfig = {
    status: 'tg-bot-bounding';
    token: string;
    expiresAtUnixSeconds: number;
    deviceKey: TwoFADeviceKey;
};

export type TwoFAActiveWalletConfig = {
    status: 'active';
    deviceKey: TwoFADeviceKey;
};

export type TwoFADisablingWalletConfig = {
    status: 'disabling';
    deviceKey: TwoFADeviceKey;
    willBeDisabledAtUnixSeconds: number;
};

export type TwoFAWalletConfig =
    | TwoFAReadyForActivationWalletConfig
    | TwoFATgBotBoundingWalletConfig
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
            basePath: '2fa.tonapi.io' // TODO endpoint form config
        });
    }, []);
};

export const useTwoFAServiceKey = () => {
    const { config } = useAppContext();

    // TODO
    return 0n;
};

export const useTwoFAWalletConfig = () => {
    const sdk = useAppSdk();
    const account = useActiveAccount();
    const isTwoFAEnabledGlobally = useIsTwoFAEnabledGlobally();

    const wallet = account.activeTonWallet;

    const isSuitableAccount = account.type === 'mnemonic' || account.type === 'mam';

    return useQuery<TwoFAWalletConfig>(
        [QueryKey.twoFAWalletConfig, wallet.id, isTwoFAEnabledGlobally],
        async () => {
            const config = await sdk.storage.get<TwoFAWalletConfig>(
                twoFaWalletConfigStorageKey(wallet.id)
            );
            if (config) {
                return config;
            }

            const newConfig = {
                status: 'ready-for-activation',
                deviceKey: createNewDeviceKey()
            } as const;

            await sdk.storage.set(twoFaWalletConfigStorageKey(wallet.id), newConfig);

            return newConfig;
        },
        {
            keepPreviousData: true,
            enabled: isSuitableAccount
        }
    );
};

function createNewDeviceKey(): TwoFADeviceKey {
    const keypair = nacl.box.keyPair();

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

    return useMutation(async () => {
        if (!config) {
            throw new Error('Config not found');
        }

        await mutateAsync({
            status: 'active',
            deviceKey: config.deviceKey
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

    return useMutation(async () => {
        if (!twoFaConfig) {
            throw new Error('Unexpected two fa config');
        }
        const { payload } = await new AuthApi(twoFAApi).getAuthPayload();

        const signature = nacl.sign.detached(
            Buffer.from(`two_fa_auth${payload}`, 'utf8'),
            Buffer.from(twoFaConfig.secretKey, 'hex')
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
            token: res.url,
            expiresAtUnixSeconds: Math.round(Date.now() / 1000) + 60 * 30
        });
        await client.invalidateQueries([QueryKey.twoFAWalletConfig]);
    });
};
