import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { useActiveWallet } from '../../../state/wallet';

export function useAreNftActionsDisabled(nft: NFT) {
    const wallet = useActiveWallet();

    return nft.sale !== undefined || !eqAddresses(wallet.rawAddress, nft.owner?.address);
}
