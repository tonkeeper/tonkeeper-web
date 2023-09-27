import { FavoriteSuggestion, LatestSuggestion } from '@tonkeeper/core/dist/entries/suggestion';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useTranslation } from '@tonkeeper/uikit/dist/hooks/translation';
import { useAddFavorite, useEditFavorite } from '@tonkeeper/uikit/dist/state/suggestions';
import { useEffect } from 'react';

export const AddFavoriteNotification = () => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    const { mutateAsync, reset } = useAddFavorite();

    useEffect(() => {
        const handler = async (options: { method: 'addSuggestion'; params: LatestSuggestion }) => {
            reset();
            const name = sdk.prompt(t('add_edit_favorite_add_title'));
            if (name !== null) {
                try {
                    await mutateAsync({ latest: options.params, name });
                } catch (e) {
                    if (e instanceof Error) {
                        sdk.topMessage(e.message);
                    }
                }
            }
        };
        sdk.uiEvents.on('addSuggestion', handler);
        return () => {
            sdk.uiEvents.off('addSuggestion', handler);
        };
    }, []);

    return <></>;
};

export const EditFavoriteNotification = () => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { mutateAsync, reset } = useEditFavorite();

    useEffect(() => {
        const handler = async (options: {
            method: 'editSuggestion';
            params: FavoriteSuggestion;
        }) => {
            reset();
            const name = sdk.prompt(t('add_edit_favorite_add_title'), options.params.name);
            if (name !== null) {
                try {
                    await mutateAsync({ favorite: options.params, name });
                } catch (e) {
                    if (e instanceof Error) {
                        sdk.topMessage(e.message);
                    }
                }
            }
        };
        sdk.uiEvents.on('editSuggestion', handler);
        return () => {
            sdk.uiEvents.off('editSuggestion', handler);
        };
    }, []);

    return <></>;
};
