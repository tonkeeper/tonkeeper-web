import { FC, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { cn } from '../../../libs/css';
import { useNavigate } from '../../../hooks/router/useNavigate';
import { useTranslation } from '../../../hooks/translation';
import { useTradeAnalytics } from '../../../hooks/analytics/trade';
import { MultichainRoute } from '../../../libs/routes';
import { useBrowserSectionLabel } from './browser/browser-utils';
import IcWallet28 from '../../../icons/components/IcWallet28';
import IcTrade28 from '../../../icons/components/IcTrade28';
import IcExplore28 from '../../../icons/components/IcExplore28';

const Tab: FC<{
    icon: ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
}> = ({ icon, label, active = false, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        aria-disabled={onClick ? undefined : true}
        className={cn(
            'flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2 transition-colors',
            active ? 'text-tabBarActiveIcon' : 'text-tabBarInactiveIcon',
            !onClick && 'cursor-default'
        )}
    >
        <span className="flex size-7 items-center justify-center [&>svg]:size-7">{icon}</span>
        <span className="w-full text-center text-label3">{label}</span>
    </button>
);

/**
 * Mobile bottom nav for the multichain shell: Wallet / Trade / Browser over a
 * blurred translucent background. Pages that mount this bar reserve matching
 * bottom padding so scrolled content doesn't hide behind it — more when they
 * pass `topContent` (the Browser tab docks its search field there, inside the
 * same blur block per the mockup).
 */
export const MultichainMobileTabBar: FC<{ topContent?: ReactNode }> = ({ topContent }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const tradeAnalytics = useTradeAnalytics();
    const { pathname } = useLocation();
    const onTrade = pathname.startsWith(MultichainRoute.trade);
    const onBrowser = pathname.startsWith(MultichainRoute.browser);
    const browserTabLabel = useBrowserSectionLabel();

    return (
        <nav className="fixed inset-x-0 bottom-0 z-20 bg-backgroundTransparent pb-[env(safe-area-inset-bottom)] backdrop-blur-[48px]">
            {topContent && <div className="px-4 pt-3">{topContent}</div>}
            <div className="flex items-start px-4">
                <Tab
                    icon={<IcWallet28 />}
                    label={t('wallet')}
                    active={!onTrade && !onBrowser}
                    onClick={() => navigate(MultichainRoute.home)}
                />
                <Tab
                    icon={<IcTrade28 />}
                    label={t('multichain_tab_trade')}
                    active={onTrade}
                    onClick={() => {
                        tradeAnalytics.started('tab_bar');
                        navigate(MultichainRoute.trade);
                    }}
                />
                <Tab
                    icon={<IcExplore28 />}
                    label={browserTabLabel}
                    active={onBrowser}
                    onClick={() => navigate(MultichainRoute.browser)}
                />
            </div>
        </nav>
    );
};
