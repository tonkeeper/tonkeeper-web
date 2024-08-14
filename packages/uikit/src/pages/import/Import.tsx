import React, { useState } from 'react';
import { UpdateWalletName } from '../../components/create/WalletName';
import { ImportWords } from '../../components/create/Words';
import { useAppSdk } from '../../hooks/appSdk';
import { FinalView } from './Password';
import { Subscribe } from './Subscribe';
import {
    useCheckIfMnemonicIsMAM,
    useCreateAccountMAM,
    useCreateAccountMnemonic,
    useMutateRenameAccount
} from '../../state/wallet';
import { ChoseWalletVersions } from '../../components/create/ChoseWalletVersions';
import { AccountMAM, AccountTonMnemonic } from '@tonkeeper/core/dist/entries/account';

const Import = () => {
    const sdk = useAppSdk();

    const [mnemonic, setMnemonic] = useState<string[] | undefined>();
    const [createdAccount, setCreatedAccount] = useState<
        AccountTonMnemonic | AccountMAM | undefined
    >(undefined);

    const [editNamePagePassed, setEditNamePagePassed] = useState(false);
    const [notificationsSubscribePagePassed, setNotificationsSubscribePagePassed] = useState(false);
    const { mutateAsync: renameAccount, isLoading: renameLoading } =
        useMutateRenameAccount<AccountTonMnemonic>();

    const { mutateAsync: createWalletsAsync, isLoading: isCreatingWallets } =
        useCreateAccountMnemonic();
    const { mutateAsync: createAccountMam, isLoading: isCreatingAccountMam } =
        useCreateAccountMAM();
    const { mutateAsync: checkIfMnemonicIsMAM, isLoading: isCheckingIfMnemonicIsMAM } =
        useCheckIfMnemonicIsMAM();

    const onMnemonic = async (m: string[]) => {
        const _isMam = await checkIfMnemonicIsMAM(m);
        if (_isMam) {
            const newAccountMam = await createAccountMam({ mnemonic: m, selectAccount: true });
            setCreatedAccount(newAccountMam);
        }

        setMnemonic(m);
    };

    if (!mnemonic) {
        return (
            <ImportWords
                onMnemonic={onMnemonic}
                isLoading={isCheckingIfMnemonicIsMAM || isCreatingAccountMam}
            />
        );
    }

    if (!createdAccount) {
        return (
            <ChoseWalletVersions
                mnemonic={mnemonic}
                onSubmit={versions => {
                    createWalletsAsync({
                        mnemonic,
                        versions,
                        selectAccount: true
                    }).then(setCreatedAccount);
                }}
                onBack={() => {
                    setCreatedAccount(undefined);
                    setMnemonic(undefined);
                }}
                isLoading={isCreatingWallets}
            />
        );
    }

    if (!editNamePagePassed) {
        return (
            <UpdateWalletName
                name={createdAccount.name}
                submitHandler={val => {
                    renameAccount({
                        id: createdAccount.id,
                        ...val
                    }).then(newAcc => {
                        setEditNamePagePassed(true);
                        setCreatedAccount(newAcc);
                    });
                }}
                walletEmoji={createdAccount.emoji}
                isLoading={renameLoading}
            />
        );
    }

    if (sdk.notifications && !notificationsSubscribePagePassed) {
        return (
            <Subscribe
                wallet={createdAccount.activeTonWallet}
                mnemonic={mnemonic}
                onDone={() => setNotificationsSubscribePagePassed(true)}
            />
        );
    }

    return <FinalView />;
};

export default Import;
