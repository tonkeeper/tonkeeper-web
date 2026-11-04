import { FC } from 'react';

import { cn } from '../../../../libs/css';
import { searchFieldBoxClass, searchFieldIconClass } from '../../../../primitives/SearchField';
import { useTranslation } from '../../../../hooks/translation';
import IcMagnifyingGlass16 from '../../../../icons/components/IcMagnifyingGlass16';

/**
 * Search affordance at the top of the Trade tab. Wears the search field's own
 * box but is a plain button — typing happens on the Crypto page, which this
 * navigates to (with the field focused).
 */
export const TradeSearchEntry: FC<{ onClick: () => void }> = ({ onClick }) => {
    const { t } = useTranslation();
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(searchFieldBoxClass, 'w-full cursor-pointer text-left')}
        >
            <span aria-hidden className={searchFieldIconClass}>
                <IcMagnifyingGlass16 className="size-4" />
            </span>
            <span className="text-body1 text-textSecondary">
                {t('crypto_catalog_search_placeholder')}
            </span>
        </button>
    );
};
