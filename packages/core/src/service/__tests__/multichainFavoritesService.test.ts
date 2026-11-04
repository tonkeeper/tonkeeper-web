/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import { BLOCKCHAIN_NAME } from '../../entries/crypto';
import { FavoriteSuggestion } from '../../entries/suggestion';
import { MemoryStorage } from '../../Storage';
import {
    MultichainFavorite,
    getMultichainFavorites,
    setMultichainFavorites
} from '../multichainFavoritesService';
import { getFavoriteSuggestions, setFavoriteSuggestion } from '../suggestionService';

// A mainnet account id *is* the account's TON public key, so the multichain
// recipient list and the legacy per-publicKey suggestion list are addressed by
// the same identifier — they must not resolve to the same storage key.
const PUBLIC_KEY = 'a'.repeat(64);

const legacyFavorite: FavoriteSuggestion = {
    isFavorite: true,
    name: 'Legacy TON',
    address: 'EQlegacy',
    blockchain: BLOCKCHAIN_NAME.TON
};

const multichainFavorite: MultichainFavorite = {
    name: 'Multichain EVM',
    address: '0xabc',
    chain: 'evm'
};

describe('multichain favorites storage', () => {
    it('keeps its own namespace when the account id equals a legacy public key', async () => {
        const storage = new MemoryStorage();

        await setFavoriteSuggestion(storage, PUBLIC_KEY, [legacyFavorite]);
        await setMultichainFavorites(storage, PUBLIC_KEY, [multichainFavorite]);

        await expect(getFavoriteSuggestions(storage, PUBLIC_KEY)).resolves.toEqual([
            legacyFavorite
        ]);
        await expect(getMultichainFavorites(storage, PUBLIC_KEY)).resolves.toEqual([
            multichainFavorite
        ]);
    });

    it('reports no favorites for an account that only has legacy entries', async () => {
        const storage = new MemoryStorage();

        await setFavoriteSuggestion(storage, PUBLIC_KEY, [legacyFavorite]);

        await expect(getMultichainFavorites(storage, PUBLIC_KEY)).resolves.toEqual([]);
    });
});
