import { isUserCancellation } from '@tonkeeper/core/dist/errors/UserCancelledError';

import { useTranslation } from './translation';
import { useCallback, useEffect } from 'react';
import { notifyError } from '../components/transfer/common';
import { useAppSdk } from './appSdk';

export function useToast() {
    const sdk = useAppSdk();
    return useCallback(
        (content: string) => {
            sdk.topMessage(content);
        },
        [sdk]
    );
}

export function useNotifyError(error: unknown) {
    const sdk = useAppSdk();
    useEffect(() => {
        if (error instanceof Error) {
            sdk.topMessage(error.message);
        }
    }, [error, sdk]);
}

/**
 * Fallback for mutations with no inline error surface of their own: a
 * generic localized toast. A dismissed security prompt is not a failure and
 * stays silent; the raw error goes to the console for diagnostics only.
 */
export function useToastMutationError() {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    return useCallback(
        (error: unknown) => {
            if (isUserCancellation(error)) return;
            console.error(error);
            sdk.topMessage(t('error_action_failed'));
        },
        [sdk, t]
    );
}

export const useNotifyErrorHandle = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    return useCallback((e: unknown) => notifyError(sdk, t, e), [sdk, t]);
};
