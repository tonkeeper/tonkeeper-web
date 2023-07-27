import { useQuery } from '@tanstack/react-query';
import { NFTApi, NftItemsRepr } from '@tonkeeper/core/dist/tonApiV1';
import { useAppContext, useWalletContext } from '../hooks/appContext';
import { QueryKey } from '../libs/queryKey';

export const useNftInfo = () => {
    const wallet = useWalletContext();
    const { tonApi } = useAppContext();
    return useQuery<NftItemsRepr, Error>([wallet.active.rawAddress, QueryKey.nft], async () => {
        const result = await new NFTApi(tonApi).searchNFTItems({
            owner: wallet.active.rawAddress,
            offset: 0,
            limit: 10
        });

        return result;
    });
};
