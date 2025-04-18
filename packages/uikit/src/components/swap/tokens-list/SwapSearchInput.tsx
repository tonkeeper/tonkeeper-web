import React, { forwardRef } from 'react';
import { useSwapTokensFilter } from '../../../state/swap/useSwapAssets';
import { useTranslation } from '../../../hooks/translation';
import { Input } from '../../fields/Input';
import { useAppTargetEnv } from '../../../hooks/appSdk';

export const SwapSearchInput = forwardRef<
    HTMLInputElement,
    { className?: string; isDisabled: boolean }
>(({ className, isDisabled }, ref) => {
    const { t } = useTranslation();
    const [value, setValue] = useSwapTokensFilter();
    const targetEnv = useAppTargetEnv();

    return (
        <Input
            id="swap-search"
            value={value}
            onChange={e => setValue(e)}
            ref={ref}
            disabled={isDisabled}
            label={t('swap_search')}
            clearButton
            className={className}
            size="small"
            autoFocus={targetEnv === 'swap_widget_web' ? 100 : 'notification'}
        />
    );
});
