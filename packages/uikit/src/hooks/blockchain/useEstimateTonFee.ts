import { QueryKey, UseQueryOptions, useQuery } from '@tanstack/react-query';
import { APIConfig } from '@tonkeeper/core/dist/entries/apis';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TransferEstimation } from '@tonkeeper/core/dist/entries/send';
import { TonWalletStandard } from '@tonkeeper/core/dist/entries/wallet';
import { EmulationApi } from '@tonkeeper/core/dist/tonApiV2';
import { Omit } from 'react-beautiful-dnd';
import { useActiveAccount } from '../../state/wallet';
import { useAppContext } from '../appContext';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';

export type ContractCallerParams = {
    api: APIConfig;
    walletState: TonWalletStandard;
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
    args: Omit<Args, 'api' | 'walletState'>
) {
    const { api } = useAppContext();
    const account = useActiveAccount();

    return useQuery<TransferEstimation<TonAsset>, Error>(
        queryKey,
        async () => {
            if (!isAccountTonWalletStandard(account)) {
                throw new Error('account not controllable');
            }

            const boc = await caller({
                ...args,
                walletState: account.activeTonWallet,
                api
            } as Args);

            const { event } = await new EmulationApi(api.tonApiV2).emulateMessageToWallet({
                emulateMessageToWalletRequest: { boc }
            });

            const fee = new AssetAmount({
                asset: TON_ASSET,
                weiAmount: event.extra * -1
            });
            return { fee, payload: { event } };
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options as any
    );
}
