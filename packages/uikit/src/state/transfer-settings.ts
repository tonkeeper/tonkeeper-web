import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getTransferSettings,
    setTransferSettings,
    TransferFeeMethod,
    TransferSettings
} from '@tonkeeper/core/dist/service/transferSettingsService';
import { useAppSdk } from '../hooks/appSdk';
import { TonSenderTypeUserAvailable } from '../hooks/blockchain/useSender';
import { QueryKey } from '../libs/queryKey';

export const useTransferSettingsQuery = () => {
    const sdk = useAppSdk();
    return useQuery<TransferSettings>(
        [QueryKey.transferSettings],
        () => getTransferSettings(sdk.storage),
        { keepPreviousData: true }
    );
};

export const useMutateTransferFeeMethod = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, TransferFeeMethod>(async feeMethod => {
        await setTransferSettings(sdk.storage, { feeMethod });
        await client.invalidateQueries([QueryKey.transferSettings]);
    });
};

/**
 * Priority chain (matches iOS):
 *   saved 'gasless' -> gasless > battery > external
 *   saved 'battery' -> battery > external
 *   saved 'external' (default) -> external
 *   no preference (or saved type and fallbacks all unavailable) -> first available.
 */
export function pickPreferredTonSenderType(
    available: { type: TonSenderTypeUserAvailable }[] | undefined,
    saved: TransferFeeMethod | null
): TonSenderTypeUserAvailable | undefined {
    if (!available || available.length === 0) {
        return undefined;
    }
    const types = new Set(available.map(c => c.type));

    if (saved === 'gasless') {
        if (types.has('gasless')) return 'gasless';
        if (types.has('battery')) return 'battery';
        if (types.has('external')) return 'external';
    } else if (saved === 'battery') {
        if (types.has('battery')) return 'battery';
        if (types.has('external')) return 'external';
    } else if (saved === 'external') {
        if (types.has('external')) return 'external';
    }

    return available[0].type;
}
