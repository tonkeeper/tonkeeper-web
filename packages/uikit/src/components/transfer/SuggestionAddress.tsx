import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { Suggestion } from '@tonkeeper/core/dist/entries/suggestion';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC, useMemo } from 'react';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { Label1 } from '../Text';
import { Label } from './common';
import { useActiveTonNetwork } from '../../state/wallet';

export const useSuggestionAddress = (item: Suggestion) => {
    const network = useActiveTonNetwork();

    return useMemo(() => {
        return item.blockchain === BLOCKCHAIN_NAME.TRON
            ? item.address
            : formatAddress(item.address, network);
    }, [item, network]);
};

export const SuggestionAddress: FC<{ item: Suggestion }> = ({ item }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    const address = useSuggestionAddress(item);

    return (
        <ListBlock margin={false}>
            <ListItem
                onClick={e => {
                    e.stopPropagation();
                    sdk.copyToClipboard(address, t('address_copied'));
                }}
            >
                <ListItemPayload>
                    <Label>{t('add_edit_favorite_address_label')}</Label>
                    <Label1>{toShortValue(address)}</Label1>
                </ListItemPayload>
            </ListItem>
        </ListBlock>
    );
};
