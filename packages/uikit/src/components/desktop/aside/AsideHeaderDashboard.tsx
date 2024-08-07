import styled from 'styled-components';
import { AsideHeaderContainer } from './AsideHeaderElements';
import { FC, useMemo } from 'react';
import { Body3, Label2 } from '../../Text';
import { useTranslation } from '../../../hooks/translation';
import { useAccountsState } from '../../../state/wallet';

const HeaderContainer = styled(AsideHeaderContainer)`
    display: flex;
    flex-direction: column;

    & > ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

export const AsideHeaderDashboard: FC<{ width: number }> = ({ width }) => {
    const { t } = useTranslation();
    const accounts = useAccountsState();
    const wallets = useMemo(() => accounts.flatMap(a => a.allTonWallets), [accounts]);

    return (
        <HeaderContainer width={width}>
            <Label2>
                {t('aside_header_number_wallets').replace('%{number}', wallets.length.toString())}
            </Label2>
            <Body3>{t('total')}</Body3>
        </HeaderContainer>
    );
};
