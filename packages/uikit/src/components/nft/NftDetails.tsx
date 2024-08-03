import { Address } from '@ton/core';
import { NftItem } from '@tonkeeper/core/dist/tonApiV2';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useDateFormat } from '../../hooks/dateFormat';
import { useTranslation } from '../../hooks/translation';
import { useActiveTonNetwork, useActiveWallet } from '../../state/wallet';
import { SpinnerIcon } from '../Icon';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { Body1, H3, Label1 } from '../Text';
import { NFTKind } from './NftAction';
import { useNftDNSExpirationDate, useNftItemData } from '../../state/nft';

const Block = styled.div`
    width: 100%;
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.625rem;
`;

const Link = styled(Label1)`
    cursor: pointer;
    color: ${props => props.theme.textAccent};
`;

const RightText = styled(Body1)`
    color: ${props => props.theme.textSecondary};
`;

export const NftDetails: FC<{ nftItem: NftItem; kind: NFTKind }> = React.memo(({ nftItem }) => {
    const { t } = useTranslation();
    const { data } = useNftItemData(nftItem.address);
    const { data: expirationDate, isLoading: isExpirationDateLoading } =
        useNftDNSExpirationDate(nftItem);
    const expirationDateFormatted = useDateFormat(expirationDate, {
        year: 'numeric',
        hour: undefined,
        minute: undefined
    });

    const item = data ?? nftItem;

    const sdk = useAppSdk();
    const { config } = useAppContext();
    const owner = item.owner?.address;
    const address = Address.parse(item.address).toString();

    const network = useActiveTonNetwork();
    const url = config.NFTOnExplorerUrl ?? 'https://tonviewer.com/nft/%s';
    const nftAddress = formatAddress(address, network, true);

    return (
        <Block>
            <Row>
                <H3>{t('nft_details')}</H3>
                <Link onClick={() => sdk.openPage(url.replace('%s', address))}>
                    {t('nft_view_in_explorer')}
                </Link>
            </Row>
            <ListBlock margin={false}>
                {owner && (
                    <ListItem onClick={() => sdk.copyToClipboard(formatAddress(owner, network))}>
                        <ListItemPayload>
                            <RightText>{t('nft_owner_address')}</RightText>
                            <Label1>{toShortValue(formatAddress(owner, network))}</Label1>
                        </ListItemPayload>
                    </ListItem>
                )}
                {!!(expirationDate || isExpirationDateLoading) && (
                    <ListItem hover={false}>
                        <ListItemPayload>
                            <RightText>{t('dns_expiration_date')}</RightText>
                            {expirationDate ? (
                                <Label1>{expirationDateFormatted}</Label1>
                            ) : (
                                <SpinnerIcon />
                            )}
                        </ListItemPayload>
                    </ListItem>
                )}
                <ListItem onClick={() => sdk.copyToClipboard(nftAddress)}>
                    <ListItemPayload>
                        <RightText>{t('nft_contract_address')}</RightText>
                        <Label1>{toShortValue(nftAddress)}</Label1>
                    </ListItemPayload>
                </ListItem>
            </ListBlock>
        </Block>
    );
});
