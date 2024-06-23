import React, { forwardRef } from 'react';
import { useSwapTokensFilter } from '../../../state/swap/useSwapAssets';
import { useTranslation } from '../../../hooks/translation';
import { Input } from '../../fields/Input';

export const SwapSearchInput = forwardRef<
    HTMLInputElement,
    { className?: string; isDisabled: boolean }
>(({ className, isDisabled }, ref) => {
    const { t } = useTranslation();
    const [value, setValue] = useSwapTokensFilter();

    return (
        <Input
            value={value}
            onChange={e => setValue(e)}
            ref={ref}
            disabled={isDisabled}
            label={t('swap_search')}
            clearButton
            className={className}
            size="small"
        />
    );
});
