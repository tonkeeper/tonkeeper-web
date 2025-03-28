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
import { useIsTronEnabledForActiveWallet } from '../../../state/tron/tron';
import { AddressMultiChain } from '../../home/Balance';
import { ChevronDownIcon } from '../../Icon';
import { useTranslation } from '../../../hooks/translation';
import { useAppSdk } from '../../../hooks/appSdk';

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
    width: fit-content;
    margin: 0 auto;
`;

const AddressAndBadgesWrapper = styled.div`
    display: flex;
    gap: 6px;
    align-items: center;
    width: fit-content;
    margin: 0 auto;
`;

const AddressText = styled(Body2)`
    font-family: ${p => p.theme.fontMono};
    color: ${p => p.theme.textSecondary};
`;

const Body2Secondary = styled(Body2)`
    color: ${p => p.theme.textSecondary};
`;

const ChevronDownIconSecondary = styled(ChevronDownIcon)`
    color: ${p => p.theme.iconSecondary};
`;

const ClickWrapper = styled.div`
    display: contents;
`;

export const MobileProHomeBalance: FC<{ className?: string }> = ({ className }) => {
    const { data: balance, isLoading } = useWalletTotalBalance();
    const fiat = useUserFiat();
    const activeAccount = useActiveAccount();
    const isTronEnabled = useIsTronEnabledForActiveWallet();
    const { t } = useTranslation();
    const sdk = useAppSdk();

    let content;

    if (isTronEnabled) {
        content = (
            <AddressMultiChain top="80px">
                <BalanceText>{formatFiatCurrency(fiat, balance || 0)}</BalanceText>
                <AddressAndBadgesWrapper>
                    <Body2Secondary>{t('multichain')}</Body2Secondary>
                    <AccountAndWalletBadgesGroup
                        account={activeAccount}
                        walletId={activeAccount.activeTonWallet.id}
                        size="s"
                    />
                    <ChevronDownIconSecondary />
                </AddressAndBadgesWrapper>
            </AddressMultiChain>
        );
    } else {
        const userFriendlyAddress = formatAddress(activeAccount.activeTonWallet.rawAddress);
        content = (
            <ClickWrapper onClick={() => sdk.copyToClipboard(userFriendlyAddress)}>
                <BalanceText>{formatFiatCurrency(fiat, balance || 0)}</BalanceText>{' '}
                <AddressAndBadgesWrapper>
                    <AddressText>{toShortValue(userFriendlyAddress)}</AddressText>
                    <AccountAndWalletBadgesGroup
                        account={activeAccount}
                        walletId={activeAccount.activeTonWallet.id}
                        size="s"
                    />
                </AddressAndBadgesWrapper>
            </ClickWrapper>
        );
    }

    return (
        <Wrapper className={className}>
            {isLoading ? <Skeleton width="100px" height="36px" margin="18px 0" /> : content}
        </Wrapper>
    );
};
