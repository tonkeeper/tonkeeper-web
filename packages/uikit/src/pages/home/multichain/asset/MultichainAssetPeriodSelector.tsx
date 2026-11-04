import { FC } from 'react';

import { cn } from '../../../../libs/css';
import { useIsSkeleton } from '../../../../primitives';
import { ChartPeriod } from '../../../../state/trading/useAssetCharts';

const PERIODS: ChartPeriod[] = ['H', 'D', 'W', 'M', '6M', 'Y'];

export const MultichainAssetPeriodSelector: FC<{
    value: ChartPeriod;
    onChange: (period: ChartPeriod) => void;
}> = ({ value, onChange }) => {
    // While the page loads every pill renders as a labelless secondary shape,
    // per the mockup — no active highlight, nothing to select yet.
    const isSkeleton = useIsSkeleton();

    return (
        <div className="flex w-full items-center justify-center gap-1 p-4">
            {PERIODS.map(period => (
                <button
                    key={period}
                    type="button"
                    onClick={() => onChange(period)}
                    disabled={isSkeleton}
                    className={cn(
                        'flex flex-1 items-center justify-center rounded-[18px] px-4 py-2 text-label2 text-buttonSecondaryForeground transition-colors duration-100',
                        isSkeleton
                            ? 'bg-buttonSecondaryBackground text-transparent'
                            : value === period
                            ? 'cursor-pointer bg-buttonSecondaryBackground hover:bg-buttonSecondaryBackgroundHighlighted'
                            : 'cursor-pointer hover:bg-backgroundHighlighted'
                    )}
                >
                    {period}
                </button>
            ))}
        </div>
    );
};
