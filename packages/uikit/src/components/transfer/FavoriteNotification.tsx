import { FavoriteSuggestion, LatestSuggestion } from '@tonkeeper/core/dist/entries/suggestion';
import React, { FC, useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAppSdk } from '../../hooks/appSdk';
import { useInputRefAutoFocus } from '../../hooks/input';
import { useTranslation } from '../../hooks/translation';
import { useAddFavorite, useDeleteFavorite, useEditFavorite } from '../../state/suggestions';
import { Notification } from '../Notification';
import { Button, ButtonRow } from '../fields/Button';
import { Input } from '../fields/Input';
import { SuggestionAddress } from './SuggestionAddress';

const Block = styled.form`
    display: flex;
    flex-direction: column;
    box-sizing: border-box;

    justify-content: center;
    gap: 1rem;
    width: 100%;
`;

const AddFavoriteContent: FC<{
    latest: LatestSuggestion;
    onClose: () => void;
}> = ({ latest, onClose }) => {
    const { t } = useTranslation();

    const { mutateAsync, reset, isLoading, isError } = useAddFavorite();
    const ref = useInputRefAutoFocus();

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
            <SuggestionAddress item={latest} />
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

    const { mutateAsync: editAsync, reset, isLoading: isEditLoading, isError } = useEditFavorite();
    const { mutateAsync: deleteAsync, isLoading: isDeleteLoading } = useDeleteFavorite();

    const ref = useInputRefAutoFocus();
    const isLoading = isEditLoading || isDeleteLoading;

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
            <SuggestionAddress item={favorite} />

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
