import { AppKey } from '../Keys';
import { IStorage } from '../Storage';
import { ChainId } from '../chains/types';

/**
 * Saved send-flow recipient of a multichain account, tagged with the chain
 * family the address belongs to. Stored under its own key namespace
 * (`MULTICHAIN_FAVORITE_RECIPIENTS_<accountId>`) rather than the legacy
 * `FAVOURITES_<publicKey>`: a mainnet account id is the account's TON
 * public key, so sharing the prefix would make both services read and
 * overwrite one list holding two incompatible shapes.
 */
export interface MultichainFavorite {
    address: string;
    name: string;
    chain: ChainId;
}

const favoritesKey = (accountId: string) => `${AppKey.MULTICHAIN_FAVORITE_RECIPIENTS}_${accountId}`;

export const getMultichainFavorites = async (
    storage: IStorage,
    accountId: string
): Promise<MultichainFavorite[]> => {
    const result = await storage.get<MultichainFavorite[]>(favoritesKey(accountId));
    return result ?? [];
};

export const setMultichainFavorites = async (
    storage: IStorage,
    accountId: string,
    items: MultichainFavorite[]
): Promise<void> => {
    await storage.set(favoritesKey(accountId), items);
};
