import { IAppSdk } from '../AppSdk';
import { FavoriteSuggestion, Suggestion } from '../entries/suggestion';
import { WalletState } from '../entries/wallet';
import { AppKey } from '../Keys';
import { IStorage } from '../Storage';
import { Configuration, EventApi } from '../tonApiV1';

export const getHiddenSuggestions = async (
  storage: IStorage,
  publicKey: string
) => {
  const result = await storage.get<string[]>(
    `${AppKey.hiddenSuggestions}_${publicKey}`
  );
  return result ?? [];
};

export const hideSuggestions = async (
  storage: IStorage,
  publicKey: string,
  address: string
) => {
  const items = await getHiddenSuggestions(storage, publicKey);
  items.push(address);
  await storage.set(`${AppKey.hiddenSuggestions}_${publicKey}`, items);
};

export const getFavoriteSuggestions = async (
  storage: IStorage,
  publicKey: string
) => {
  const result = await storage.get<FavoriteSuggestion[]>(
    `${AppKey.favorites}_${publicKey}`
  );
  return result ?? [];
};

export const setFavoriteSuggestion = async (
  storage: IStorage,
  publicKey: string,
  items: FavoriteSuggestion[]
) => {
  await storage.set(`${AppKey.favorites}_${publicKey}`, items);
};

export const deleteFavoriteSuggestion = async (
  storage: IStorage,
  publicKey: string,
  address: string
) => {
  let items = await getFavoriteSuggestions(storage, publicKey);
  items = items.filter((item) => item.address !== address);
  storage.set(`${AppKey.favorites}_${publicKey}`, items);
};

export const getSuggestionsList = async (
  sdk: IAppSdk,
  tonApi: Configuration,
  wallet: WalletState
) => {
  const items = await new EventApi(tonApi).accountEvents({
    account: wallet.active.rawAddress,
    limit: 100,
  });

  const favorites = await getFavoriteSuggestions(sdk.storage, wallet.publicKey);
  const hidden = await getHiddenSuggestions(sdk.storage, wallet.publicKey);
  const list = [] as Suggestion[];

  items.events.forEach((event) => {
    const tonTransferEvent = event.actions.every(
      (item) => item.type === 'TonTransfer'
    );
    if (!tonTransferEvent) return;

    const recipient = event.actions.find(
      (item) => item.tonTransfer?.recipient.address !== wallet.active.rawAddress
    );
    if (!recipient) return;

    const address = recipient.tonTransfer!.recipient.address;

    if (list.concat(favorites).some((item) => item.address === address)) return;
    if (hidden.some((item) => item === address)) return;

    list.push({
      isFavorite: false,
      timestamp: event.timestamp,
      address,
    });
  });

  return [...favorites, ...list.slice(0, 10)];
};
