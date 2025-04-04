import styled from 'styled-components';
import { Skeleton } from '../../shared/Skeleton';
import { Body2, Body3, Label2 } from '../../Text';
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
import { useInternetConnection } from '../../../hooks/useInternetConnection';

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

const Label2Orange = styled(Label2)`
    color: ${p => p.theme.accentOrange};
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
    const { isConnected } = useInternetConnection();

    let content;

    if (isTronEnabled && isConnected) {
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
            <ClickWrapper onClick={() => isConnected && sdk.copyToClipboard(userFriendlyAddress)}>
                <BalanceText>{formatFiatCurrency(fiat, balance || 0)}</BalanceText>{' '}
                {isConnected ? (
                    <AddressAndBadgesWrapper>
                        <AddressText>{toShortValue(userFriendlyAddress)}</AddressText>
                        <AccountAndWalletBadgesGroup
                            account={activeAccount}
                            walletId={activeAccount.activeTonWallet.id}
                            size="s"
                        />
                    </AddressAndBadgesWrapper>
                ) : (
                    <Label2Orange>{t('web_no_connection')}</Label2Orange>
                )}
            </ClickWrapper>
        );
    }

    return (
        <Wrapper className={className}>
            {isLoading ? <Skeleton width="100px" height="36px" margin="18px 0" /> : content}
        </Wrapper>
    );
};
