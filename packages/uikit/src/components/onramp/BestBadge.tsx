import { FC } from 'react';

import { useTranslation } from '../../hooks/translation';

/**
 * Marks the best-rate provider. The design library's Accent Tag: label and
 * fill are the same accent token, the fill at 16% — `color-mix` derives it
 * from the live theme variable so it follows a theme switch.
 */
export const BestBadge: FC = () => {
    const { t } = useTranslation();
    return (
        <span className="inline-flex h-4 shrink-0 select-none items-center rounded-extraExtraSmall bg-[color-mix(in_srgb,var(--tk-accent-blue)_16%,transparent)] px-1.5 text-[10px] font-medium uppercase leading-none tracking-wider text-accentBlue">
            {t('enter_amount_best_badge')}
        </span>
    );
};
