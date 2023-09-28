import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { seeIfAddressEqual } from '@tonkeeper/core/dist/utils/common';
import { useWalletContext } from '../../appContext';

export function useAreNftActionsDisabled(nft: NFT) {
    const wallet = useWalletContext();

    return (
        nft.sale !== undefined || !seeIfAddressEqual(wallet.active.rawAddress, nft.owner?.address)
    );
}
