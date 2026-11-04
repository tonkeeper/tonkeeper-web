import { FC, useState } from 'react';
import { getBatteryLevel } from '@tonkeeper/core/dist/utils/battery';

import { cn } from '../../../../libs/css';
import { useIsOnIosReview } from '../../../../hooks/ios';
import { useTranslation } from '../../../../hooks/translation';
import { useBatteryBalance, useCanSeeBattery } from '../../../../state/battery';
import { BatteryLevelIcon } from './BatteryLevelIcon';
import { BatteryModal } from './BatteryModal';

/**
 * Battery glyph shown beside the wallet's total balance; taps open the
 * battery screen. Before the relayer has been authorised the glyph reads
 * as empty — the balance is only known once the screen has been opened.
 */
export const BatteryBalanceButton: FC<{ className?: string }> = ({ className }) => {
    const { t } = useTranslation();
    const canSeeBattery = useCanSeeBattery();
    const isOnIosReview = useIsOnIosReview();
    const { data: balance } = useBatteryBalance();
    const [open, setOpen] = useState(false);

    if (!canSeeBattery || isOnIosReview) {
        return null;
    }

    const level = balance ? getBatteryLevel(balance.tonUnitsBalance.relativeAmount) : 'empty';

    return (
        <>
            <button
                type="button"
                aria-label={t('battery_title')}
                onClick={() => setOpen(true)}
                className={cn('flex shrink-0 cursor-pointer items-center', className)}
            >
                <BatteryLevelIcon level={level} size={34} />
            </button>
            <BatteryModal isOpen={open} onClose={() => setOpen(false)} from="wallet" />
        </>
    );
};
