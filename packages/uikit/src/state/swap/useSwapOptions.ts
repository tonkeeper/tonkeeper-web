import { useAppSdk } from '../../hooks/appSdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';

export type SwapOptions = {
    slippagePercent: number;
    maxPriceImpact: number;
};

const defaultSwapOptions: SwapOptions = {
    slippagePercent: 1,
    maxPriceImpact: 0.3
};

export const useSwapOptions = () => {
    const sdk = useAppSdk();
    return useQuery<SwapOptions>([AppKey.SWAP_OPTIONS], async () => {
        const options = await sdk.storage.get<SwapOptions>(AppKey.SWAP_OPTIONS);

        return {
            slippagePercent: options?.slippagePercent || defaultSwapOptions.slippagePercent,
            maxPriceImpact: options?.maxPriceImpact || defaultSwapOptions.maxPriceImpact
        };
    });
};

export const useMutateSwapOptions = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, Partial<SwapOptions>>(async newOptions => {
        const options = await sdk.storage.get<SwapOptions>(AppKey.SWAP_OPTIONS);

        await sdk.storage.set(AppKey.SWAP_OPTIONS, { ...options, ...newOptions });
        await client.invalidateQueries([AppKey.SWAP_OPTIONS]);
    });
};
