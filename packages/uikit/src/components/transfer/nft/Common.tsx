import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC } from 'react';
import { useAppSdk } from '../../../hooks/appSdk';
import { useTranslation } from '../../../hooks/translation';
import { ChevronLeftIcon } from '../../Icon';
import { ListBlock, ListItem, ListItemPayload } from '../../List';
import { NotificationCancelButton, NotificationTitleBlock } from '../../Notification';
import { Label1 } from '../../Text';
import { RoundedButton } from '../../fields/RoundedButton';
import { Label } from '../common';
import { useActiveTonNetwork } from '../../../state/wallet';

export type ConfirmHeaderBlockComponent = (props: {
    onBack: () => void;
    onClose: () => void;
}) => JSX.Element;

export const ConfirmHeaderBlock: ConfirmHeaderBlockComponent = ({ onBack, onClose }) => {
    return (
        <NotificationTitleBlock>
            <RoundedButton onClick={onBack}>
                <ChevronLeftIcon />
            </RoundedButton>
            <NotificationCancelButton handleClose={onClose} />
        </NotificationTitleBlock>
    );
};

export const NftDetailsBlock: FC<{ nftItem: NFT }> = ({ nftItem }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const network = useActiveTonNetwork();

    return (
        <ListBlock fullWidth>
            {nftItem.collection && (
                <ListItem
                    onClick={() =>
                        sdk.copyToClipboard(
                            formatAddress(nftItem.collection!.address, network, true)
                        )
                    }
                >
                    <ListItemPayload>
                        <Label>{t('NFT_collection_id')}</Label>
                        <Label1>
                            {toShortValue(
                                formatAddress(nftItem.collection!.address, network, true)
                            )}
                        </Label1>
                    </ListItemPayload>
                </ListItem>
            )}
            <ListItem
                onClick={() => sdk.copyToClipboard(formatAddress(nftItem.address, network, true))}
            >
                <ListItemPayload>
                    <Label>{t('NFT_item_id')}</Label>
                    <Label1>{toShortValue(formatAddress(nftItem.address, network, true))}</Label1>
                </ListItemPayload>
            </ListItem>
        </ListBlock>
    );
};
