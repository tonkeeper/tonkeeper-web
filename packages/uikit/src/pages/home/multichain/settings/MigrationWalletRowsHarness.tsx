import { FC } from 'react';

import { MigrationWalletRow, MigrationWalletRowData } from './MigrationPage';
import { SkeletonScope } from '../../../../primitives/Skeleton';

const main: MigrationWalletRowData = {
    walletId: 'w-main',
    accountId: 'a-main',
    name: 'Main',
    emoji: '🐳',
    versionLabel: 'W5',
    subtitle: '$ 17,471.74 · 12 NFTs'
};

const savings: MigrationWalletRowData = {
    walletId: 'w-savings',
    accountId: 'a-savings',
    name: 'Savings',
    emoji: '🐝',
    versionLabel: 'v4R2',
    subtitle: '$ 137.16'
};

export const MigrationWalletRowsHarness: FC<{ loading?: boolean }> = ({ loading = false }) => (
    <SkeletonScope loading={loading}>
        <div className="max-w-[420px] overflow-hidden rounded-medium bg-backgroundContent [--tk-skeleton-fill:var(--tk-background-content-tint)]">
            <MigrationWalletRow wallet={main} selected divider={false} onSelect={() => {}} />
            <MigrationWalletRow wallet={savings} selected={false} divider onSelect={() => {}} />
        </div>
    </SkeletonScope>
);
