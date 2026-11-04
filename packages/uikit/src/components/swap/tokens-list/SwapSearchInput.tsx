import React, { forwardRef } from 'react';
import { useSwapTokensFilter } from '../../../state/swap/useSwapAssets';
import { useTranslation } from '../../../hooks/translation';
import { SearchField } from '../../fields/SearchField';

export const SwapSearchInput = forwardRef<
    HTMLInputElement,
    { className?: string; isDisabled: boolean }
>(({ className, isDisabled }, ref) => {
    const { t } = useTranslation();
    const [value, setValue] = useSwapTokensFilter();

    return (
        <SearchField
            ref={ref}
            id="swap-search"
            value={value}
            onChange={setValue}
            disabled={isDisabled}
            placeholder={t('swap_search')}
            className={className}
            autoFocus
            // Notifications animate in over ~400ms; delay focus so the call
            // doesn't compete with the open animation.
            autoFocusDelay={400}
        />
    );
});
