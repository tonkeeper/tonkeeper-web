import { IAppSdk } from '../AppSdk';
import { BLOCKCHAIN_NAME } from '../entries/crypto';
import { FavoriteSuggestion, LatestSuggestion } from '../entries/suggestion';
import { WalletState } from '../entries/wallet';
import { AppKey } from '../Keys';
import { IStorage } from '../Storage';
import { AccountsApi, Configuration } from '../tonApiV2';
import { Configuration as ConfigurationTron, TronApi } from '../tronApi';

export const getHiddenSuggestions = async (storage: IStorage, publicKey: string) => {
    const result = await storage.get<string[]>(`${AppKey.HIDDEN_SUGGESTIONS}_${publicKey}`);
    return result ?? [];
};

export const hideSuggestions = async (storage: IStorage, publicKey: string, address: string) => {
    const items = await getHiddenSuggestions(storage, publicKey);
    items.push(address);
    await storage.set(`${AppKey.HIDDEN_SUGGESTIONS}_${publicKey}`, items);
};

export const getFavoriteSuggestions = async (storage: IStorage, publicKey: string) => {
    const result = await storage.get<FavoriteSuggestion[]>(`${AppKey.FAVOURITES}_${publicKey}`);
    return result ?? [];
};

export const setFavoriteSuggestion = async (
    storage: IStorage,
    publicKey: string,
    items: FavoriteSuggestion[]
) => {
    await storage.set(`${AppKey.FAVOURITES}_${publicKey}`, items);
};

export const deleteFavoriteSuggestion = async (
    storage: IStorage,
    publicKey: string,
    address: string
) => {
    let items = await getFavoriteSuggestions(storage, publicKey);
    items = items.filter(item => item.address !== address);
    storage.set(`${AppKey.FAVOURITES}_${publicKey}`, items);
};

export const getSuggestionsList = async (
    sdk: IAppSdk,
    tonApiV2: Configuration,
    tronApi: ConfigurationTron,
    wallet: WalletState
) => {
    const items = await new AccountsApi(tonApiV2).getAccountEvents({
        accountId: wallet.active.rawAddress,
        limit: 100
    });

    const favorites = await getFavoriteSuggestions(sdk.storage, wallet.publicKey);
    const hidden = await getHiddenSuggestions(sdk.storage, wallet.publicKey);

    const list = [] as LatestSuggestion[];

    const seeIfAddressIsAdded = (address: string) => {
        if ([...favorites, ...list].some(item => item.address === address)) return true;
        if (hidden.some(item => item === address)) return true;
        return false;
    };

    items.events.forEach(event => {
        const tonTransferEvent = event.actions.every(item => item.type === 'TonTransfer');
        if (!tonTransferEvent) return;

        const recipient = event.actions.find(
            item => item.tonTransfer?.recipient.address !== wallet.active.rawAddress
        );
        if (!recipient) return;

        const address = recipient.tonTransfer!.recipient.address;

        if (seeIfAddressIsAdded(address)) return;

        list.push({
            isFavorite: false,
            timestamp: event.timestamp * 1000,
            address
        });
    });

    if (wallet.tron) {
        const tronItems = await new TronApi(tronApi).getTransactions({
            ownerAddress: wallet.tron.ownerWalletAddress,
            limit: 100
        });

        tronItems.events.forEach(event => {
            event.actions.forEach(({ sendTRC20 }) => {
                if (sendTRC20 && !seeIfAddressIsAdded(sendTRC20.recipient)) {
                    list.push({
                        isFavorite: false,
                        timestamp: event.timestamp,
                        address: sendTRC20.recipient,
                        blockchain: BLOCKCHAIN_NAME.TRON
                    });
                }
            });
        });
    }

    return [...favorites, ...list.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10)];
};
