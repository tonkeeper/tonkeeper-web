import { FC, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { cn } from '../../../../libs/css';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useTranslation } from '../../../../hooks/translation';
import { useTradeAnalytics } from '../../../../hooks/analytics/trade';
import { MultichainRoute } from '../../../../libs/routes';
import { useBrowserSectionLabel } from '../browser/browser-utils';
import IcWallet28 from '../../../../icons/components/IcWallet28';
import IcTrade28 from '../../../../icons/components/IcTrade28';
import IcExplore28 from '../../../../icons/components/IcExplore28';
import IcClock28 from '../../../../icons/components/IcClock28';
import IcGear28 from '../../../../icons/components/IcGear28';

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
            active ? 'text-textAccent' : 'text-textSecondary',
            onClick && !active && 'hover:text-textPrimary',
            !onClick && 'cursor-default'
        )}
    >
        <span className="flex size-7 items-center justify-center [&>svg]:size-7">{icon}</span>
        <span className="w-full text-center text-label3">{label}</span>
    </button>
);

/**
 * Desktop section nav, pinned at the bottom of the content column
 * (`MultichainDesktopShell`). The negative top margin pulls the bar up
 * over the last half-bar-height of the scroll area, so content slides
 * behind the bar's rounded corners instead of being cut square right
 * beside them; the 16px side inset lives here.
 *
 * The card closes on the column's bottom edge — the shell's window padding
 * is the only gap below it, which is what lines the bar up with the bottom
 * of the sidebar.
 */
export const MultichainDesktopTabBar: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const tradeAnalytics = useTradeAnalytics();
    const { pathname } = useLocation();
    const onHistory = pathname.startsWith(MultichainRoute.history);
    const onTrade = pathname.startsWith(MultichainRoute.trade);
    const onBrowser = pathname.startsWith(MultichainRoute.browser);
    const onSettings = pathname.startsWith(MultichainRoute.settings);
    const browserTabLabel = useBrowserSectionLabel();

    return (
        <div className="relative z-10 -mt-9 shrink-0 px-4">
            <div className="flex h-[72px] items-stretch overflow-hidden rounded-2xl border-t-[0.5px] border-separatorCommon bg-backgroundContent px-4 py-1 shadow-[0_4px_16px_rgba(0,0,0,0.16),0_16px_64px_rgba(0,0,0,0.24)]">
                <Tab
                    icon={<IcWallet28 />}
                    label={t('wallet')}
                    active={!onHistory && !onTrade && !onBrowser && !onSettings}
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
                <Tab
                    icon={<IcClock28 />}
                    label={t('page_header_history')}
                    active={onHistory}
                    onClick={() => navigate(MultichainRoute.history)}
                />
                <Tab
                    icon={<IcGear28 />}
                    label={t('wallet_aside_settings')}
                    active={onSettings}
                    onClick={() => navigate(MultichainRoute.settings)}
                />
            </div>
        </div>
    );
};
