import {
  ConnectItem,
  ConnectRequest,
  TonConnectAccount,
  TonConnectTransactionPayload,
} from '@tonkeeper/core/dist/entries/tonConnect';
import {
  tonDisconnectRequest,
  tonReConnectRequest,
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import { ExtensionStorage } from '../../storage';
import memoryStore from '../../store/memoryStore';
import { getActiveTabLogo, openNotificationPopUp } from './notificationService';
import { checkDAppConnection, waitApprove } from './utils';

const storage = new ExtensionStorage();

export const tonConnectReConnect = (origin: string) =>
  tonReConnectRequest(storage, origin);

export const tonConnectDisconnect = async (id: number, webViewUrl: string) =>
  tonDisconnectRequest({ storage, webViewUrl });

const connectWithNotification = async (
  id: number,
  origin: string,
  data: ConnectRequest,
  logo: string
) => {
  memoryStore.addNotification({
    kind: 'tonConnectRequest',
    id,
    logo,
    origin,
    data,
  });

  try {
    const popupId = await openNotificationPopUp();
    const result = await waitApprove<ConnectItem[]>(id, popupId);

    return result;
  } finally {
    memoryStore.removeNotification(id);
  }
};

export const tonConnectRequest = async (
  id: number,
  origin: string,
  data: ConnectRequest
) => {
  const logo = await getActiveTabLogo();
  const isTonProof = data.items.some((item) => item.name === 'ton_proof');
  if (isTonProof) {
    return connectWithNotification(id, origin, data, logo);
  }
  const reconnect = await tonReConnectRequest(storage, origin).catch(
    () => null
  );
  if (reconnect) {
    return reconnect;
  } else {
    return connectWithNotification(id, origin, data, logo);
  }
};

export const tonConnectTransaction = async (
  id: number,
  origin: string,
  data: TonConnectTransactionPayload,
  account: TonConnectAccount | undefined
) => {
  await checkDAppConnection(storage, origin, account);

  memoryStore.addNotification({
    kind: 'tonConnectSend',
    id,
    logo: await getActiveTabLogo(),
    origin,
    data,
  });

  try {
    const popupId = await openNotificationPopUp();
    const result = await waitApprove<string>(id, popupId);
    return result;
  } finally {
    memoryStore.removeNotification(id);
  }
};
