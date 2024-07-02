import { AuthState } from '@tonkeeper/core/dist/entries/password';
import React, { FC, useState } from 'react';
import { CreateAuthState } from '../../components/create/CreateAuth';
import { UpdateWalletName } from '../../components/create/WalletName';
import { ImportWords } from '../../components/create/Words';
import { useAppSdk } from '../../hooks/appSdk';
import { FinalView, useAddWalletMutation } from './Password';
import { Subscribe } from './Subscribe';
import { useWalletsState } from '../../state/wallet';
import { StandardTonWalletState } from '@tonkeeper/core/dist/entries/wallet';

const Import: FC<{ listOfAuth: AuthState['kind'][] }> = ({ listOfAuth }) => {
    const sdk = useAppSdk();

    const [mnemonic, setMnemonic] = useState<string[]>([]);
    const [wallet, setWallet] = useState<StandardTonWalletState | undefined>(undefined);
    const [hasPassword, setHasPassword] = useState(false);
    const [passNotifications, setPassNotification] = useState(false);
    const existingWallets = useWalletsState();

    const {
        mutateAsync: checkPasswordAndCreateWalletAsync,
        isLoading: isConfirmLoading,
        reset
    } = useAddWalletMutation();

    if (mnemonic.length === 0) {
        return (
            <ImportWords
                isLoading={isConfirmLoading}
                onMnemonic={m => {
                    checkPasswordAndCreateWalletAsync({
                        mnemonic: m,
                        supportedAuthTypes: listOfAuth
                    }).then(state => {
                        setMnemonic(m);
                        if (state === false) {
                            setHasPassword(false);
                        } else {
                            setHasPassword(true);
                            setWallet(state);
                        }
                    });
                }}
            />
        );
    }

    if (!hasPassword) {
        return (
            <CreateAuthState
                afterCreate={(password?: string) => {
                    reset();
                    checkPasswordAndCreateWalletAsync({ mnemonic, password }).then(state => {
                        if (state !== false) {
                            setHasPassword(true);
                            setWallet(state);
                        }
                    });
                }}
                isLoading={isConfirmLoading}
            />
        );
    }

    if (existingWallets.length > 1 && wallet) {
        return (
            <UpdateWalletName
                name={wallet.name}
                submitHandler={val =>
                    setWallet(w => ({
                        ...w!,
                        ...val
                    }))
                }
                walletEmoji={wallet.emoji}
            />
        );
    }

    if (sdk.notifications && !passNotifications) {
        return (
            <Subscribe
                wallet={wallet!}
                mnemonic={mnemonic}
                onDone={() => setPassNotification(true)}
            />
        );
    }

    return <FinalView />;
};

export default Import;
