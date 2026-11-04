import { FC, useMemo, useState } from 'react';

import { ChainId } from '@tonkeeper/core/dist/chains/types';
// import { intlLocale } from '@tonkeeper/core/dist/entries/language';

import { Button, Input } from '../../../primitives';
import { Modal } from '../../../primitives/Modal';
import { cn } from '../../../libs/css';
import IcStar16 from '../../../icons/components/IcStar16';
import { useAppSdk } from '../../../hooks/appSdk';
import { useTranslation } from '../../../hooks/translation';
import {
    useAddMultichainFavorite,
    useDeleteMultichainFavorite,
    useMultichainFavorites
    // useMultichainRecentRecipients
} from '../../../state/multichain/useMultichainRecipientSuggestions';
import { truncateAddress } from './multichainSendShared';

export interface RecipientSuggestionRow {
    address: string;
    /** Favorite name, or the truncated address for a recent. */
    title: string;
    /** Truncated address for a favorite, or the transfer date for a recent. */
    subtitle: string;
    isFavorite: boolean;
}

/**
 * "Favorites and recent" list under the send form's address field. Pure —
 * `SendRecipientSuggestions` wires the data hooks around it. The star
 * toggles favorite status: adds for a recent row, removes for a favorite.
 */
export const RecipientSuggestionsView: FC<{
    rows: RecipientSuggestionRow[];
    onSelect: (address: string) => void;
    onToggleFavorite: (address: string) => void;
}> = ({ rows, onSelect, onToggleFavorite }) => {
    const { t } = useTranslation();

    if (rows.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-2">
            <span className="px-0.5 text-body2 text-textSecondary">
                {t('send_screen_steps_address_suggests_label')}
            </span>
            <div className="overflow-hidden rounded-medium bg-backgroundContent">
                {rows.map((row, i) => (
                    <div
                        key={row.address}
                        className={cn(
                            'flex items-center transition-colors duration-100 hover:bg-backgroundContentTint',
                            i > 0 && 'border-t border-separatorCommon'
                        )}
                    >
                        <button
                            type="button"
                            onClick={() => onSelect(row.address)}
                            className="flex min-h-[56px] min-w-0 flex-1 cursor-pointer flex-col justify-center px-4 py-2 text-left"
                        >
                            <span className="truncate text-label1 text-textPrimary">
                                {row.title}
                            </span>
                            <span className="truncate text-body2 text-textSecondary">
                                {row.subtitle}
                            </span>
                        </button>
                        <button
                            type="button"
                            aria-label={
                                row.isFavorite
                                    ? t('send_screen_steps_address_suggest_actions_delete')
                                    : t('send_screen_steps_address_suggest_actions_add')
                            }
                            onClick={() => onToggleFavorite(row.address)}
                            className={cn(
                                'mr-2 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-100 hover:bg-backgroundContentAttention',
                                row.isFavorite
                                    ? 'text-accentBlue'
                                    : 'text-iconSecondary hover:text-iconPrimary'
                            )}
                        >
                            <IcStar16 className="size-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const FAVORITE_NAME_MAX = 24;

const FavoriteNameSheet: FC<{
    address: string;
    chain: ChainId;
    onClose: () => void;
}> = ({ address, chain, onClose }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const add = useAddMultichainFavorite();

    const trimmed = name.trim();
    const nameValid = trimmed.length >= 1 && trimmed.length <= FAVORITE_NAME_MAX;

    const onSave = () => add.mutate({ address, name: trimmed, chain }, { onSuccess: onClose });

    return (
        <Modal
            isOpen
            onClose={onClose}
            variant="content"
            topBarTitle={t('add_edit_favorite_add_title')}
        >
            <div className="flex flex-col gap-4 pb-4">
                <Input
                    id="favorite-name"
                    value={name}
                    onChange={setName}
                    label={t('add_edit_favorite_name_placeholder')}
                />
                <p className="break-all px-0.5 text-body2 text-textSecondary">{address}</p>
                <Button
                    variant="primaryBlue"
                    size="large"
                    fullWidth
                    disabled={!nameValid}
                    loading={add.isLoading}
                    onClick={onSave}
                >
                    {t('add_edit_favorite_save')}
                </Button>
            </div>
        </Modal>
    );
};

/**
 * Recipient address book for the multichain send form: the account's saved
 * favorites for the asset's chain family, then the latest outgoing-transfer
 * recipients from the activity feed. Selecting a row fills the address
 * field; the star saves a recent as a named favorite or deletes a favorite
 * after a confirm.
 */
export const SendRecipientSuggestions: FC<{
    chain: ChainId;
    onSelect: (address: string) => void;
}> = ({ chain, onSelect }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { data: favorites } = useMultichainFavorites(chain);
    // Recent recipients are off: the native apps don't offer them.
    // const { recents } = useMultichainRecentRecipients(chain);
    const deleteFavorite = useDeleteMultichainFavorite();
    const [favoriteDraft, setFavoriteDraft] = useState<string | undefined>();

    const rows = useMemo<RecipientSuggestionRow[]>(() => {
        const favs = favorites ?? [];
        // const dateFormat = new Intl.DateTimeFormat(intlLocale(i18n.language), {
        //     day: 'numeric',
        //     month: 'long'
        // });
        return [
            ...favs.map(f => ({
                address: f.address,
                title: f.name,
                subtitle: truncateAddress(f.address),
                isFavorite: true
            }))
            // ...recents
            //     .filter(r => !favs.some(f => f.address.toLowerCase() === r.address.toLowerCase()))
            //     .map(r => ({
            //         address: r.address,
            //         title: truncateAddress(r.address),
            //         subtitle: dateFormat.format(new Date(r.timestamp)),
            //         isFavorite: false
            //     }))
        ];
    }, [favorites]);

    const onToggleFavorite = (address: string) => {
        const favorite = (favorites ?? []).find(
            f => f.address.toLowerCase() === address.toLowerCase()
        );
        if (!favorite) {
            setFavoriteDraft(address);
            return;
        }
        sdk.confirm({
            message: t('send_screen_steps_address_delete_alert_text', { name: favorite.name })
        }).then(confirmed => {
            if (confirmed) {
                deleteFavorite.mutate({ address, chain });
            }
        });
    };

    return (
        <>
            <RecipientSuggestionsView
                rows={rows}
                onSelect={onSelect}
                onToggleFavorite={onToggleFavorite}
            />
            {favoriteDraft && (
                <FavoriteNameSheet
                    address={favoriteDraft}
                    chain={chain}
                    onClose={() => setFavoriteDraft(undefined)}
                />
            )}
        </>
    );
};
