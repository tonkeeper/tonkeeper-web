import { Account } from '@tonkeeper/core/dist/entries/account';
import { FC, useContext, useMemo, useState } from 'react';
import { AddressInput } from '../../components/create/AddressInput';
import { UpdateWalletName } from '../../components/create/WalletName';
import { useCreateAccountReadOnly, useMutateRenameAccount } from '../../state/wallet';
import { FinalView } from './Password';
import { useConfirmDiscardNotification } from '../../components/modals/ConfirmDiscardNotificationControlled';
import { AddWalletContext } from '../../components/create/AddWalletContext';
import {
    OnCloseInterceptor,
    useSetNotificationOnBack,
    useSetNotificationOnCloseInterceptor
} from '../../components/Notification';

export const CreateWatchOnlyWallet: FC<{ afterCompleted: () => void }> = ({ afterCompleted }) => {
    const { mutateAsync: createWalletsAsync, isLoading: isCreateWalletLoading } =
        useCreateAccountReadOnly();
    const { mutateAsync: renameWallet, isLoading: renameLoading } = useMutateRenameAccount();

    const [createdAccount, setCreatedAccount] = useState<Account | undefined>(undefined);

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
    useSetNotificationOnBack(onBack);

    const onCloseInterceptor = useMemo<OnCloseInterceptor>(() => {
        if (!isDirty) {
            return undefined;
        }

        if (createdAccount) {
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
    }, [createdAccount, openConfirmDiscard, isDirty]);
    useSetNotificationOnCloseInterceptor(onCloseInterceptor);

    if (!createdAccount) {
        return (
            <AddressInput
                afterInput={address => createWalletsAsync({ address }).then(setCreatedAccount)}
                isLoading={isCreateWalletLoading}
                onIsDirtyChange={setIsDirty}
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
                        setCreatedAccount(newAcc);
                    });
                }}
                walletEmoji={createdAccount.emoji}
                isLoading={renameLoading}
            />
        );
    }

    return <FinalView afterCompleted={afterCompleted} />;
};
