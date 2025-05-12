import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import { useAtomValue } from '../libs/useAtom';
import { atom } from '@tonkeeper/core/dist/entries/atom';
import { KeychainSecurity } from '@tonkeeper/core/dist/AppSdk';
import { useMemo } from 'react';
import { usePasswordStorage } from '../hooks/useStorage';
import { getPasswordByNotification } from './mnemonic';

export const useLookScreen = () => {
    const sdk = useAppSdk();
    return useQuery([QueryKey.lock], async () => {
        const lock = await sdk.storage.get<boolean>(AppKey.LOCK);
        return lock ?? false;
    });
};

export const useMutateLookScreen = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, boolean>(async value => {
        await sdk.storage.set(AppKey.LOCK, value);
        await client.invalidateQueries([QueryKey.lock]);
    });
};

export const useCanPromptTouchId = () => {
    const sdk = useAppSdk();
    return useQuery([QueryKey.canPromptTouchId], async () => {
        return sdk.biometry?.canPrompt();
    });
};

const emptyAtom = atom<KeychainSecurity>({});

export const useKeychainSecuritySettings = () => {
    const sdk = useAppSdk();

    const atomValue = useAtomValue(sdk.keychain?.security ?? emptyAtom);
    return useMemo(() => atomValue || {}, [atomValue]);
};

export const useSecurityCheck = () => {
    const sdk = useAppSdk();
    const passwordStorage = usePasswordStorage();
    return useMutation(async () => {
        if (sdk.keychain) {
            return sdk.keychain.securityCheck();
        }

        if (await passwordStorage.getIsPasswordSet()) {
            const pw = await getPasswordByNotification(sdk);
            return passwordStorage.checkPassword(pw);
        }
    });
};
