import React, {FC} from "react";
import {NFTDNS} from "@tonkeeper/core/dist/entries/nft";
import styled from "styled-components";
import {Button} from "../fields/Button";
import {useNftDNSLinkData} from "../../state/wallet";
import {toShortAddress} from "@tonkeeper/core/dist/utils/common";

const LinkDNSButton = styled(Button)`
    
`;

export const LinkNft: FC<{ nft: NFTDNS }> = ({nft}) => {
    const { data, isLoading } = useNftDNSLinkData(nft);

    if (!nft.dns) {
        return null;
    }

    const linkedAddress = data?.wallet?.address ? toShortAddress(data?.wallet?.address) : '';

    return <>
        <LinkDNSButton
            type="button"
            size="large"
            loading={isLoading}
            secondary
            fullWidth
        >
            { linkedAddress ? 'Linked with ' + linkedAddress : 'Link Domain' }
        </LinkDNSButton>
    </>
}
