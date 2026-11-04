import { FC } from 'react';
import BigNumber from 'bignumber.js';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { emptyMigrationTronPlan } from '@tonkeeper/core/dist/service/migration/migrationTronService';

import { MigrationConfirmRow } from './MigrationConfirmPage';
import { buildMigrationConfirmRows } from './migration-confirm-utils';

/**
 * CT mount wrapper: the TRON plan is built in the page because `BigNumber`
 * fields don't survive the mount bridge as props.
 */
export const MigrationConfirmRowsHarness: FC = () => {
    const tron = {
        ...emptyMigrationTronPlan('TFrom', 'TGzz8gjYiYRqpfmDwnLxfgPuLVNmpCswVp'),
        usdtAmount: new BigNumber(20_137_169_000),
        trxSweepAmount: new BigNumber(0)
    };

    const rows = buildMigrationConfirmRows({
        sendLabel: 'Send',
        nftLabel: 'NFT',
        tron,
        pricing: {
            currency: FiatCurrencies.USD,
            usdt: new BigNumber(1),
            jetton: () => undefined
        }
    });

    return (
        <div className="max-w-[420px] overflow-hidden rounded-medium bg-backgroundContent">
            {rows.map((row, index) => (
                <MigrationConfirmRow key={row.key} row={row} divider={index > 0} />
            ))}
        </div>
    );
};
