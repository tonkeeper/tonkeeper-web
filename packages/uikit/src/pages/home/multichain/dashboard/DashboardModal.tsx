import { FC, useMemo } from 'react';
import BigNumber from 'bignumber.js';

import { Account } from '@tonkeeper/core/dist/entries/account';
import { arrayToCsvString } from '@tonkeeper/core/dist/service/parserService';

import { SkeletonScope, useSkeletonMask } from '../../../../primitives';
import { Modal } from '../../../../primitives/Modal';
import { useAppContext } from '../../../../hooks/appContext';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { useTranslation } from '../../../../hooks/translation';
import { cn } from '../../../../libs/css';
import { useAccountsOrdered } from '../../../../state/folders';
import { ModalCenterError } from '../../../../components/shared/ModalCenterState';
import IcArrowUp28 from '../../../../icons/components/IcArrowUp28';
import IcExclamationmarkCircle28 from '../../../../icons/components/IcExclamationmarkCircle28';
import { AccountKindTag } from '../wallets/accountDisplay';
import { useDashboardFiatTotals } from '../wallets/useAccountFiatTotal';
import { WalletAvatar } from '../wallets/WalletAvatar';

const StatTile: FC<{ label: string; value: string }> = ({ label, value }) => {
    const mask = useSkeletonMask();
    return (
        <div className="min-w-0 flex-1 rounded-medium bg-backgroundContent p-4">
            <div className="truncate text-body2 text-textSecondary">{label}</div>
            <div
                {...mask({ w: 88, h: 16, r: 8 })}
                className="truncate text-label1 text-textPrimary"
            >
                {value}
            </div>
        </div>
    );
};

const WalletCard: FC<{ account: Account; total: BigNumber | null | undefined }> = ({
    account,
    total
}) => {
    const { fiat } = useAppContext();
    const mask = useSkeletonMask();

    return (
        <div className="flex items-center rounded-medium bg-backgroundContent">
            <div className="shrink-0 py-4 pl-4">
                <WalletAvatar accountId={account.id} emoji={account.emoji} />
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-between gap-4 py-4 pl-3 pr-4">
                <div className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-label1 text-textPrimary">{account.name}</span>
                    <AccountKindTag type={account.type} />
                </div>
                <span
                    {...mask({ w: 72, h: 16, r: 8 })}
                    className="shrink-0 whitespace-nowrap text-label1 text-textPrimary"
                >
                    {total ? formatFiatCurrency(fiat, total) : '—'}
                </span>
            </div>
        </div>
    );
};

/**
 * "Dashboard" + the Export .CSV link. Lives inside the Modal top bar so its
 * data queries only run while the modal is mounted.
 */
const DashboardTitle: FC = () => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const accounts = useAccountsOrdered();
    const { totals, isLoading } = useDashboardFiatTotals(accounts);

    const csvHref = useMemo(() => {
        if (isLoading) {
            return undefined;
        }
        const header = [t('dashboard_column_name'), t('total_balance')];
        const rows = accounts.map((account, index) => [
            `${account.name} ${account.emoji}`,
            totals[index] ? `${totals[index]!.toString()} ${fiat}` : ''
        ]);
        return encodeURI('data:text/csv;charset=utf-8,' + arrayToCsvString([header, ...rows]));
    }, [accounts, totals, isLoading, fiat, t]);

    return (
        <span className="flex min-w-0 flex-col items-center whitespace-normal">
            <span className="truncate text-h3 text-textPrimary">{t('aside_dashboard')}</span>
            <a
                href={csvHref}
                download="tonkeeper-wallets.csv"
                aria-disabled={!csvHref}
                className={cn(
                    'flex items-center gap-1 text-body2 text-textAccent no-underline',
                    !csvHref && 'pointer-events-none opacity-50'
                )}
            >
                {t('export_dot_csv')}
                <IcArrowUp28 className="size-3" />
            </a>
        </span>
    );
};

const DashboardContent: FC = () => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const accounts = useAccountsOrdered();
    const { totals, sum, isLoading, isError, refetch } = useDashboardFiatTotals(accounts);

    if (isError) {
        return (
            <div className="pt-16">
                <ModalCenterError icon={<IcExclamationmarkCircle28 />} onRetry={refetch} />
            </div>
        );
    }

    return (
        <SkeletonScope loading={isLoading}>
            <div className="flex gap-2 pb-4">
                <StatTile
                    label={t('total_balance')}
                    value={isLoading ? '0' : formatFiatCurrency(fiat, sum)}
                />
                <StatTile label={t('dashboard_total_wallets')} value={String(accounts.length)} />
            </div>
            <div className="flex flex-col gap-2 pb-4">
                {accounts.map((account, index) => (
                    <WalletCard key={account.id} account={account} total={totals[index]} />
                ))}
            </div>
        </SkeletonScope>
    );
};

/**
 * The multichain Dashboard sheet: one card per wallet in switcher order with
 * the same whole-wallet fiat total the sidebar shows under its name, plus the
 * sum across all of them. Multichain wallets count every chain; TON wallets
 * their active TON address. Accounts of one seed that differ only in TON
 * version each show their full value, but the sum counts the balances they
 * share once — so the cards need not add up to the total.
 *
 * All data hooks live in children of the `Modal` (which renders nothing while
 * closed), so this component staying permanently mounted in the sidebar costs
 * no queries until the modal opens.
 */
export const DashboardModal: FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => (
    <Modal isOpen={isOpen} onClose={onClose} variant="content" topBarTitle={<DashboardTitle />}>
        <DashboardContent />
    </Modal>
);
