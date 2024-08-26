import styled from 'styled-components';
import React, { FC } from 'react';
import { Label1 } from '../Text';
import { AccountAndWalletInfo } from '../account/AccountAndWalletInfo';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { Button } from '../fields/Button';
import { useMutateActiveAccountAndWallet } from '../../state/wallet';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../../libs/routes';
import { RoundedButton } from '../fields/RoundedButton';
import { ChevronLeftIcon } from '../Icon';
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

const ButtonStyled = styled(Button)`
    margin-top: 20px;
`;

const BackButtonContainer = styled.div`
    position: absolute;
    top: 16px;
    left: 16px;
`;

export const AccountIsAlreadyAdded: FC<{
    account: Account;
    walletId: string;
    onBack: () => void;
}> = ({ account, walletId, onBack }) => {
    const { mutateAsync } = useMutateActiveAccountAndWallet();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const onClick = async () => {
        await mutateAsync({ accountId: account.id, walletId });
        navigate(AppRoute.home);
    };

    return (
        <Wrapper>
            <BackButtonContainer>
                <RoundedButton onClick={onBack}>
                    <ChevronLeftIcon />
                </RoundedButton>
            </BackButtonContainer>
            <Label1>{t('account_is_already_added_label')}</Label1>
            <AccountAndWalletInfoStyled account={account} walletId={walletId} />
            <ButtonStyled primary size="large" onClick={onClick}>
                {t('account_is_already_added_action')}
            </ButtonStyled>
        </Wrapper>
    );
};
