import { Account } from '@tonkeeper/core/dist/entries/account';
import React, { FC, useContext, useMemo, useState } from 'react';
import { AddressInput } from '../../components/create/AddressInput';
import { CustomizeWallet } from '../../components/create/CustomizeWallet';
import {
    useAccountsState,
    useCreateAccountReadOnly,
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
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { Address } from '@ton/core';
import { useImportFlowAnalytics } from '../../hooks/analytics/wallet-flow';

export const CreateWatchOnlyWallet: FC<{ afterCompleted: () => void }> = ({ afterCompleted }) => {
    const { mutateAsync: createWalletsAsync, isLoading: isCreateWalletLoading } =
        useCreateAccountReadOnly();
    const { mutateAsync: renameWallet, isLoading: renameLoading } = useMutateRenameAccount();
    const resolveWalletColor = useWalletColorResolver();
    const { setWalletColor } = useMutateWalletColor();

    const [createdAccount, setCreatedAccount] = useState<Account | undefined>(undefined);

    const importAnalytics = useImportFlowAnalytics('watchonly');

    const [editNamePagePassed, setEditNamePagePassed] = useState(false);

    const [isDirty, setIsDirty] = useState(false);

    const { onOpen: openConfirmDiscard } = useConfirmDiscardNotification();
    const { navigateHome } = useContext(AddWalletContext);
    const onBack = useMemo(() => {
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
    }, [navigateHome, createdAccount, isDirty, openConfirmDiscard]);
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
    const accounts = useAccountsState().flatMap(a => ({ account: a, wallets: a.allTonWallets }));

    const onAddressSubmit = (address: string) => {
        address = Address.parse(address).toRawString();
        const existingWallet = accounts.find(a => a.wallets.some(w => w.rawAddress === address));
        if (existingWallet) {
            setExistingAccountAndWallet({
                account: existingWallet.account,
                walletId: existingWallet.wallets.find(w => w.rawAddress === address)!.id
            });
            return;
        }
        createWalletsAsync({ address }).then(account => {
            setCreatedAccount(account);
            importAnalytics.success();
        }, importAnalytics.error);
    };

    if (existingAccountAndWallet) {
        return (
            <AccountIsAlreadyAdded {...existingAccountAndWallet} onOpenAccount={afterCompleted} />
        );
    }

    if (!createdAccount) {
        return (
            <AddressInput
                afterInput={onAddressSubmit}
                isLoading={isCreateWalletLoading}
                onIsDirtyChange={setIsDirty}
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
                    setCreatedAccount(newAcc);
                }}
                walletEmoji={createdAccount.emoji}
                walletColorId={resolveWalletColor(createdAccount.id).id}
                isLoading={renameLoading}
            />
        );
    }

    return <FinalView afterCompleted={afterCompleted} />;
};
