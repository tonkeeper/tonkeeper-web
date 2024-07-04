import { FC, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle, css } from 'styled-components';
import { useAppContext } from '../hooks/appContext';
import { useTranslation } from '../hooks/translation';
import { scrollToTop } from '../libs/common';
import { AppRoute } from '../libs/routes';
import { ActivityIcon, BrowserIcon, SettingsIcon, WalletIcon } from './NavigationIcons';
import { Label3 } from './Text';

const Button = styled.div<{ active: boolean }>`
    user-select: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    gap: 0.25rem;
    width: 20%;

    color: ${props => props.theme.tabBarInactiveIcon};

    ${props =>
        props.active &&
        css`
            color: ${p => p.theme.tabBarActiveIcon};
        `}
`;

const Block = styled.div<{ standalone?: boolean; sticky?: boolean }>`
    flex-shrink: 0;
    display: flex;
    justify-content: space-around;
    bottom: 0;
    padding: 1rem;
    width: var(--app-width);
    max-width: 548px;
    box-sizing: border-box;
    overflow: visible !important;
    z-index: 3;

    background-color: ${props => props.theme.backgroundPage};

    ${props =>
        props.sticky
            ? css`
                  position: sticky;
              `
            : css`
                  position: fixed;
              `}

    ${props =>
        props.standalone &&
        css`
            padding-bottom: 2rem;
        `}
`;

export const FooterGlobalStyle = createGlobalStyle`
  body:not(.bottom) ${Block} {
    &:after {
      content: '';
      display: block;
      width: 100%;
      height: 1px;
      background: ${props => props.theme.separatorCommon};
      position: absolute;
      bottom: 100%;
    }
  }
`;

export const Footer: FC<{ standalone?: boolean; sticky?: boolean }> = ({ standalone, sticky }) => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const { hideBrowser } = useAppContext();

    const active = useMemo<AppRoute>(() => {
        if (location.pathname.includes(AppRoute.activity)) {
            return AppRoute.activity;
        }
        if (location.pathname.includes(AppRoute.settings)) {
            return AppRoute.settings;
        }
        if (location.pathname.includes(AppRoute.browser)) {
            return AppRoute.browser;
        }
        return AppRoute.home;
    }, [location.pathname]);

    const handleClick = useCallback(
        (route: AppRoute) => {
            if (location.pathname !== route) {
                return navigate(route);
            } else {
                scrollToTop();
            }
        },
        [location.pathname]
    );

    return (
        <Block standalone={standalone} sticky={sticky}>
            <Button active={active === AppRoute.home} onClick={() => handleClick(AppRoute.home)}>
                <WalletIcon />
                <Label3>{t('wallet_title')}</Label3>
            </Button>
            <Button
                active={active === AppRoute.activity}
                onClick={() => handleClick(AppRoute.activity)}
            >
                <ActivityIcon />
                <Label3>{t('activity_screen_title')}</Label3>
            </Button>
            {hideBrowser === true ? null : (
                <Button
                    active={active === AppRoute.browser}
                    onClick={() => handleClick(AppRoute.browser)}
                >
                    <BrowserIcon />
                    <Label3>{t('browser_title')}</Label3>
                </Button>
            )}
            <Button
                active={active === AppRoute.settings}
                onClick={() => handleClick(AppRoute.settings)}
            >
                <SettingsIcon />
                <Label3>{t('settings_title')}</Label3>
            </Button>
        </Block>
    );
};
