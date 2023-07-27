import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FavoriteSuggestion, LatestSuggestion } from '@tonkeeper/core/dist/entries/suggestion';
import {
    deleteFavoriteSuggestion,
    getFavoriteSuggestions,
    setFavoriteSuggestion
} from '@tonkeeper/core/dist/service/suggestionService';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Address } from 'ton-core';
import { useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { Notification } from '../Notification';
import { Label1 } from '../Text';
import { Button, ButtonRow } from '../fields/Button';
import { Input } from '../fields/Input';
import { Label } from './common';

const Block = styled.form`
    display: flex;
    flex-direction: column;
    box-sizing: border-box;

    justify-content: center;
    gap: 1rem;
    width: 100%;
`;

const validateName = (name: string) => {
    name = name.trim();
    if (name.length < 1) {
        throw new Error('Name is to short');
    }
    if (name.length > 24) {
        throw new Error('Name is to large');
    }
    return name;
};

const useAddFavorite = (latest: LatestSuggestion) => {
    const sdk = useAppSdk();
    const wallet = useWalletContext();
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>(async name => {
        name = validateName(name);
        const items = await getFavoriteSuggestions(sdk.storage, wallet.publicKey);
        if (items.some(item => item.name === name)) {
            throw new Error('Name is already taken');
        }
        items.push({ isFavorite: true, address: latest.address, name });
        await setFavoriteSuggestion(sdk.storage, wallet.publicKey, items);
        await queryClient.invalidateQueries([
            wallet.active.rawAddress,
            QueryKey.activity,
            'suggestions'
        ]);
    });
};

const AddFavoriteContent: FC<{
    latest: LatestSuggestion;
    onClose: () => void;
}> = ({ latest, onClose }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const wallet = useWalletContext();

    const { mutateAsync, reset, isLoading, isError } = useAddFavorite(latest);
    const ref = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (/iPhone|iPad|iPod/.test(window.navigator.userAgent)) {
            return;
        }
        if (ref.current) {
            ref.current.focus();
        }
    }, [ref.current]);

    const [name, setName] = useState('');

    const onName = (value: string) => {
        reset();
        setName(value.slice(0, 24));
    };

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();
        e.stopPropagation();

        await mutateAsync(name);
        onClose();
    };

    return (
        <Block onSubmit={handleSubmit}>
            <Input
                ref={ref}
                value={name}
                onChange={onName}
                label={t('add_edit_favorite_name_placeholder')}
                isValid={!isError}
                disabled={isLoading}
            />
            <ListBlock margin={false}>
                <ListItem
                    onClick={e => {
                        e.stopPropagation();
                        sdk.copyToClipboard(
                            Address.parse(latest.address).toString(),
                            t('address_copied')
                        );
                    }}
                >
                    <ListItemPayload>
                        <Label>{t('add_edit_favorite_address_label')}</Label>
                        <Label1>
                            {toShortValue(formatAddress(latest.address, wallet.network))}
                        </Label1>
                    </ListItemPayload>
                </ListItem>
            </ListBlock>
            <Button
                size="large"
                primary
                fullWidth
                marginTop
                type="submit"
                disabled={isLoading}
                loading={isLoading}
            >
                {t('add_edit_favorite_save')}
            </Button>
        </Block>
    );
};

export const AddFavoriteNotification: FC<{
    latest?: LatestSuggestion;
    onClose: () => void;
}> = ({ latest, onClose }) => {
    const { t } = useTranslation();

    const Content = useCallback(() => {
        if (!latest) return undefined;
        return <AddFavoriteContent onClose={onClose} latest={latest} />;
    }, [latest, onClose]);

    return (
        <Notification
            isOpen={latest != null}
            handleClose={onClose}
            hideButton
            title={t('add_edit_favorite_add_title')}
        >
            {Content}
        </Notification>
    );
};

const useDeleteFavorite = (favorite: FavoriteSuggestion) => {
    const sdk = useAppSdk();
    const wallet = useWalletContext();
    const queryClient = useQueryClient();

    return useMutation<void, Error>(async () => {
        await deleteFavoriteSuggestion(sdk.storage, wallet.publicKey, favorite.address);
        await queryClient.invalidateQueries([
            wallet.active.rawAddress,
            QueryKey.activity,
            'suggestions'
        ]);
    });
};
const useEditFavorite = (favorite: FavoriteSuggestion) => {
    const sdk = useAppSdk();
    const wallet = useWalletContext();
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>(async name => {
        name = validateName(name);
        let items = await getFavoriteSuggestions(sdk.storage, wallet.publicKey);
        if (items.some(item => item.name === name && item.address !== favorite.address)) {
            throw new Error('Name is already taken');
        }
        items = items.map(item =>
            item.address === favorite.address
                ? { isFavorite: true, address: favorite.address, name }
                : item
        );

        await setFavoriteSuggestion(sdk.storage, wallet.publicKey, items);
        await queryClient.invalidateQueries([
            wallet.active.rawAddress,
            QueryKey.activity,
            'suggestions'
        ]);
    });
};

const EditFavoriteContent: FC<{
    favorite: FavoriteSuggestion;
    onClose: () => void;
}> = ({ favorite, onClose }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const wallet = useWalletContext();

    const {
        mutateAsync: editAsync,
        reset,
        isLoading: isEditLoading,
        isError
    } = useEditFavorite(favorite);
    const { mutateAsync: deleteAsync, isLoading: isDeleteLoading } = useDeleteFavorite(favorite);

    const ref = useRef<HTMLInputElement | null>(null);

    const isLoading = isEditLoading || isDeleteLoading;
    useEffect(() => {
        if (/iPhone|iPad|iPod/.test(window.navigator.userAgent)) {
            return;
        }
        if (ref.current) {
            ref.current.focus();
        }
    }, [ref.current]);

    const [name, setName] = useState(favorite.name);

    const onName = (value: string) => {
        reset();
        setName(value.slice(0, 24));
    };

    const onDelete = async () => {
        await deleteAsync();
        onClose();
    };

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();
        e.stopPropagation();

        await editAsync(name);
        onClose();
    };

    return (
        <Block onSubmit={handleSubmit}>
            <Input
                ref={ref}
                value={name}
                onChange={onName}
                label={t('add_edit_favorite_name_placeholder')}
                isValid={!isError}
                disabled={isLoading}
            />
            <ListBlock margin={false}>
                <ListItem
                    onClick={e => {
                        e.stopPropagation();
                        sdk.copyToClipboard(
                            Address.parse(favorite.address).toString(),
                            t('address_copied')
                        );
                    }}
                >
                    <ListItemPayload>
                        <Label>{t('add_edit_favorite_address_label')}</Label>
                        <Label1>
                            {toShortValue(formatAddress(favorite.address, wallet.network))}
                        </Label1>
                    </ListItemPayload>
                </ListItem>
            </ListBlock>

            <ButtonRow>
                <Button
                    size="large"
                    fullWidth
                    type="button"
                    onClick={onDelete}
                    disabled={isLoading}
                    loading={isDeleteLoading}
                >
                    {t('send_screen_steps_address_suggest_actions_delete')}
                </Button>
                <Button
                    size="large"
                    primary
                    fullWidth
                    type="submit"
                    disabled={isLoading}
                    loading={isEditLoading}
                >
                    {t('add_edit_favorite_save')}
                </Button>
            </ButtonRow>
        </Block>
    );
};

export const EditFavoriteNotification: FC<{
    favorite?: FavoriteSuggestion;
    onClose: () => void;
}> = ({ favorite, onClose }) => {
    const { t } = useTranslation();

    const Content = useCallback(() => {
        if (!favorite) return undefined;
        return <EditFavoriteContent onClose={onClose} favorite={favorite} />;
    }, [favorite, onClose]);

    return (
        <Notification
            isOpen={favorite != null}
            handleClose={onClose}
            hideButton
            title={t('add_edit_favorite_edit_title')}
        >
            {Content}
        </Notification>
    );
};
