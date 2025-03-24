import styled from 'styled-components';
import { Skeleton } from '../../shared/Skeleton';
import { Body2, Body3 } from '../../Text';
import { formatFiatCurrency } from '../../../hooks/balance';
import { useWalletTotalBalance } from '../../../state/asset';
import { useUserFiat } from '../../../state/fiat';
import React, { FC } from 'react';
import { AccountAndWalletBadgesGroup } from '../../account/AccountBadge';
import { useActiveAccount } from '../../../state/wallet';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';

const Wrapper = styled.div`
    padding: 20px 24px 16px;
    display: flex;
    align-items: center;
    flex-direction: column;

    ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

const BalanceText = styled.div`
    font-size: 44px;
    font-weight: 500;
`;

const AddressAndBadgesWrapper = styled.div`
    display: flex;
    gap: 6px;
    align-items: center;
`;

const AddressText = styled(Body2)`
    font-family: ${p => p.theme.fontMono};
    color: ${p => p.theme.textSecondary};
`;

export const MobileProHomeBalance: FC<{ className?: string }> = ({ className }) => {
    const { data: balance, isLoading } = useWalletTotalBalance();
    const fiat = useUserFiat();
    const activeAccount = useActiveAccount();

    return (
        <Wrapper className={className}>
            {isLoading ? (
                <Skeleton width="100px" height="36px" />
            ) : (
                <BalanceText>{formatFiatCurrency(fiat, balance || 0)}</BalanceText>
            )}
            <AddressAndBadgesWrapper>
                <AddressText>
                    {toShortValue(formatAddress(activeAccount.activeTonWallet.rawAddress))}
                </AddressText>
                <AccountAndWalletBadgesGroup
                    account={activeAccount}
                    walletId={activeAccount.activeTonWallet.id}
                />
            </AddressAndBadgesWrapper>
        </Wrapper>
    );
};
