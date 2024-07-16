import React, { useEffect, useState } from 'react';
import { CreateAuthState } from '../../components/create/CreateAuth';
import { UpdateWalletName } from '../../components/create/WalletName';
import { ImportWords } from '../../components/create/Words';
import { useAppSdk } from '../../hooks/appSdk';
import { FinalView } from './Password';
import { Subscribe } from './Subscribe';
import {
    useCreateStandardTonWalletsByMnemonic,
    useMutateRenameWallet,
    useWalletsState
} from '../../state/wallet';
import { StandardTonWalletState, WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { ChoseWalletVersions } from '../../components/create/ChoseWalletVersions';

const Import = () => {
    const sdk = useAppSdk();

    const [mnemonic, setMnemonic] = useState<string[] | undefined>();
    const [wallets, setWallets] = useState<StandardTonWalletState[] | undefined>(undefined);
    const [selectedVersions, setSelectedVersions] = useState<WalletVersion[] | undefined>(
        undefined
    );

    const [createdPassword, setCreatedPassword] = useState<string | undefined>(undefined);
    const [passName, setPassName] = useState(false);
    const [passNotifications, setPassNotification] = useState(false);
    const existingWallets = useWalletsState();
    const { mutateAsync: renameWallet, isLoading: renameLoading } = useMutateRenameWallet();

    const {
        mutateAsync: createWalletsAsync,
        isLoading: isCreatingWallets,
        reset: resetCreateWallets
    } = useCreateStandardTonWalletsByMnemonic();

    const authExists = createdPassword || existingWallets.length >= 1;

    useEffect(() => {
        if (authExists && selectedVersions && mnemonic) {
            createWalletsAsync({
                mnemonic,
                password: createdPassword,
                versions: selectedVersions,
                activateFirstWallet: true
            }).then(setWallets);
        }

        return resetCreateWallets;
    }, [authExists, createdPassword, selectedVersions, mnemonic, createWalletsAsync]);

    if (!mnemonic) {
        return <ImportWords onMnemonic={setMnemonic} />;
    }

    if (authExists) {
        if (!wallets) {
            return (
                <ChoseWalletVersions
                    mnemonic={mnemonic}
                    onSubmit={setSelectedVersions}
                    onBack={() => {
                        setWallets(undefined);
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
                        setWallets(undefined);
                        setMnemonic(undefined);
                    }}
                />
            );
        }

        if (!wallets) {
            return (
                <CreateAuthState afterCreate={setCreatedPassword} isLoading={isCreatingWallets} />
            );
        }
    }

    if (existingWallets.length > 1 && wallets.length === 1 && !passName) {
        return (
            <UpdateWalletName
                name={wallets[0].name}
                submitHandler={val => {
                    setWallets(w => [{ ...w![0], ...val }]);
                    renameWallet({
                        id: wallets![0].id,
                        ...val
                    }).then(() => setPassName(true));
                }}
                walletEmoji={wallets[0].emoji}
                isLoading={renameLoading}
            />
        );
    }

    if (sdk.notifications && !passNotifications && wallets.length === 1) {
        return (
            <Subscribe
                wallet={wallets[0]!}
                mnemonic={mnemonic}
                onDone={() => setPassNotification(true)}
            />
        );
    }

    return <FinalView />;
};

export default Import;
