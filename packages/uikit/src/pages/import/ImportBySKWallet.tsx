import { Account, AccountTonSK } from '@tonkeeper/core/dist/entries/account';
import React, { FC, useContext, useMemo, useState } from 'react';
import { UpdateWalletName } from '../../components/create/WalletName';
import {
    useAccountsState,
    useCreateAccountTonSK,
    useMutateRenameAccount
} from '../../state/wallet';
import { FinalView } from './Password';
import { useConfirmDiscardNotification } from '../../components/modals/ConfirmDiscardNotificationControlled';
import { AddWalletContext } from '../../components/create/AddWalletContext';
import {
    OnCloseInterceptor,
    useSetNotificationOnBack,
    useSetNotificationOnCloseInterceptor
} from '../../components/Notification';
import { AccountIsAlreadyAdded } from '../../components/create/AccountIsAlreadyAdded';
import { WalletId, WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { SKInput } from '../../components/create/SKInput';
import { ChoseWalletVersions } from '../../components/create/ChoseWalletVersions';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { createStandardTonAccountBySK } from '@tonkeeper/core/dist/service/walletService';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useMutation } from '@tanstack/react-query';
import { SKSigningAlgorithm } from '@tonkeeper/core/dist/service/sign';

export const ImportBySKWallet: FC<{
    afterCompleted: () => void;
    signingAlgorithm: SKSigningAlgorithm;
}> = ({ afterCompleted, signingAlgorithm }) => {
    const { mutateAsync: createWalletsAsync, isLoading: isCreateWalletLoading } =
        useCreateAccountTonSK();
    const { mutateAsync: renameWallet, isLoading: renameLoading } = useMutateRenameAccount();

    const [accountCandidate, setAccountCandidate] = useState<
        { account: AccountTonSK; sk: string } | undefined
    >(undefined);
    const [createdAccount, setCreatedAccount] = useState<AccountTonSK | undefined>(undefined);

    const [editNamePagePassed, setEditNamePagePassed] = useState(false);

    const [isDirty, setIsDirty] = useState(false);

    const { onOpen: openConfirmDiscard } = useConfirmDiscardNotification();
    const { navigateHome } = useContext(AddWalletContext);
    const onBack = useMemo(() => {
        if (!accountCandidate) {
            return undefined;
        }
        if (!createdAccount) {
            if (!isDirty) {
                return navigateHome;
            }

            return () =>
                openConfirmDiscard({
                    onClose: discard => {
                        if (discard) {
                            navigateHome?.();
                        }
                    }
                });
        }
        return undefined;
    }, [navigateHome, createdAccount, isDirty, openConfirmDiscard, accountCandidate]);
    useSetNotificationOnBack(onBack);

    const onCloseInterceptor = useMemo<OnCloseInterceptor>(() => {
        if (!isDirty) {
            return undefined;
        }

        if (createdAccount) {
            return undefined;
        }

        return (closeModal, cancelClose) => {
            openConfirmDiscard({
                onClose: discard => {
                    if (discard) {
                        closeModal();
                    } else {
                        cancelClose();
                    }
                }
            });
        };
    }, [createdAccount, openConfirmDiscard, isDirty]);
    useSetNotificationOnCloseInterceptor(onCloseInterceptor);

    const [existingAccountAndWallet, setExistingAccountAndWallet] = useState<
        | {
              account: Account;
              walletId: WalletId;
          }
        | undefined
    >();
    const accounts = useAccountsState();
    const context = useAppContext();
    const sdk = useAppSdk();

    const { mutate: onSKSubmit, isLoading: isSubmitingSk } = useMutation(
        async (secretKey: string) => {
            const possibleAccount = await createStandardTonAccountBySK(
                context,
                sdk.storage,
                { key: secretKey, algorithm: signingAlgorithm },
                {
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
                }
            );

            const existingAccount = accounts.find(a => a.id === possibleAccount.id);
            if (existingAccount) {
                setExistingAccountAndWallet({
                    account: existingAccount,
                    walletId: existingAccount.activeTonWallet.id
                });
                return;
            }
            setAccountCandidate({ account: possibleAccount, sk: secretKey });
        }
    );

    if (existingAccountAndWallet) {
        return (
            <AccountIsAlreadyAdded {...existingAccountAndWallet} onOpenAccount={afterCompleted} />
        );
    }

    if (!accountCandidate) {
        return (
            <SKInput
                signingAlgorithm={signingAlgorithm}
                afterInput={onSKSubmit}
                isLoading={isSubmitingSk}
                onIsDirtyChange={setIsDirty}
            />
        );
    }

    if (!createdAccount) {
        return (
            <ChoseWalletVersions
                network={Network.MAINNET}
                publicKey={accountCandidate.account.activeTonWallet.publicKey}
                onSubmit={versions => {
                    createWalletsAsync({
                        secret: { key: accountCandidate.sk, algorithm: signingAlgorithm },
                        versions,
                        selectAccount: true
                    }).then(setCreatedAccount);
                }}
                isLoading={isCreateWalletLoading}
            />
        );
    }

    if (!editNamePagePassed) {
        return (
            <UpdateWalletName
                name={createdAccount.name}
                submitHandler={val => {
                    renameWallet({
                        id: createdAccount.id,
                        ...val
                    }).then(newAcc => {
                        setEditNamePagePassed(true);
                        setCreatedAccount(newAcc as AccountTonSK);
                    });
                }}
                walletEmoji={createdAccount.emoji}
                isLoading={renameLoading}
            />
        );
    }

    return <FinalView afterCompleted={afterCompleted} />;
};
