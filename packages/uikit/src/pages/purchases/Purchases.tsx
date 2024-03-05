import { InnerBody } from '../../components/Body';
import { PurchasesHeader } from '../../components/Header';
import { NftsList } from '../../components/nft/Nfts';
import { useWalletNftList } from '../../state/wallet';

export const Purchases = () => {
    const { data: nfts } = useWalletNftList();

    return (
        <>
            <PurchasesHeader />
            <InnerBody>{nfts && <NftsList nfts={nfts} />}</InnerBody>
        </>
    );
};
