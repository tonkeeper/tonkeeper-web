import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC } from 'react';
import { useWalletContext } from '../../../hooks/appContext';
import { useAppSdk } from '../../../hooks/appSdk';
import { useTranslation } from '../../../hooks/translation';
import { ChevronLeftIcon } from '../../Icon';
import { ListBlock, ListItem, ListItemPayload } from '../../List';
import { NotificationCancelButton, NotificationTitleBlock } from '../../Notification';
import { Label1 } from '../../Text';
import { BackButton } from '../../fields/BackButton';
import { Label } from '../common';

export type ConfirmHeaderBlockComponent = (props: {
    onBack: () => void;
    onClose: () => void;
}) => JSX.Element;

export const ConfirmHeaderBlock: ConfirmHeaderBlockComponent = ({ onBack, onClose }) => {
    return (
        <NotificationTitleBlock>
            <BackButton onClick={onBack}>
                <ChevronLeftIcon />
            </BackButton>
            <NotificationCancelButton handleClose={onClose} />
        </NotificationTitleBlock>
    );
};

export const NftDetailsBlock: FC<{ nftItem: NFT }> = ({ nftItem }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const wallet = useWalletContext();

    return (
        <ListBlock fullWidth>
            {nftItem.collection && (
                <ListItem
                    onClick={() =>
                        sdk.copyToClipboard(
                            formatAddress(nftItem.collection!.address, wallet.network)
                        )
                    }
                >
                    <ListItemPayload>
                        <Label>{t('NFT_collection_id')}</Label>
                        <Label1>
                            {toShortValue(
                                formatAddress(nftItem.collection!.address, wallet.network)
                            )}
                        </Label1>
                    </ListItemPayload>
                </ListItem>
            )}
            <ListItem
                onClick={() => sdk.copyToClipboard(formatAddress(nftItem.address, wallet.network))}
            >
                <ListItemPayload>
                    <Label>{t('NFT_item_id')}</Label>
                    <Label1>{toShortValue(formatAddress(nftItem.address, wallet.network))}</Label1>
                </ListItemPayload>
            </ListItem>
        </ListBlock>
    );
};
