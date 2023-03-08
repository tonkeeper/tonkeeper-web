import { Suggestion } from '../entries/suggestion';
import { WalletState } from '../entries/wallet';
import { Configuration, EventApi } from '../tonApiV1';

export const getSuggestionsList = async (
  tonApi: Configuration,
  wallet: WalletState
) => {
  const items = await new EventApi(tonApi).accountEvents({
    account: wallet.active.rawAddress,
    limit: 100,
  });

  const list = [] as Suggestion[];

  items.events.forEach((event) => {
    event.timestamp;
    const tonTransferEvent = event.actions.every(
      (item) => item.type === 'TonTransfer'
    );
    if (!tonTransferEvent) return;

    const recipient = event.actions.find(
      (item) => item.tonTransfer?.recipient.address !== wallet.active.rawAddress
    );
    if (!recipient) return;

    const address = recipient.tonTransfer!.recipient.address;

    if (list.some((item) => item.address === address)) return;

    list.push({
      isFavorite: false,
      timestamp: event.timestamp,
      address,
    });
  });

  return list.slice(0, 10);
};
