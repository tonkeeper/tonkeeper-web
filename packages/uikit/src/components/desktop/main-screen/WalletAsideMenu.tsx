import styled from 'styled-components';
import { AsideMenuItem } from '../../shared/AsideItem';
import { Label2 } from '../../Text';
import { ClockSmoothIcon, CoinsIcon, SaleBadgeIcon, SettingsSmoothIcon } from '../../Icon';
import { NavLink } from 'react-router-dom';
import { AppRoute } from '../../../libs/routes';

const WalletAsideContainer = styled.div`
    padding: 0.5rem;
    width: 288px;
    border-right: 1px solid ${p => p.theme.backgroundContentAttention};

    > a {
        text-decoration: unset;
        color: unset;
    }
`;

const AsideMenuItemStyled = styled(AsideMenuItem)`
    background: ${p => (p.isSelected ? p.theme.backgroundContentTint : 'unset')};
`;

export const WalletAsideMenu = () => {
    return (
        <WalletAsideContainer>
            <NavLink to={AppRoute.home}>
                {({ isActive }) => (
                    <AsideMenuItemStyled isSelected={isActive}>
                        <CoinsIcon />
                        <Label2>Tokens</Label2>
                    </AsideMenuItemStyled>
                )}
            </NavLink>
            <NavLink to={AppRoute.activity}>
                {({ isActive }) => (
                    <AsideMenuItemStyled isSelected={isActive}>
                        <ClockSmoothIcon />
                        <Label2>History</Label2>
                    </AsideMenuItemStyled>
                )}
            </NavLink>
            <NavLink to={AppRoute.purchases}>
                {({ isActive }) => (
                    <AsideMenuItemStyled isSelected={isActive}>
                        <SaleBadgeIcon />
                        <Label2>Purchases</Label2>
                    </AsideMenuItemStyled>
                )}
            </NavLink>
            <NavLink to={AppRoute.settings}>
                {({ isActive }) => (
                    <AsideMenuItemStyled isSelected={isActive}>
                        <SettingsSmoothIcon />
                        <Label2>Settings</Label2>
                    </AsideMenuItemStyled>
                )}
            </NavLink>
        </WalletAsideContainer>
    );
};
