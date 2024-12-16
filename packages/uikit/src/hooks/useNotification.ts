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
    }, [error]);
}

export const useNotifyErrorHandle = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    return useCallback((e: unknown) => notifyError(sdk, t, e), []);
};
