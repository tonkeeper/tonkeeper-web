import { AccountState } from '@tonkeeper/core/dist/entries/account';
import { AuthState } from '@tonkeeper/core/dist/entries/password';
import React, { FC, useState } from 'react';
import { CreateAuthState } from '../../components/create/CreateAuth';
import { UpdateWalletName } from '../../components/create/WalletName';
import { ImportWords } from '../../components/create/Words';
import { useAppSdk } from '../../hooks/appSdk';
import { useActiveWallet } from '../../state/wallet';
import { FinalView, useAddWalletMutation } from './Password';
import { Subscribe } from './Subscribe';

const Import: FC<{ listOfAuth: AuthState['kind'][] }> = ({ listOfAuth }) => {
    const sdk = useAppSdk();

    const [mnemonic, setMnemonic] = useState<string[]>([]);
    const [account, setAccount] = useState<AccountState | undefined>(undefined);
    const [hasPassword, setHasPassword] = useState(false);
    const [passNotifications, setPassNotification] = useState(false);

    const { data: wallet } = useActiveWallet();

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
                    checkPasswordAndCreateWalletAsync({ mnemonic: m, listOfAuth }).then(state => {
                        setMnemonic(m);
                        if (state === false) {
                            setHasPassword(false);
                        } else {
                            setHasPassword(true);
                            setAccount(state);
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
                            setAccount(state);
                        }
                    });
                }}
                isLoading={isConfirmLoading}
            />
        );
    }

    if (account && account.publicKeys.length > 1 && wallet && wallet.name == null) {
        return <UpdateWalletName account={account} onUpdate={setAccount} />;
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
