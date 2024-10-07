import React, { FC, useContext, useMemo, useState } from 'react';
import { UpdateWalletName } from '../../components/create/WalletName';
import { ImportWords } from '../../components/create/Words';
import { useAppSdk } from '../../hooks/appSdk';
import { FinalView } from './Password';
import { Subscribe } from './Subscribe';
import {
    useAccountsState,
    useActiveTonNetwork,
    useCreateAccountMAM,
    useCreateAccountMnemonic,
    useMutateRenameAccount,
    useMutateRenameAccountDerivations
} from '../../state/wallet';
import { ChoseWalletVersions } from '../../components/create/ChoseWalletVersions';
import {
    AccountMAM,
    AccountTonMnemonic,
    getAccountByWalletById
} from '@tonkeeper/core/dist/entries/account';
import {
    createStandardTonAccountByMnemonic,
    getStandardTonWalletVersions
} from '@tonkeeper/core/dist/service/walletService';
import { useAppContext } from '../../hooks/appContext';
import { WalletId, WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { AccountIsAlreadyAdded } from '../../components/create/AccountIsAlreadyAdded';
import { useConfirmDiscardNotification } from '../../components/modals/ConfirmDiscardNotificationControlled';
import { AddWalletContext } from '../../components/create/AddWalletContext';
import {
    OnCloseInterceptor,
    useSetNotificationOnBack,
    useSetNotificationOnCloseInterceptor
} from '../../components/Notification';
import { TonKeychainRoot } from '@ton-keychain/core';
import {
    mnemonicToKeypair,
    validateMnemonicStandardOrBip39Ton
} from '@tonkeeper/core/dist/service/mnemonicService';
import { useMutation } from '@tanstack/react-query';
import { useUserFiat } from '../../state/fiat';

const useProcessMnemonic = () => {
    const { mutateAsync: createAccountMam } = useCreateAccountMAM();

    const context = useAppContext();
    const network = useActiveTonNetwork();
    const fiat = useUserFiat();
    const sdk = useAppSdk();
    const accounts = useAccountsState();

    return useMutation<
        | { type: 'exisiting'; account: Account; walletId: WalletId }
        | { type: 'created'; account: AccountMAM }
        | undefined,
        Error,
        string[]
    >(async mnemonic => {
        let isLegacyMAM = false;

        const mightBeLegacyMAM = await TonKeychainRoot.isValidMnemonicLegacy(mnemonic);
        const isValidForUsualWallet = await validateMnemonicStandardOrBip39Ton(mnemonic);
        if (mightBeLegacyMAM && isValidForUsualWallet) {
            const keyPair = await mnemonicToKeypair(mnemonic);
            const publicKey = keyPair.publicKey.toString('hex');
            const versions = await getStandardTonWalletVersions({
                publicKey,
                network,
                api: context.api,
                fiat
            });

            const walletWasInitialised = versions.some(v => v.tonBalance > 0 || v.hasJettons);
            isLegacyMAM = !walletWasInitialised;
        }

        const isMam = await TonKeychainRoot.isValidMnemonic(mnemonic);
        if (isMam || isLegacyMAM) {
            const newAccountMam = await createAccountMam({ mnemonic, selectAccount: true });
            const existingAcc = accounts.find(a => a.id === newAccountMam.id);
            if (existingAcc) {
                return {
                    type: 'exisiting',
                    account: existingAcc,
                    walletId: existingAcc.activeTonWallet.id
                } as const;
            }
            return {
                type: 'created',
                account: newAccountMam
            } as const;
        }

        const _account = await createStandardTonAccountByMnemonic(context, sdk.storage, mnemonic, {
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
                return { type: 'exisiting', account: existingAcc, walletId: w.id };
                break;
            }
        }
    });
};

export const ImportExistingWallet: FC<{ afterCompleted: () => void }> = ({ afterCompleted }) => {
    const sdk = useAppSdk();

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
    const { mutateAsync: renameAccount, isLoading: renameAccountLoading } =
        useMutateRenameAccount<AccountTonMnemonic>();
    const { mutateAsync: renameDerivations, isLoading: renameDerivationsLoading } =
        useMutateRenameAccountDerivations();

    const { mutateAsync: createWalletsAsync, isLoading: isCreatingWallets } =
        useCreateAccountMnemonic();

    const { mutateAsync: processMnemonic, isLoading: isProcessMnemonic } = useProcessMnemonic();

    const onMnemonic = async (m: string[]) => {
        const result = await processMnemonic(m);
        if (result?.type === 'exisiting') {
            setExistingAccountAndWallet(result);
        }

        if (result?.type === 'created') {
            setCreatedAccount(result.account);
        }

        setMnemonic(m);
    };

    const onRename = async (form: { name: string; emoji: string }) => {
        let newAcc: AccountTonMnemonic | AccountMAM = await renameAccount({
            id: createdAccount!.id,
            ...form
        });

        if (createdAccount!.type === 'mam') {
            const derivationIndexes = (createdAccount as AccountMAM).allAvailableDerivations.map(
                d => d.index
            );
            newAcc = await renameDerivations({
                id: createdAccount!.id,
                derivationIndexes,
                emoji: form.emoji
            });
        }

        setEditNamePagePassed(true);
        setCreatedAccount(newAcc);
    };

    const [isMnemonicFormDirty, setIsMnemonicFormDirty] = useState(false);

    const { onOpen: openConfirmDiscard } = useConfirmDiscardNotification();
    const { navigateHome } = useContext(AddWalletContext);
    const onBack = useMemo(() => {
        if (!mnemonic) {
            if (!isMnemonicFormDirty) {
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

        if (existingAccountAndWallet) {
            return () => {
                setExistingAccountAndWallet(undefined);
                setMnemonic(undefined);
            };
        }

        if (!createdAccount) {
            return () => {
                setCreatedAccount(undefined);
                setMnemonic(undefined);
            };
        }

        return undefined;
    }, [
        mnemonic,
        openConfirmDiscard,
        navigateHome,
        existingAccountAndWallet,
        isMnemonicFormDirty,
        createdAccount
    ]);
    useSetNotificationOnBack(onBack);

    const onCloseInterceptor = useMemo<OnCloseInterceptor>(() => {
        if (!isMnemonicFormDirty) {
            return undefined;
        }

        if (createdAccount || existingAccountAndWallet) {
            return undefined;
        }

        return closeModal => {
            openConfirmDiscard({
                onClose: discard => {
                    if (discard) {
                        closeModal();
                    }
                }
            });
        };
    }, [isMnemonicFormDirty, openConfirmDiscard, createdAccount, existingAccountAndWallet]);
    useSetNotificationOnCloseInterceptor(onCloseInterceptor);

    if (!mnemonic) {
        return (
            <ImportWords
                onMnemonic={onMnemonic}
                isLoading={isProcessMnemonic}
                onIsDirtyChange={setIsMnemonicFormDirty}
            />
        );
    }

    if (existingAccountAndWallet) {
        return (
            <AccountIsAlreadyAdded {...existingAccountAndWallet} onOpenAccount={afterCompleted} />
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
                isLoading={isCreatingWallets}
            />
        );
    }

    if (!editNamePagePassed) {
        return (
            <UpdateWalletName
                name={createdAccount.name}
                submitHandler={onRename}
                walletEmoji={createdAccount.emoji}
                isLoading={renameAccountLoading || renameDerivationsLoading}
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

    return <FinalView afterCompleted={afterCompleted} />;
};
