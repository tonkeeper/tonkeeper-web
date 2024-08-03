import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { intlLocale } from '@tonkeeper/core/dist/entries/language';
import {
    FavoriteSuggestion,
    LatestSuggestion,
    Suggestion
} from '@tonkeeper/core/dist/entries/suggestion';
import {
    deleteFavoriteSuggestion,
    getSuggestionsList,
    hideSuggestions
} from '@tonkeeper/core/dist/service/suggestionService';
import { toShortValue } from '@tonkeeper/core/dist/utils/common';
import { FC } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { DropDown } from '../DropDown';
import { EllipsisIcon, StarIcon } from '../Icon';
import { ColumnText } from '../Layout';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { SkeletonListWithImages } from '../Skeleton';
import { Label1 } from '../Text';
import { useSuggestionAddress } from './SuggestionAddress';
import { useActiveStandardTonWallet } from '../../state/wallet';

const Label = styled(Label1)`
    user-select: none;
    width: 100%;
    margin-top: 12px;
    margin-bottom: -4px;
`;

const useLatestSuggestion = (acceptBlockchains?: BLOCKCHAIN_NAME[]) => {
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const wallet = useActiveStandardTonWallet();

    return useQuery(
        [wallet.rawAddress, QueryKey.activity, 'suggestions', acceptBlockchains],
        () => getSuggestionsList(sdk, api, wallet, acceptBlockchains),
        { keepPreviousData: true }
    );
};

const Icon = styled.span`
    display: flex;
    color: ${props => props.theme.iconSecondary};

    padding: 8px;
    margin: -8px;
`;

const IconBlue = styled.span`
    display: inline-flex;
    color: ${props => props.theme.accentBlue};
`;

const getLatestDate = (language: string, timestamp: number) => {
    return new Intl.DateTimeFormat(intlLocale(language), {
        day: 'numeric',
        month: 'long'
    }).format(new Date(timestamp));
};

const useDeleteFavorite = (item: FavoriteSuggestion) => {
    const sdk = useAppSdk();
    const wallet = useActiveStandardTonWallet();
    const queryClient = useQueryClient();

    return useMutation(async () => {
        await deleteFavoriteSuggestion(sdk.storage, wallet.publicKey, item.address);
        await queryClient.invalidateQueries([wallet.rawAddress, QueryKey.activity, 'suggestions']);
    });
};

const FavoriteItem: FC<{
    item: FavoriteSuggestion;
    onSelect: (item: Suggestion) => void;
    onEdit: (item: FavoriteSuggestion) => void;
}> = ({ item, onSelect, onEdit }) => {
    const sdk = useAppSdk();

    const { mutateAsync } = useDeleteFavorite(item);
    const { t } = useTranslation();

    const address = useSuggestionAddress(item);
    return (
        <ListItem key={item.address} onClick={() => onSelect(item)}>
            <ListItemPayload>
                <ColumnText
                    noWrap
                    text={
                        <>
                            {item.name}{' '}
                            <IconBlue>
                                <StarIcon />
                            </IconBlue>
                        </>
                    }
                    secondary={toShortValue(address)}
                />
                <DropDown
                    payload={onClose => (
                        <ListBlock margin={false} dropDown>
                            <ListItem
                                dropDown
                                onClick={e => {
                                    e.stopPropagation();
                                    onEdit(item);
                                    onClose();
                                }}
                            >
                                <ListItemPayload>
                                    <Label1>{t('add_edit_favorite_edit_title')}</Label1>
                                </ListItemPayload>
                            </ListItem>
                            <ListItem
                                dropDown
                                onClick={e => {
                                    e.stopPropagation();
                                    sdk.confirm(
                                        t('send_screen_steps_address_delete_alert_text').replace(
                                            '%{name}',
                                            item.name
                                        )
                                    )
                                        .then(value => {
                                            if (value) {
                                                return mutateAsync();
                                            }
                                        })
                                        .finally(() => {
                                            onClose();
                                        });
                                }}
                            >
                                <ListItemPayload>
                                    <Label1>{t('add_edit_favorite_delete')}</Label1>
                                </ListItemPayload>
                            </ListItem>
                        </ListBlock>
                    )}
                >
                    <Icon>
                        <EllipsisIcon />
                    </Icon>
                </DropDown>
            </ListItemPayload>
        </ListItem>
    );
};

const useHideSuggestion = (item: LatestSuggestion) => {
    const sdk = useAppSdk();
    const wallet = useActiveStandardTonWallet();
    const queryClient = useQueryClient();

    return useMutation(async () => {
        await hideSuggestions(sdk.storage, wallet.publicKey, item.address);
        await queryClient.invalidateQueries([wallet.rawAddress, QueryKey.activity, 'suggestions']);
    });
};

const LatestItem: FC<{
    item: LatestSuggestion;
    onSelect: (item: Suggestion) => void;
    onAddFavorite: (item: LatestSuggestion) => void;
}> = ({ item, onSelect, onAddFavorite }) => {
    const { mutateAsync } = useHideSuggestion(item);
    const { t, i18n } = useTranslation();

    const address = useSuggestionAddress(item);

    return (
        <ListItem key={item.address} onClick={() => onSelect(item)}>
            <ListItemPayload>
                <ColumnText
                    text={toShortValue(address)}
                    secondary={getLatestDate(intlLocale(i18n.language), item.timestamp)}
                />
                <DropDown
                    payload={onClose => (
                        <ListBlock margin={false} dropDown>
                            <ListItem
                                dropDown
                                onClick={e => {
                                    e.stopPropagation();
                                    onAddFavorite(item);
                                    onClose();
                                }}
                            >
                                <ListItemPayload>
                                    <Label1>
                                        {t('send_screen_steps_address_suggest_actions_add')}
                                    </Label1>
                                </ListItemPayload>
                            </ListItem>
                            <ListItem
                                dropDown
                                onClick={e => {
                                    e.stopPropagation();
                                    mutateAsync().finally(() => onClose());
                                }}
                            >
                                <ListItemPayload>
                                    <Label1>
                                        {t('send_screen_steps_address_suggest_actions_hide')}
                                    </Label1>
                                </ListItemPayload>
                            </ListItem>
                        </ListBlock>
                    )}
                >
                    <Icon>
                        <EllipsisIcon />
                    </Icon>
                </DropDown>
            </ListItemPayload>
        </ListItem>
    );
};

export const SuggestionList: FC<{
    onSelect: (item: Suggestion) => void;
    disabled?: boolean;
    acceptBlockchains?: BLOCKCHAIN_NAME[];
}> = ({ onSelect, disabled, acceptBlockchains }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { data } = useLatestSuggestion(acceptBlockchains);

    if (!data) {
        return (
            <>
                <Label>{t('send_screen_steps_address_suggests_label')}</Label>
                <SkeletonListWithImages size={4} margin={false} fullWidth />
            </>
        );
    }

    return (
        <>
            {data.length > 0 ? (
                <Label>{t('send_screen_steps_address_suggests_label')}</Label>
            ) : undefined}
            <ListBlock margin={false} fullWidth noUserSelect>
                {data.map(item => {
                    if (item.isFavorite) {
                        return (
                            <FavoriteItem
                                key={item.address}
                                item={item}
                                onSelect={value => !disabled && onSelect(value)}
                                onEdit={value => {
                                    if (!disabled) {
                                        sdk.uiEvents.emit('editSuggestion', {
                                            method: 'editSuggestion',
                                            params: value
                                        });
                                    }
                                }}
                            />
                        );
                    }
                    return (
                        <LatestItem
                            key={item.address}
                            item={item}
                            onSelect={value => !disabled && onSelect(value)}
                            onAddFavorite={value => {
                                if (!disabled) {
                                    sdk.uiEvents.emit('addSuggestion', {
                                        method: 'addSuggestion',
                                        params: value
                                    });
                                }
                            }}
                        />
                    );
                })}
            </ListBlock>
        </>
    );
};
