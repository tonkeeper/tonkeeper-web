import { QueryKey, UseQueryOptions, useQuery } from '@tanstack/react-query';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { Configuration, SendApi } from '@tonkeeper/core/dist/tonApiV1';
import { Omit } from 'react-beautiful-dnd';
import { useAppContext, useWalletContext } from '../appContext';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TransferEstimation } from './useEstimateTransfer';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';

export type ContractCallerParams = {
    tonApi: Configuration;
    walletState: WalletState;
};

export function useEstimateTonFee<Args extends ContractCallerParams>(
    {
        caller,
        queryKey,
        options
    }: {
        caller: (params: Args) => Promise<string>;
        queryKey: QueryKey;
        options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn' | 'initialData'>;
    },
    args: Omit<Args, 'tonApi' | 'walletState'>
) {
    const { tonApi } = useAppContext();
    const walletState = useWalletContext();

    return useQuery<TransferEstimation<TonAsset>>(
        queryKey,
        async () => {
            const boc = await caller({ ...args, walletState, tonApi } as Args);
            const { fee: payload } = await new SendApi(tonApi).estimateTx({
                sendBocRequest: { boc }
            });

            const fee = new AssetAmount({ asset: TON_ASSET, weiAmount: payload.total });
            return { fee, payload };
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options as any
    );
}
