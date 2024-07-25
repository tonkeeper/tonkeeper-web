import React, { useEffect, useState } from 'react';
import { CreateAuthState } from '../../components/create/CreateAuth';
import { UpdateWalletName } from '../../components/create/WalletName';
import { ImportWords } from '../../components/create/Words';
import { useAppSdk } from '../../hooks/appSdk';
import { FinalView } from './Password';
import { Subscribe } from './Subscribe';
import {
    useCreateAccountMnemonic,
    useMutateRenameAccount,
    useAccountsState
} from '../../state/wallet';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { ChoseWalletVersions } from '../../components/create/ChoseWalletVersions';
import { AccountTonMnemonic } from '@tonkeeper/core/dist/entries/account';

const Import = () => {
    const sdk = useAppSdk();

    const [mnemonic, setMnemonic] = useState<string[] | undefined>();
    const [account, setAccount] = useState<AccountTonMnemonic | undefined>(undefined);
    const [selectedVersions, setSelectedVersions] = useState<WalletVersion[] | undefined>(
        undefined
    );

    const [createdPassword, setCreatedPassword] = useState<string | undefined>(undefined);
    const [passName, setPassName] = useState(false);
    const [passNotifications, setPassNotification] = useState(false);
    const existingWallets = useAccountsState();
    const { mutateAsync: renameAccount, isLoading: renameLoading } =
        useMutateRenameAccount<AccountTonMnemonic>();

    const {
        mutateAsync: createWalletsAsync,
        isLoading: isCreatingWallets,
        reset: resetCreateWallets
    } = useCreateAccountMnemonic();

    const authExists = createdPassword || existingWallets.length >= 1;

    useEffect(() => {
        if (authExists && selectedVersions && mnemonic) {
            createWalletsAsync({
                mnemonic,
                password: createdPassword,
                versions: selectedVersions,
                selectAccount: true
            }).then(setAccount);
        }

        return resetCreateWallets;
    }, [authExists, createdPassword, selectedVersions, mnemonic, createWalletsAsync]);

    if (!mnemonic) {
        return <ImportWords onMnemonic={setMnemonic} />;
    }

    if (authExists) {
        if (!account) {
            return (
                <ChoseWalletVersions
                    mnemonic={mnemonic}
                    onSubmit={setSelectedVersions}
                    onBack={() => {
                        setAccount(undefined);
                        setMnemonic(undefined);
                    }}
                    isLoading={isCreatingWallets}
                />
            );
        }
    } else {
        if (!selectedVersions) {
            return (
                <ChoseWalletVersions
                    mnemonic={mnemonic}
                    onSubmit={setSelectedVersions}
                    onBack={() => {
                        setAccount(undefined);
                        setMnemonic(undefined);
                    }}
                />
            );
        }

        if (!account) {
            return (
                <CreateAuthState afterCreate={setCreatedPassword} isLoading={isCreatingWallets} />
            );
        }
    }

    if (existingWallets.length > 1 && !passName) {
        return (
            <UpdateWalletName
                name={account.name}
                submitHandler={val => {
                    renameAccount({
                        id: account.id,
                        ...val
                    }).then(newAcc => {
                        setPassName(true);
                        setAccount(newAcc);
                    });
                }}
                walletEmoji={account.emoji}
                isLoading={renameLoading}
            />
        );
    }

    if (sdk.notifications && !passNotifications) {
        return (
            <Subscribe
                wallet={account.activeTonWallet}
                mnemonic={mnemonic}
                onDone={() => setPassNotification(true)}
            />
        );
    }

    return <FinalView />;
};

export default Import;
