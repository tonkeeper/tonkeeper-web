import { FC } from 'react';

import { MultichainActivityType } from '@tonkeeper/core/dist/service/multichainActivityService';

import { cn } from '../../../../libs/css';
import { useTranslation } from '../../../../hooks/translation';
import { SelectPill } from '../SelectPill';

/**
 * What the history feed's type pill can narrow to. `undefined` is All Types.
 * The activity kinds map to the backend `activity_type` query; `spam` is the
 * backend spam classification instead (a spam transfer still has a kind, so
 * the two axes are independent), and All excludes it.
 */
export type MultichainHistoryTypeFilterValue = 'send' | 'receive' | 'swap' | 'spam';

const OPTIONS: (MultichainHistoryTypeFilterValue | undefined)[] = [
    undefined,
    'send',
    'receive',
    'swap',
    'spam'
];

export function historyTypeFilterToQuery(value: MultichainHistoryTypeFilterValue | undefined): {
    activityType?: MultichainActivityType;
    spam: boolean;
} {
    if (value === 'spam') return { spam: true };
    return { activityType: value, spam: false };
}

function optionLabelKey(option: MultichainHistoryTypeFilterValue | undefined): string {
    switch (option) {
        case 'send':
            return 'transaction_type_sent';
        case 'receive':
            return 'transaction_type_receive';
        case 'swap':
            return 'multichain_history_swap';
        case 'spam':
            return 'spam_action';
        default:
            return 'multichain_history_type_all';
    }
}

export interface MultichainHistoryTypeFilterProps {
    value?: MultichainHistoryTypeFilterValue;
    onChange: (value?: MultichainHistoryTypeFilterValue) => void;
    compact?: boolean;
}

/**
 * History feed type filter: the shared {@link SelectPill} floating over the
 * bottom of the feed, so its menu opens upwards.
 */
export const MultichainHistoryTypeFilter: FC<MultichainHistoryTypeFilterProps> = ({
    value,
    onChange,
    compact = false
}) => {
    const { t } = useTranslation();
    const position = compact ? 'sticky bottom-0 mt-auto' : 'fixed inset-x-0 bottom-0';

    return (
        <div className={cn('z-10 flex justify-center px-4 pb-6 pt-2', position)}>
            <SelectPill
                value={value}
                options={OPTIONS.map(option => ({
                    value: option,
                    label: t(optionLabelKey(option))
                }))}
                onChange={onChange}
                variant="tertiary"
                menuPosition="above-center"
            />
        </div>
    );
};
