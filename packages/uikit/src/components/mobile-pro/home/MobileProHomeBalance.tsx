import styled from 'styled-components';
import { Skeleton } from '../../shared/Skeleton';
import { Body3, Num2 } from '../../Text';
import { formatFiatCurrency } from '../../../hooks/balance';
import { useWalletTotalBalance } from '../../../state/asset';
import { useTranslation } from '../../../hooks/translation';
import { useUserFiat } from '../../../state/fiat';
import { FC } from 'react';

const Wrapper = styled.div`
    padding: 6px 12px;
    display: flex;
    align-items: center;
    flex-direction: column;

    ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

export const MobileProHomeBalance: FC<{ className?: string }> = ({ className }) => {
    const { data: balance, isLoading } = useWalletTotalBalance();
    const { t } = useTranslation();
    const fiat = useUserFiat();

    return (
        <Wrapper className={className}>
            {isLoading ? (
                <Skeleton width="100px" height="36px" />
            ) : (
                <Num2>{formatFiatCurrency(fiat, balance || 0)}</Num2>
            )}
            <Body3>{t('total_balance')}</Body3>
        </Wrapper>
    );
};
