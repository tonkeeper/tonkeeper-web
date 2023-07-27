import { notifyError } from '../components/transfer/common';
import { useTranslation } from './translation';
import { useAppSdk } from './appSdk';
import { useQueryClient } from '@tanstack/react-query';

export function useNotification() {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const client = useQueryClient();

    return (e: Error) => notifyError(client, sdk, t, e);
}
