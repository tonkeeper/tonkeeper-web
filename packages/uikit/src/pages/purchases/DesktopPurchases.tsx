import { InnerBody } from '../../components/Body';
import { PurchasesHeader } from '../../components/Header';
import { NftsList } from '../../components/nft/Nfts';
import { useWalletNftList } from '../../state/wallet';
import styled from 'styled-components';

const gap = '10px';
const maxColumnsNumber = 4;
const maxGapWidth = (maxColumnsNumber - 1) * parseInt(gap) + 'px';
const minColumnWidth = '130px';

const NftsListStyled = styled(NftsList)`
    --grid-item--max-width: calc((100% - ${maxGapWidth}) / ${maxColumnsNumber});

    grid-template-columns: repeat(
        auto-fill,
        minmax(max(${minColumnWidth}, var(--grid-item--max-width)), 1fr)
    );
    grid-gap: ${gap};
`;

export const DesktopPurchases = () => {
    const { data: nfts } = useWalletNftList();

    return (
        <>
            <PurchasesHeader />
            <InnerBody>{nfts && <NftsListStyled nfts={nfts} />}</InnerBody>
        </>
    );
};
