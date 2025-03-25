import { FC } from 'react';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { AccountAndWalletInfo } from '../../account/AccountAndWalletInfo';
import styled from 'styled-components';
import { useMutateActiveTonWallet } from '../../../state/wallet';
import { AppRoute } from '../../../libs/routes';
import { useNavigate } from "../../../hooks/router/useNavigate";

const AccountAndWalletInfoStyled = styled(AccountAndWalletInfo)`
    cursor: pointer;
`;

export const AccountNameCell: FC<{ account: Account; walletId: WalletId }> = ({
    account,
    walletId
}) => {
    const { mutateAsync: setActiveWallet } = useMutateActiveTonWallet();
    const navigate = useNavigate();

    const onClick = () => setActiveWallet(walletId).then(() => navigate(AppRoute.home));

    return (
        <AccountAndWalletInfoStyled
            onClick={onClick}
            account={account}
            walletId={walletId}
            hideAddress
            noPrefix
        />
    );
};
