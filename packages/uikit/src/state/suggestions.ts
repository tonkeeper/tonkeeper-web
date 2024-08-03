import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FavoriteSuggestion, LatestSuggestion } from '@tonkeeper/core/dist/entries/suggestion';
import {
    deleteFavoriteSuggestion,
    getFavoriteSuggestions,
    setFavoriteSuggestion
} from '@tonkeeper/core/dist/service/suggestionService';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import { useActiveStandardTonWallet } from './wallet';

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

export const useDeleteFavorite = () => {
    const sdk = useAppSdk();
    const wallet = useActiveStandardTonWallet();
    const queryClient = useQueryClient();

    return useMutation<void, Error, FavoriteSuggestion>(async favorite => {
        await deleteFavoriteSuggestion(sdk.storage, wallet.publicKey, favorite.address);
        await queryClient.invalidateQueries([wallet.rawAddress, QueryKey.activity, 'suggestions']);
    });
};

export const useEditFavorite = () => {
    const sdk = useAppSdk();
    const wallet = useActiveStandardTonWallet();
    const queryClient = useQueryClient();

    return useMutation<void, Error, { favorite: FavoriteSuggestion; name: string }>(
        async ({ favorite, name }) => {
            name = validateName(name);
            let items = await getFavoriteSuggestions(sdk.storage, wallet.publicKey);
            if (items.some(item => item.name === name && item.address !== favorite.address)) {
                throw new Error('Name is already taken');
            }
            items = items.map(item =>
                item.address === favorite.address
                    ? {
                          isFavorite: true,
                          address: favorite.address,
                          name,
                          blockchain: item.blockchain
                      }
                    : item
            );

            await setFavoriteSuggestion(sdk.storage, wallet.publicKey, items);
            await queryClient.invalidateQueries([
                wallet.rawAddress,
                QueryKey.activity,
                'suggestions'
            ]);
        }
    );
};

export const useAddFavorite = () => {
    const sdk = useAppSdk();
    const wallet = useActiveStandardTonWallet();
    const queryClient = useQueryClient();

    return useMutation<void, Error, { latest: LatestSuggestion; name: string }>(
        async ({ latest, name }) => {
            name = validateName(name);
            const items = await getFavoriteSuggestions(sdk.storage, wallet.publicKey);
            if (items.some(item => item.name === name)) {
                throw new Error('Name is already taken');
            }
            items.push({
                isFavorite: true,
                address: latest.address,
                name,
                blockchain: latest.blockchain
            });
            await setFavoriteSuggestion(sdk.storage, wallet.publicKey, items);
            await queryClient.invalidateQueries([
                wallet.rawAddress,
                QueryKey.activity,
                'suggestions'
            ]);
        }
    );
};
