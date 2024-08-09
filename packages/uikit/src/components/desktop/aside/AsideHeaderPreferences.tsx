import styled from 'styled-components';
import { FC } from 'react';
import { Body3, Label1 } from '../../Text';
import { useTranslation } from '../../../hooks/translation';
import { AsideHeaderContainer } from './AsideHeaderElements';

const HeaderContainer = styled(AsideHeaderContainer)`
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-left: 18px;

    & > ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

export const AsideHeaderPreferences: FC<{ width: number }> = ({ width }) => {
    const { t } = useTranslation();

    return (
        <HeaderContainer width={width}>
            <Label1>{t('aside_settings')}</Label1>
        </HeaderContainer>
    );
};
