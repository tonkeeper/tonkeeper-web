import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { mnemonicValidate } from '@ton/crypto';
import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { AccountState } from '@tonkeeper/core/dist/entries/account';
import { APIConfig } from '@tonkeeper/core/dist/entries/apis';
import { AuthState } from '@tonkeeper/core/dist/entries/password';
import {
    addWalletWithCustomAuthState,
    addWalletWithGlobalAuthState,
    getAccountState
} from '@tonkeeper/core/dist/service/accountService';
import {
    createNewWalletState,
    encryptWalletMnemonic
} from '@tonkeeper/core/dist/service/walletService';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { IconPage } from '../../components/Layout';
import { CheckLottieIcon, ConfettiLottieIcon } from '../../components/lottie/LottieIcons';
import { useAppContext } from '../../hooks/appContext';
import { useAfterImportAction, useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { getPasswordByNotification } from '../../state/mnemonic';

const createWalletWithKeychain = async (
    client: QueryClient,
    api: APIConfig,
    sdk: IAppSdk,
    mnemonic: string[]
) => {
    if (!sdk.keychain) {
        throw new Error('Keychain is not define');
    }

    const state = await createNewWalletState(api, mnemonic);
    state.auth = { kind: 'keychain' };

    await sdk.keychain.setPassword(state.publicKey, mnemonic.join(' '));

    await addWalletWithCustomAuthState(sdk.storage, state);

    await client.invalidateQueries([QueryKey.account]);
    return getAccountState(sdk.storage);
};

const createWallet = async (
    client: QueryClient,
    api: APIConfig,
    sdk: IAppSdk,
    mnemonic: string[],
    auth: AuthState,
    password?: string
) => {
    const key = auth.kind === 'none' ? 'none' : password;
    if (!key) {
        throw new Error('Missing encrypt password key');
    }

    const state = await createNewWalletState(api, mnemonic);
    const encryptedMnemonic = await encryptWalletMnemonic(mnemonic, key);
    await addWalletWithGlobalAuthState(sdk.storage, state, auth, encryptedMnemonic);

    await client.invalidateQueries([QueryKey.account]);
    return getAccountState(sdk.storage);
};

export const useAddWalletMutation = () => {
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const client = useQueryClient();

    return useMutation<
        false | AccountState,
        Error,
        { mnemonic: string[]; password?: string; listOfAuth?: AuthState['kind'][] }
    >(async ({ mnemonic, password, listOfAuth }) => {
        const valid = await mnemonicValidate(mnemonic);
        if (!valid) {
            throw new Error('Mnemonic is not valid.');
        }

        if (listOfAuth && listOfAuth.length === 1 && listOfAuth[0] == 'keychain') {
            return createWalletWithKeychain(client, api, sdk, mnemonic);
        }

        const auth = await sdk.storage.get<AuthState>(AppKey.GLOBAL_AUTH_STATE);
        if (auth === null) {
            return false;
        }
        const account = await getAccountState(sdk.storage);
        if (account.publicKeys.length === 0 && password == undefined) {
            return false;
        }

        if (auth.kind === 'none') {
            return createWallet(client, api, sdk, mnemonic, auth);
        }

        if (!password) {
            password = await getPasswordByNotification(sdk, auth);
        }

        return createWallet(client, api, sdk, mnemonic, auth, password);
    });
};

const ConfettiBlock = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    z-index: 10;
`;

export const FinalView = () => {
    const { t } = useTranslation();
    const afterImport = useAfterImportAction();
    const client = useQueryClient();

    const [size, setSize] = useState<{ width: number; height: number } | undefined>(undefined);

    useEffect(() => {
        client.invalidateQueries([]);
        setTimeout(afterImport, 3000);
    }, []);

    useEffect(() => {
        const { innerWidth: width, innerHeight: height } = window;
        setSize({ width, height });
    }, []);

    return (
        <>
            {size && (
                <ConfettiBlock>
                    <ConfettiLottieIcon {...size} />
                </ConfettiBlock>
            )}
            <IconPage icon={<CheckLottieIcon />} title={t('check_words_success')} />
        </>
    );
};
