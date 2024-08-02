import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { seeIfAddressEqual } from '@tonkeeper/core/dist/utils/common';
import { useActiveWallet } from '../../../state/wallet';

export function useAreNftActionsDisabled(nft: NFT) {
    const wallet = useActiveWallet();

    return nft.sale !== undefined || !seeIfAddressEqual(wallet.rawAddress, nft.owner?.address);
}
