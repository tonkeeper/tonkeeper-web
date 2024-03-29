import styled from 'styled-components';
import { AsideMenuItem } from '../../shared/AsideItem';
import { Label2 } from '../../Text';
import { ClockSmoothIcon, CoinsIcon, SaleBadgeIcon } from '../../Icon';
import { NavLink, useLocation } from 'react-router-dom';
import { AppRoute } from '../../../libs/routes';
import { useTranslation } from '../../../hooks/translation';

const WalletAsideContainer = styled.div`
    padding: 0.5rem;
    width: fit-content;
    border-right: 1px solid ${p => p.theme.backgroundContentAttention};

    > a {
        text-decoration: unset;
        color: unset;
    }
`;

const AsideMenuItemStyled = styled(AsideMenuItem)`
    background: ${p => (p.isSelected ? p.theme.backgroundContentTint : 'unset')};
    padding-right: 50px;
`;

export const WalletAsideMenu = () => {
    const { t } = useTranslation();
    const location = useLocation();

    const isCoinPageOpened = location.pathname.startsWith(AppRoute.coins);

    return (
        <WalletAsideContainer>
            <NavLink to={AppRoute.home}>
                {({ isActive }) => (
                    <AsideMenuItemStyled isSelected={isActive || isCoinPageOpened}>
                        <CoinsIcon />
                        <Label2>{t('wallet_aside_tokens')}</Label2>
                    </AsideMenuItemStyled>
                )}
            </NavLink>
            <NavLink to={AppRoute.activity}>
                {({ isActive }) => (
                    <AsideMenuItemStyled isSelected={isActive}>
                        <ClockSmoothIcon />
                        <Label2>{t('wallet_aside_history')}</Label2>
                    </AsideMenuItemStyled>
                )}
            </NavLink>
            <NavLink to={AppRoute.purchases}>
                {({ isActive }) => (
                    <AsideMenuItemStyled isSelected={isActive}>
                        <SaleBadgeIcon />
                        <Label2>{t('wallet_aside_purchases')}</Label2>
                    </AsideMenuItemStyled>
                )}
            </NavLink>
            {/* <NavLink to={AppRoute.settings}>
                {({ isActive }) => (
                    <AsideMenuItemStyled isSelected={isActive}>
                        <SettingsSmoothIcon />
                        <Label2>{t('wallet_aside_settings')}</Label2>
                    </AsideMenuItemStyled>
                )}
            </NavLink>*/}
        </WalletAsideContainer>
    );
};
