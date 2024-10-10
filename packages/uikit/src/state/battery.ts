import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Battery } from '@tonkeeper/core/dist/batteryApi';
import { QueryKey } from '../libs/queryKey';
import type { RechargeMethods } from '@tonkeeper/core/dist/batteryApi/models/RechargeMethods';

import { useActiveAccount } from './wallet';
import { useSignTonProof } from '../hooks/accountUtils';
import { useMemo } from 'react';
import { useAppSdk } from '../hooks/appSdk';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { AppKey } from '@tonkeeper/core/dist/Keys';

const useBatteryApi = () => {
    return useMemo(() => new Battery(), []);
};

export const useBatteryOnChainRechargeMethods = () => {
    return useQuery<RechargeMethods>([QueryKey.batteryOnchainRechargeMethods], async () => {
        const res = await new Battery().default.getRechargeMethods(false);
        if ('error' in res) {
            throw new Error(res.error);
        }

        return res;
    });
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
    const account = useActiveAccount();
    const { mutateAsync: signTonProof } = useSignTonProof();
    const batteryApi = useBatteryApi();
    const sdk = useAppSdk();
    const client = useQueryClient();

    return useMutation(async () => {
        if (account.type !== 'mnemonic') {
            throw new Error('Invalid account type');
        }
        const { payload } = await batteryApi.connect.getTonConnectPayload();
        const domain = 'todo';

        const proof = await signTonProof({ payload, domain });
        const res = await batteryApi.wallet.tonConnectProof({
            address: account.activeTonWallet.rawAddress,
            proof: {
                timestamp: proof.timestamp,
                domain: {
                    value: proof.domain.value,
                    length_bytes: proof.domain.lengthBytes
                },
                signature: proof.signature,
                payload,
                state_init: proof.stateInit
            }
        });

        await sdk.storage.set(tokenStorageKey(account.activeTonWallet.publicKey), {
            token: res.token
        });
        await client.invalidateQueries([QueryKey.batteryAuthToken]);
    });
};

const tokenStorageKey = (publicKey: string) => `${AppKey.BATTERY_AUTH_TOKEN}_${publicKey}`;
