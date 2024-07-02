import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { mnemonicValidate } from '@ton/crypto';
import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { APIConfig } from '@tonkeeper/core/dist/entries/apis';
import { AuthState } from '@tonkeeper/core/dist/entries/password';
import { createNewStandardTonWalletStateFromMnemonic } from '@tonkeeper/core/dist/service/walletService';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { IconPage } from '../../components/Layout';
import { CheckLottieIcon, ConfettiLottieIcon } from '../../components/lottie/LottieIcons';
import { useAppContext } from '../../hooks/appContext';
import { useAfterImportAction, useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { getPasswordByNotification } from '../../state/mnemonic';
import { walletsStorage } from '@tonkeeper/core/dist/service/walletsService';
import { StandardTonWalletState } from '@tonkeeper/core/dist/entries/wallet';
import { encrypt } from '@tonkeeper/core/dist/service/cryptoService';

const createWalletWithKeychain = async (
    client: QueryClient,
    api: APIConfig,
    sdk: IAppSdk,
    mnemonic: string[]
) => {
    if (!sdk.keychain) {
        throw new Error('Keychain is not define');
    }

    const state = await createNewStandardTonWalletStateFromMnemonic(api, mnemonic, {
        kind: 'keychain'
    });
    state.auth = { kind: 'keychain' };

    await sdk.keychain.setPassword(state.publicKey, mnemonic.join(' '));

    await walletsStorage(sdk.storage).addWalletToState(state);

    await client.invalidateQueries([QueryKey.account]);
    return state;
};

const createWallet = async (
    client: QueryClient,
    api: APIConfig,
    sdk: IAppSdk,
    mnemonic: string[],
    password: string
) => {
    if (!password) {
        throw new Error('Missing encrypt password key');
    }

    const encryptedMnemonic = await encrypt(mnemonic.join(' '), password);
    const state = await createNewStandardTonWalletStateFromMnemonic(api, mnemonic, {
        kind: 'password',
        encryptedMnemonic
    });
    await walletsStorage(sdk.storage).addWalletToState(state);

    await client.invalidateQueries([QueryKey.account]);
    return state;
};

export const useAddWalletMutation = () => {
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const client = useQueryClient();

    return useMutation<
        false | StandardTonWalletState,
        Error,
        { mnemonic: string[]; password?: string; supportedAuthTypes?: AuthState['kind'][] }
    >(async ({ mnemonic, password, supportedAuthTypes }) => {
        const valid = await mnemonicValidate(mnemonic);
        if (!valid) {
            throw new Error('Mnemonic is not valid.');
        }

        if (
            supportedAuthTypes &&
            supportedAuthTypes.length === 1 &&
            supportedAuthTypes[0] === 'keychain'
        ) {
            return createWalletWithKeychain(client, api, sdk, mnemonic);
        }

        const walletsState = await walletsStorage(sdk.storage).getWallets();
        if (walletsState.length === 0 && password === undefined) {
            return false;
        }

        if (!password) {
            password = await getPasswordByNotification(sdk);
        }

        return createWallet(client, api, sdk, mnemonic, password);
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
