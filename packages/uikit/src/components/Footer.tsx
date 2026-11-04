import { FC, PropsWithChildren, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { useTranslation } from '../hooks/translation';
import { scrollToTop } from '../libs/common';
import { cn } from '../libs/css';
import { AppRoute } from '../libs/routes';
import { ActivityIcon, BrowserIcon, SettingsIcon, WalletIcon } from './NavigationIcons';
import { Label3 } from './Text';
import { HideOnReview } from './ios/HideOnReview';
import { useNavigate } from '../hooks/router/useNavigate';

const Button: FC<PropsWithChildren<{ active: boolean; onClick: () => void }>> = ({
    active,
    onClick,
    children
}) => (
    <div
        onClick={onClick}
        className={cn(
            'flex w-1/5 cursor-pointer select-none flex-col items-center gap-1',
            active ? 'text-tabBarActiveIcon' : 'text-tabBarInactiveIcon'
        )}
    >
        {children}
    </div>
);

const Block: FC<PropsWithChildren<{ standalone?: boolean; sticky?: boolean }>> = ({
    standalone,
    sticky,
    children
}) => (
    <div
        className={cn(
            'footer-block z-[3] bottom-0 box-border flex w-[var(--app-width)] max-w-[548px] shrink-0 justify-around p-4 bg-backgroundPage',
            '![overflow:visible]',
            sticky ? 'sticky' : 'fixed',
            standalone && 'pb-8'
        )}
    >
        {children}
    </div>
);

export const FooterGlobalStyle = createGlobalStyle`
  body:not(.bottom) .footer-block {
    &::after {
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
    const sdk = useAppSdk();
    const location = useLocation();
    const navigate = useNavigate();
    const { hideBrowser } = useAppContext();
    // The capacitor app opens dApps in-app, so its tab keeps the native
    // apps' "Browser" name; shells that hand dApps to an external browser
    // call the catalog "Discover".
    const browserTabLabel =
        sdk.targetEnv === 'mobile' || sdk.targetEnv === 'tablet'
            ? t('browser_title')
            : t('discover_title');

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
        [location.pathname, navigate]
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
            <HideOnReview>
                {hideBrowser === true ? null : (
                    <Button
                        active={active === AppRoute.browser}
                        onClick={() => handleClick(AppRoute.browser)}
                    >
                        <BrowserIcon />
                        <Label3>{browserTabLabel}</Label3>
                    </Button>
                )}
            </HideOnReview>
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
