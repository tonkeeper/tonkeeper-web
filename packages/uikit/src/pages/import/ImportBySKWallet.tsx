import { Account, AccountTonSK } from '@tonkeeper/core/dist/entries/account';
import React, { FC, useContext, useMemo, useState } from 'react';
import { CustomizeWallet } from '../../components/create/CustomizeWallet';
import {
    useAccountsState,
    useCreateAccountTonSK,
    useMutateRenameAccount
} from '../../state/wallet';
import { useMutateWalletColor, useWalletColorResolver } from '../../state/walletColor';
import { FinalView } from './Password';
import { useConfirmDiscardNotification } from '../../components/modals/ConfirmDiscardNotificationControlled';
import { AddWalletContext } from '../../components/create/AddWalletContext';
import {
    OnCloseInterceptor,
    useSetModalOnBack,
    useSetModalOnCloseInterceptor
} from '../../primitives/Modal';
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
import { useImportFlowAnalytics } from '../../hooks/analytics/wallet-flow';

export const ImportBySKWallet: FC<{
    afterCompleted: () => void;
    signingAlgorithm: SKSigningAlgorithm;
}> = ({ afterCompleted, signingAlgorithm }) => {
    const { mutateAsync: createWalletsAsync, isLoading: isCreateWalletLoading } =
        useCreateAccountTonSK();
    const { mutateAsync: renameWallet, isLoading: renameLoading } = useMutateRenameAccount();
    const resolveWalletColor = useWalletColorResolver();
    const { setWalletColor } = useMutateWalletColor();

    const [accountCandidate, setAccountCandidate] = useState<
        { account: AccountTonSK; sk: string } | undefined
    >(undefined);
    const [createdAccount, setCreatedAccount] = useState<AccountTonSK | undefined>(undefined);

    const importAnalytics = useImportFlowAnalytics('privatekey');

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
    useSetModalOnBack(onBack);

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
    useSetModalOnCloseInterceptor(onCloseInterceptor);

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
            try {
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
            } catch (e) {
                importAnalytics.error(e);
                sdk.topMessage('Failed to process secret key');
            }
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
                    }).then(account => {
                        setCreatedAccount(account);
                        importAnalytics.success();
                    }, importAnalytics.error);
                }}
                isLoading={isCreateWalletLoading}
            />
        );
    }

    if (!editNamePagePassed) {
        return (
            <CustomizeWallet
                name={createdAccount.name}
                submitHandler={async ({ name, emoji, colorId }) => {
                    await setWalletColor(createdAccount.id, colorId);
                    const newAcc = await renameWallet({ id: createdAccount.id, name, emoji });
                    setEditNamePagePassed(true);
                    setCreatedAccount(newAcc as AccountTonSK);
                }}
                walletEmoji={createdAccount.emoji}
                walletColorId={resolveWalletColor(createdAccount.id).id}
                isLoading={renameLoading}
            />
        );
    }

    return <FinalView afterCompleted={afterCompleted} />;
};
