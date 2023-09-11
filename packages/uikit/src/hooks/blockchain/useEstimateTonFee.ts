import { QueryKey, UseQueryOptions, useQuery } from '@tanstack/react-query';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TransferEstimation } from '@tonkeeper/core/dist/entries/send';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { Configuration } from '@tonkeeper/core/dist/tonApiV1';
import { EmulationApi } from '@tonkeeper/core/dist/tonApiV2';
import { Omit } from 'react-beautiful-dnd';
import { useAppContext, useWalletContext } from '../appContext';

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
    const {
        api: { tonApi, tonApiV2 }
    } = useAppContext();
    const walletState = useWalletContext();

    return useQuery<TransferEstimation<TonAsset>, Error>(
        queryKey,
        async () => {
            const boc = await caller({ ...args, walletState, tonApi } as Args);

            const emulation = await new EmulationApi(tonApiV2).emulateMessageToWallet({
                emulateMessageToEventRequest: { boc }
            });

            const fee = new AssetAmount({
                asset: TON_ASSET,
                weiAmount: emulation.event.extra * -1
            });
            return { fee, payload: emulation };
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options as any
    );
}
