import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { useAppSdk } from '../../hooks/appSdk';

export type SwapOptions = {
    slippageBps: number;
    maxPriceImpact: number;
};

const defaultSwapOptions: SwapOptions = {
    slippageBps: 50,
    maxPriceImpact: 0.3
};

const IGNORE_STORED = -1;

type StoredSwapOptions = {
    slippageBps?: number;
    slippagePercent?: number;
    maxPriceImpact?: number;
};

function parseStored(stored: StoredSwapOptions | null | undefined): SwapOptions {
    if (!stored) return defaultSwapOptions;

    let slippageBps = defaultSwapOptions.slippageBps;
    if (stored.slippageBps !== undefined) {
        slippageBps = stored.slippageBps;
    } else if (stored.slippagePercent !== undefined) {
        slippageBps = stored.slippagePercent * 100;
    }

    let maxPriceImpact = defaultSwapOptions.maxPriceImpact;
    if (stored.maxPriceImpact !== undefined) {
        maxPriceImpact = stored.maxPriceImpact === IGNORE_STORED ? Infinity : stored.maxPriceImpact;
    }

    return { slippageBps, maxPriceImpact };
}

function toStored(options: SwapOptions): StoredSwapOptions {
    return {
        slippageBps: options.slippageBps,
        maxPriceImpact: options.maxPriceImpact === Infinity ? IGNORE_STORED : options.maxPriceImpact
    };
}

export const useSwapOptions = () => {
    const sdk = useAppSdk();
    return useQuery<SwapOptions>([AppKey.SWAP_OPTIONS], async () => {
        const stored = await sdk.storage.get<StoredSwapOptions>(AppKey.SWAP_OPTIONS);
        return parseStored(stored);
    });
};

export const useMutateSwapOptions = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, Partial<SwapOptions>>(async partial => {
        const stored = await sdk.storage.get<StoredSwapOptions>(AppKey.SWAP_OPTIONS);
        const current = parseStored(stored);
        const merged = { ...current, ...partial };
        await sdk.storage.set(AppKey.SWAP_OPTIONS, toStored(merged));
        await client.invalidateQueries([AppKey.SWAP_OPTIONS]);
    });
};

export const useSlippageBps = (): number => {
    const { data } = useSwapOptions();
    return data?.slippageBps ?? defaultSwapOptions.slippageBps;
};

export const useMaxPriceImpact = (): number => {
    const { data } = useSwapOptions();
    return data?.maxPriceImpact ?? defaultSwapOptions.maxPriceImpact;
};
