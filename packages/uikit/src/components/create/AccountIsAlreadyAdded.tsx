import styled from 'styled-components';
import React, { FC } from 'react';
import { Label1 } from '../Text';
import { AccountAndWalletInfo } from '../account/AccountAndWalletInfo';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { ButtonResponsiveSize } from '../fields/Button';
import { useMutateActiveAccountAndWallet } from '../../state/wallet';
import { useTranslation } from '../../hooks/translation';

const Wrapper = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
`;

const AccountAndWalletInfoStyled = styled(AccountAndWalletInfo)`
    margin-top: 4px;
`;

const ButtonStyled = styled(ButtonResponsiveSize)`
    margin-top: 20px;
`;

export const AccountIsAlreadyAdded: FC<{
    account: Account;
    walletId: string;
    onOpenAccount: () => void;
}> = ({ account, walletId, onOpenAccount }) => {
    const { mutateAsync } = useMutateActiveAccountAndWallet();
    const { t } = useTranslation();

    const onClick = async () => {
        await mutateAsync({ accountId: account.id, walletId });
        onOpenAccount();
    };

    return (
        <Wrapper>
            <Label1>{t('account_is_already_added_label')}</Label1>
            <AccountAndWalletInfoStyled noPrefix account={account} walletId={walletId} />
            <ButtonStyled fullWidth primary onClick={onClick}>
                {t('account_is_already_added_action')}
            </ButtonStyled>
        </Wrapper>
    );
};
