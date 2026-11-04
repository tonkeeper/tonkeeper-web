import { useCallback } from 'react';
import { chainKitFailureOf } from '@tonkeeper/core/dist/service/chainkit/chainKitErrors';

import { useTranslation } from '../../../hooks/translation';

/**
 * The line a failed send or swap shows: the short balance or the node's own
 * rejection when chain-kit names one, the generic failure otherwise.
 */
export const useSendFailureText = () => {
    const { t } = useTranslation();
    return useCallback(
        (error: unknown): string => {
            const failure = chainKitFailureOf(error);
            if (failure?.kind === 'insufficientFunds') {
                return t('send_screen_steps_amount_insufficient_balance');
            }
            if (failure?.kind === 'rejected' && failure.message) {
                return failure.message;
            }
            return t('send_failed');
        },
        [t]
    );
};
