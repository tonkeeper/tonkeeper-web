import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import {
    FavoriteSuggestion,
    LatestSuggestion,
    Suggestion
} from '@tonkeeper/core/dist/entries/suggestion';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { useAddFavorite, useDeleteFavorite, useEditFavorite } from '../../state/suggestions';
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

export const useSuggestionAddress = (item: Suggestion) => {
    const wallet = useWalletContext();

    return useMemo(() => {
        return item.blockchain === BLOCKCHAIN_NAME.TRON
            ? item.address
            : formatAddress(item.address, wallet.network);
    }, [item]);
};

const AddFavoriteContent: FC<{
    latest: LatestSuggestion;
    onClose: () => void;
}> = ({ latest, onClose }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    const { mutateAsync, reset, isLoading, isError } = useAddFavorite();
    const address = useSuggestionAddress(latest);
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

        await mutateAsync({ latest, name });
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
                        sdk.copyToClipboard(address, t('address_copied'));
                    }}
                >
                    <ListItemPayload>
                        <Label>{t('add_edit_favorite_address_label')}</Label>
                        <Label1>{toShortValue(address)}</Label1>
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

export const AddFavoriteNotification = () => {
    const [latest, setLatest] = useState<LatestSuggestion | undefined>(undefined);
    const { t } = useTranslation();
    const sdk = useAppSdk();

    const onClose = () => {
        setLatest(undefined);
    };

    useEffect(() => {
        const handler = (options: { method: 'addSuggestion'; params: LatestSuggestion }) => {
            setLatest(options.params);
        };
        sdk.uiEvents.on('addSuggestion', handler);
        return () => {
            sdk.uiEvents.off('addSuggestion', handler);
        };
    }, []);

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

const EditFavoriteContent: FC<{
    favorite: FavoriteSuggestion;
    onClose: () => void;
}> = ({ favorite, onClose }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    const address = useSuggestionAddress(favorite);

    const { mutateAsync: editAsync, reset, isLoading: isEditLoading, isError } = useEditFavorite();
    const { mutateAsync: deleteAsync, isLoading: isDeleteLoading } = useDeleteFavorite();

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
        await deleteAsync(favorite);
        onClose();
    };

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();
        e.stopPropagation();

        await editAsync({ favorite, name });
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
                        sdk.copyToClipboard(address, t('address_copied'));
                    }}
                >
                    <ListItemPayload>
                        <Label>{t('add_edit_favorite_address_label')}</Label>
                        <Label1>{toShortValue(address)}</Label1>
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

export const EditFavoriteNotification = () => {
    const [favorite, setFavorite] = useState<FavoriteSuggestion | undefined>(undefined);
    const { t } = useTranslation();
    const sdk = useAppSdk();

    const onClose = () => {
        setFavorite(undefined);
    };

    useEffect(() => {
        const handler = (options: { method: 'editSuggestion'; params: FavoriteSuggestion }) => {
            setFavorite(options.params);
        };
        sdk.uiEvents.on('editSuggestion', handler);
        return () => {
            sdk.uiEvents.off('editSuggestion', handler);
        };
    }, []);

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
