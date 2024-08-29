import { Account } from '@tonkeeper/core/dist/entries/account';
import { useState } from 'react';
import { AddressInput } from '../../components/create/AddressInput';
import { UpdateWalletName } from '../../components/create/WalletName';
import { useCreateAccountReadOnly, useMutateRenameAccount } from '../../state/wallet';
import { FinalView } from './Password';

const ReadOnly = () => {
    const { mutateAsync: createWalletsAsync, isLoading: isCreateWalletLoading } =
        useCreateAccountReadOnly();
    const { mutateAsync: renameWallet, isLoading: renameLoading } = useMutateRenameAccount();

    const [createdAccount, setCreatedAccount] = useState<Account | undefined>(undefined);

    const [editNamePagePassed, setEditNamePagePassed] = useState(false);

    if (!createdAccount) {
        return (
            <AddressInput
                afterInput={address => createWalletsAsync({ address }).then(setCreatedAccount)}
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
                        setCreatedAccount(newAcc);
                    });
                }}
                walletEmoji={createdAccount.emoji}
                isLoading={renameLoading}
            />
        );
    }

    return <FinalView />;
};

export default ReadOnly;
