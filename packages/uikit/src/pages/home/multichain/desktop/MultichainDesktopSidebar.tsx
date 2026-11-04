import { FC, ReactNode, Ref, useEffect, useMemo, useRef, useState } from 'react';
import BigNumber from 'bignumber.js';

import { Account, AccountMultichain } from '@tonkeeper/core/dist/entries/account';
import { getDecimalSeparator } from '@tonkeeper/core/dist/utils/formatting';

import { useAppContext } from '../../../../hooks/appContext';
import { useTranslation } from '../../../../hooks/translation';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { cn } from '../../../../libs/css';
import { useActiveAccount, useMutateActiveAccount } from '../../../../state/wallet';
import { AccountsFolder, useSideBarItems } from '../../../../state/folders';
import { AppRoute } from '../../../../libs/routes';
import { useSkeletonMask } from '../../../../primitives';
import { MultichainReceiveSheet } from '../../../../components/receive/MultichainReceiveSheet';
import { BatteryBalanceButton } from '../battery/BatteryBalanceButton';
import IcChartBar28 from '../../../../icons/components/IcChartBar28';
import IcEllipsis28 from '../../../../icons/components/IcEllipsis28';
import { AccountAddressLabel, AccountKindTag } from '../wallets/accountDisplay';
import { useAccountFiatTotalDisplay } from '../wallets/useAccountFiatTotal';
import { DashboardModal } from '../dashboard/DashboardModal';
import { ManageWalletsModal } from '../wallets/ManageWalletsModal';
import { WalletAvatar } from '../wallets/WalletAvatar';

/** The formatted total with the fractional part split out for smaller rendering. */
const splitDecimals = (label: string): [string, string | undefined] => {
    const separatorIndex = label.lastIndexOf(getDecimalSeparator());
    if (separatorIndex === -1) {
        return [label, undefined];
    }
    return [label.slice(0, separatorIndex), label.slice(separatorIndex)];
};

const MenuItem: FC<{ icon: ReactNode; label: string; onClick: () => void }> = ({
    icon,
    label,
    onClick
}) => (
    <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 py-2.5 pl-[18px] pr-4 text-left transition-colors hover:bg-backgroundContentTint"
    >
        <span className="flex size-7 shrink-0 items-center justify-center text-textSecondary [&>svg]:size-7">
            {icon}
        </span>
        <span className="truncate text-label2 text-textPrimary">{label}</span>
    </button>
);

const OTHER_TAB_ID = 'other';

const WalletRow: FC<{
    account: Account;
    isActive: boolean;
    divider: boolean;
    activeRowRef?: Ref<HTMLButtonElement>;
}> = ({ account, isActive, divider, activeRowRef }) => {
    const navigate = useNavigate();
    const { mutateAsync: setActiveAccount } = useMutateActiveAccount();
    const { label: total, isLoading: isTotalLoading } = useAccountFiatTotalDisplay(account);
    const balanceSkeleton = useSkeletonMask(isTotalLoading);

    const onClick = async () => {
        if (!isActive) {
            await setActiveAccount(account.id);
        }
        navigate(AppRoute.home);
    };

    return (
        <div>
            {divider && <div className="ml-4 h-[0.5px] bg-separatorCommon" />}
            <button
                ref={activeRowRef}
                type="button"
                onClick={onClick}
                className="flex w-full items-center text-left transition-colors hover:bg-backgroundContentTint"
            >
                <div className="shrink-0 py-3.5 pl-4">
                    <WalletAvatar accountId={account.id} emoji={account.emoji} size={32} />
                </div>
                <div className="min-w-0 flex-1 py-2 pl-3 pr-2">
                    <div className="flex items-center gap-1.5">
                        <span className="truncate text-label1 text-textPrimary">
                            {account.name}
                        </span>
                        <AccountKindTag type={account.type} />
                    </div>
                    <div
                        {...balanceSkeleton({ w: 48, h: 8 })}
                        className="truncate text-body2 text-textSecondary [--tk-skeleton-fill:var(--tk-background-content-tint)]"
                    >
                        {total}
                    </div>
                </div>
                {isActive && (
                    <span className="h-9 w-[3px] shrink-0 self-center rounded-l-[2px] bg-textAccent" />
                )}
            </button>
        </div>
    );
};

/**
 * Folder tabs plus the selected folder's wallets. Loose wallets group
 * under an implicit "Other" tab; with no folders at all the tab bar is
 * dropped and the plain ordered list renders. Rows switch the active
 * account in place — the sidebar is the desktop account switcher.
 */
const WalletList: FC = () => {
    const { t } = useTranslation();
    const activeAccount = useActiveAccount();
    const items = useSideBarItems();

    const { folders, looseAccounts } = useMemo(() => {
        return {
            folders: items.filter(i => i.type === 'folder') as AccountsFolder[],
            looseAccounts: items.filter(
                i => i.type !== 'folder' && i.type !== 'ton-multisig'
            ) as Account[]
        };
    }, [items]);

    const tabs = useMemo(() => {
        const folderTabs = folders.map(f => ({ id: f.id, name: f.name }));
        if (looseAccounts.length > 0 && folderTabs.length > 0) {
            folderTabs.push({ id: OTHER_TAB_ID, name: t('accounts_folder_other') });
        }
        return folderTabs;
    }, [folders, looseAccounts, t]);

    const activeAccountTab =
        folders.find(f => f.accounts.some(a => a.id === activeAccount.id))?.id ?? OTHER_TAB_ID;
    const [selectedTab, setSelectedTab] = useState(activeAccountTab);
    useEffect(() => {
        setSelectedTab(activeAccountTab);
    }, [activeAccount.id, activeAccountTab]);
    const effectiveTab = tabs.some(tab => tab.id === selectedTab)
        ? selectedTab
        : tabs[0]?.id ?? OTHER_TAB_ID;

    const selectedTabRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        selectedTabRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }, [effectiveTab]);

    const shownAccounts =
        effectiveTab === OTHER_TAB_ID
            ? looseAccounts
            : folders
                  .find(f => f.id === effectiveTab)
                  ?.accounts.filter(a => a.type !== 'ton-multisig') ?? [];

    const activeRowRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        activeRowRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }, [activeAccount.id, effectiveTab]);

    return (
        <div className="flex min-h-0 flex-col">
            {tabs.length > 0 && (
                <div className="flex shrink-0 gap-0 overflow-x-auto p-3 scroll-px-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden after:block after:w-3 after:shrink-0 after:content-['']">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            ref={tab.id === effectiveTab ? selectedTabRef : undefined}
                            type="button"
                            onClick={() => setSelectedTab(tab.id)}
                            className={cn(
                                'shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-label2 transition-colors',
                                tab.id === effectiveTab
                                    ? 'bg-backgroundContentTint text-textPrimary'
                                    : 'text-textSecondary hover:text-textPrimary'
                            )}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>
            )}
            <div
                className={cn(
                    'min-h-0 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                    tabs.length === 0 && 'pt-2'
                )}
            >
                {shownAccounts.map((account, i) => (
                    <WalletRow
                        key={account.id}
                        account={account}
                        isActive={account.id === activeAccount.id}
                        divider={i > 0}
                        activeRowRef={account.id === activeAccount.id ? activeRowRef : undefined}
                    />
                ))}
            </div>
        </div>
    );
};

/**
 * Sidebar — balance card on top, then a card with the folder tabs, the
 * wallet list and the bottom menu. The balance card is the desktop way to
 * the receiving addresses: its total and TON address open the same
 * per-network sheet as Add Funds → Receive. The battery stays a control
 * of its own beside them.
 */
export const MultichainDesktopSidebar: FC<{
    account: AccountMultichain;
    totalFiat: BigNumber | undefined;
}> = ({ account, totalFiat }) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const [manageOpen, setManageOpen] = useState(false);
    const [dashboardOpen, setDashboardOpen] = useState(false);
    const [receiveOpen, setReceiveOpen] = useState(false);

    const totalLabel = totalFiat ? formatFiatCurrency(fiat, totalFiat) : '—';
    const [totalMain, totalDecimals] = splitDecimals(totalLabel);

    return (
        <aside className="flex h-full w-[280px] shrink-0 flex-col gap-2">
            <div className="flex items-center rounded-medium bg-backgroundContent">
                <button
                    type="button"
                    onClick={() => setReceiveOpen(true)}
                    className="group flex min-w-0 flex-1 flex-col items-start gap-0.5 p-4 text-left"
                >
                    <div className="w-full truncate text-num3 text-textPrimary">
                        {totalMain}
                        {totalDecimals && (
                            <span className="text-[20px] leading-[28px]">{totalDecimals}</span>
                        )}
                    </div>
                    <AccountAddressLabel
                        account={account}
                        className="transition-colors duration-100 group-hover:text-textPrimary"
                    />
                </button>
                <BatteryBalanceButton className="mr-4 h-9" />
            </div>

            <div className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden rounded-medium bg-backgroundContent">
                <WalletList />

                <div className="pb-1">
                    <MenuItem
                        icon={<IcChartBar28 />}
                        label={t('aside_dashboard')}
                        onClick={() => setDashboardOpen(true)}
                    />
                    <MenuItem
                        icon={<IcEllipsis28 />}
                        label={t('Manage_wallets')}
                        onClick={() => setManageOpen(true)}
                    />
                </div>
            </div>
            <MultichainReceiveSheet isOpen={receiveOpen} onClose={() => setReceiveOpen(false)} />
            <DashboardModal isOpen={dashboardOpen} onClose={() => setDashboardOpen(false)} />
            <ManageWalletsModal isOpen={manageOpen} onClose={() => setManageOpen(false)} />
        </aside>
    );
};
