import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { useWalletContext } from '../../appContext';

export function useAreNftActionsDisabled(nft: NFT) {
    const wallet = useWalletContext();

    return nft.sale !== undefined || nft.owner?.address !== wallet.active.rawAddress;
}
