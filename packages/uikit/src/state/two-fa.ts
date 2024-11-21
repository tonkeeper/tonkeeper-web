import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { anyOfKeysParts, QueryKey } from '../libs/queryKey';
import { useAppSdk } from '../hooks/appSdk';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { useActiveWallet } from './wallet';
import nacl from 'tweetnacl';
import { HexStringPrefixed } from '@tonkeeper/core/dist/utils/types';
import { useDevSettings } from './dev';
import { useAppContext } from '../hooks/appContext';

export type TwoFADeviceKey = {
    publicKey: HexStringPrefixed;
    secretKey: HexStringPrefixed;
};

export type TwoFAReadyForActivationWalletConfig = {
    status: 'ready-for-activation';
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
    | TwoFAActiveWalletConfig
    | TwoFADisablingWalletConfig;

const twoFaWalletConfigStorageKey = (walletId: string) =>
    AppKey.TWO_FA_WALLET_CONFIG + '::' + walletId;

export const useIsTwoFAEnabledGlobally = () => {
    const { data: settings } = useDevSettings();

    return settings?.twoFAEnabled ?? false;
};

export const useTwoFAServiceKey = () => {
    const { config } = useAppContext();

    // TODO
    return 0n;
};

export const useTwoFAWalletConfig = () => {
    const sdk = useAppSdk();
    const wallet = useActiveWallet();
    const isTwoFAEnabledGlobally = useIsTwoFAEnabledGlobally();

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
            keepPreviousData: true
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

    return useMutation(async (newConfig: TwoFAWalletConfig) => {
        await sdk.storage.set(twoFaWalletConfigStorageKey(wallet.id), newConfig);
        await client.invalidateQueries(anyOfKeysParts(QueryKey.twoFAWalletConfig));
    });
};
