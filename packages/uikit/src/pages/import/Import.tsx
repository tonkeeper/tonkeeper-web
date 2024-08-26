import React, { useState } from 'react';
import { UpdateWalletName } from '../../components/create/WalletName';
import { ImportWords } from '../../components/create/Words';
import { useAppSdk } from '../../hooks/appSdk';
import { FinalView } from './Password';
import { Subscribe } from './Subscribe';
import {
    useAccountsState,
    useCheckIfMnemonicIsMAM,
    useCreateAccountMAM,
    useCreateAccountMnemonic,
    useMutateRenameAccount
} from '../../state/wallet';
import { ChoseWalletVersions } from '../../components/create/ChoseWalletVersions';
import {
    AccountMAM,
    AccountTonMnemonic,
    getAccountByWalletById
} from '@tonkeeper/core/dist/entries/account';
import { createStandardTonAccountByMnemonic } from '@tonkeeper/core/dist/service/walletService';
import { useAppContext } from '../../hooks/appContext';
import { WalletId, WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { AccountIsAlreadyAdded } from '../../components/create/AccountIsAlreadyAdded';

const Import = () => {
    const sdk = useAppSdk();
    const context = useAppContext();
    const accounts = useAccountsState();

    const [mnemonic, setMnemonic] = useState<string[] | undefined>();
    const [createdAccount, setCreatedAccount] = useState<
        AccountTonMnemonic | AccountMAM | undefined
    >(undefined);
    const [existingAccountAndWallet, setExistingAccountAndWallet] = useState<
        | {
              account: Account;
              walletId: WalletId;
          }
        | undefined
    >();

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
            const existingAcc = accounts.find(a => a.id === newAccountMam.id);
            if (existingAcc) {
                setExistingAccountAndWallet({
                    account: existingAcc,
                    walletId: existingAcc.activeTonWallet.id
                });
            } else {
                setCreatedAccount(newAccountMam);
            }
        } else {
            const _account = await createStandardTonAccountByMnemonic(context, sdk.storage, m, {
                auth: {
                    kind: 'keychain'
                },
                versions: [
                    WalletVersion.V5R1,
                    WalletVersion.V5_BETA,
                    WalletVersion.V4R2,
                    WalletVersion.V3R2,
                    WalletVersion.V3R1
                ]
            });

            for (const w of _account.allTonWallets) {
                const existingAcc = getAccountByWalletById(accounts, w.id);
                if (existingAcc) {
                    setExistingAccountAndWallet({ account: existingAcc, walletId: w.id });
                    break;
                }
            }
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

    if (existingAccountAndWallet) {
        return (
            <AccountIsAlreadyAdded
                {...existingAccountAndWallet}
                onBack={() => {
                    setExistingAccountAndWallet(undefined);
                    setMnemonic(undefined);
                }}
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
