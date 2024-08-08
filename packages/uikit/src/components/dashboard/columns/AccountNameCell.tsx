import { FC } from 'react';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { AccountAndWalletInfo } from '../../account/AccountAndWalletInfo';

export const AccountNameCell: FC<{ account: Account; walletId: WalletId }> = ({
    account,
    walletId
}) => {
    return <AccountAndWalletInfo account={account} walletId={walletId} hideAddress noPrefix />;
};
