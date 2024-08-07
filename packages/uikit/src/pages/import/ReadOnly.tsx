import { Account } from '@tonkeeper/core/dist/entries/account';
import { useState } from 'react';
import { AddressInput } from '../../components/create/AddressInput';
import { UpdateWalletName } from '../../components/create/WalletName';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { useCreateAccountReadOnly, useMutateRenameAccount } from '../../state/wallet';
import { FinalView } from './Password';

const ReadOnly = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { defaultWalletVersion } = useAppContext();
    const { mutateAsync: createWalletsAsync, isLoading: isCreateWalletLoading } =
        useCreateAccountReadOnly();
    const { mutateAsync: renameWallet, isLoading: renameLoading } = useMutateRenameAccount();

    const [address, setAddress] = useState<string | undefined>();
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
