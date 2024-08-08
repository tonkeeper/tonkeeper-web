import { Address } from '@ton/core';
import { NFT, isNFTDNS } from '@tonkeeper/core/dist/entries/nft';
import { NftItem } from '@tonkeeper/core/dist/tonApiV2';
import { FC } from 'react';
import styled from 'styled-components';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { useActiveWallet, useIsActiveWalletWatchOnly } from '../../state/wallet';
import { Body2 } from '../Text';
import { Button } from '../fields/Button';
import { LinkNft } from './LinkNft';
import { RenewNft } from './RenewNft';

const getMarketplaceUrl = (nftItem: NftItem) => {
    const { marketplace } = nftItem.metadata;
    const address = Address.parse(nftItem.address).toString();

    switch (marketplace) {
        case 'getgems.io':
            return `https://getgems.io/nft/${address}`;
        // TODO: add more
        default:
            return `https://getgems.io/nft/${address}`;
    }
};

const ViewOnMarketButton: FC<{ url: string }> = ({ url }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    return (
        <Button
            size="large"
            secondary
            fullWidth
            onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                sdk.openPage(url);
            }}
        >
            {t('nft_open_in_marketplace')}
        </Button>
    );
};
const ActionTransfer: FC<{
    nftItem: NFT;
}> = ({ nftItem }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const wallet = useActiveWallet();

    return (
        <>
            <Button
                primary
                size="large"
                fullWidth
                disabled={
                    nftItem.sale !== undefined || nftItem.owner?.address !== wallet.rawAddress
                }
                onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    sdk.uiEvents.emit('transferNft', { method: 'transferNft', params: nftItem });
                }}
            >
                {t('nft_transfer_nft')}
            </Button>
            {nftItem.sale && <DNSSaleText>{t('nft_on_sale_text')}</DNSSaleText>}
        </>
    );
};

export type NFTKind = 'token' | 'telegram.name' | 'telegram.number' | 'ton.dns';

const SaleText = styled(Body2)`
    width: 100%;
    color: ${props => props.theme.textSecondary};
`;

const DNSSaleText = styled(SaleText)`
    width: 100%;
    padding: 0 1rem;
    text-align: left;
`;

export const NftAction: FC<{
    kind: NFTKind;
    nftItem: NFT;
}> = ({ kind, nftItem }) => {
    const isReadOnly = useIsActiveWalletWatchOnly();
    if (isReadOnly) {
        return (
            <>
                <ViewOnMarketButton url={getMarketplaceUrl(nftItem)} />
            </>
        );
    }

    switch (kind) {
        case 'token': {
            return (
                <>
                    <ActionTransfer nftItem={nftItem} />
                    <ViewOnMarketButton url={getMarketplaceUrl(nftItem)} />
                </>
            );
        }
        case 'ton.dns': {
            return (
                <>
                    <ActionTransfer nftItem={nftItem} />
                    <ViewOnMarketButton url={`https://dns.ton.org/#${nftItem.dns?.slice(0, -4)}`} />

                    {isNFTDNS(nftItem) && (
                        <>
                            <LinkNft nft={nftItem} />
                            <RenewNft nft={nftItem} />
                        </>
                    )}
                </>
            );
        }
        case 'telegram.number': {
            const numbers = nftItem.metadata.name.replace(/\s/g, '').slice(1);

            return (
                <>
                    <ActionTransfer nftItem={nftItem} />
                    <ViewOnMarketButton url={`https://fragment.com/number/${numbers}`} />
                </>
            );
        }
        case 'telegram.name': {
            return (
                <>
                    <ActionTransfer nftItem={nftItem} />
                    <ViewOnMarketButton
                        url={`https://fragment.com/username/${nftItem.dns?.slice(0, -5)}`}
                    />
                    {isNFTDNS(nftItem) && <LinkNft nft={nftItem} />}
                </>
            );
        }
    }
};
