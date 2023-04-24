import {
  CHAIN,
  ConnectItem,
  CONNECT_EVENT_ERROR_CODES,
  TonAddressItemReply,
} from '@tonconnect/protocol';
import { AccountState } from '@tonkeeper/core/dist/entries/account';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { walletContractFromState } from '@tonkeeper/core/dist/service/wallet/contractService';
import { beginCell } from 'ton-core';
import { TonConnectError } from '../../../entries/exception';

import { ErrorCode, RuntimeError } from '../../exception';
import { TonConnectAccount } from '../../provider/tonconnect';
import { revokeAllDAppAccess } from '../../state/connectionSerivce';
import { ExtensionStorage } from '../../storage';
import {
  getConnections,
  getNetwork,
  setConnections,
} from '../../store/browserStore';
import memoryStore from '../../store/memoryStore';
import { getWalletsByOrigin } from '../walletService';
import { getActiveTabLogo, openNotificationPopUp } from './notificationService';
import {
  checkBaseDAppPermission,
  switchActiveAddress,
  waitApprove,
} from './utils';

const storage = new ExtensionStorage();

export const tonReConnectRequest = async (
  origin: string
): Promise<ConnectItem[]> => {
  const state = await storage.get<AccountState>(AppKey.account);

  if (!state || !state.activePublicKey) {
    throw new TonConnectError(
      'Missing active wallet',
      CONNECT_EVENT_ERROR_CODES.UNKNOWN_APP_ERROR
    );
  }

  const wallet = await storage.get<WalletState>(
    `${AppKey.wallet}_${state.activePublicKey}`
  );

  if (!wallet) {
    throw new TonConnectError(
      'Missing wallet state',
      CONNECT_EVENT_ERROR_CODES.UNKNOWN_APP_ERROR
    );
  }

  const network = wallet.network || Network.MAINNET;

  const contract = walletContractFromState(wallet);

  const [walletAddress] = await getWalletsByOrigin(origin, network);
  if (!walletAddress) {
    throw new RuntimeError(ErrorCode.unauthorize, 'Missing connected wallet');
  }

  const { stateInit, address } = await walletContract.createStateInit();

  const result: TonAddressItemReply = {
    name: 'ton_addr',
    address: contract.address.toString({
      urlSafe: false,
      testOnly: network !== Network.MAINNET,
    }),
    network: network.toString() as CHAIN,
    walletStateInit: beginCell()
      .storeRef(contract.init.code)
      .storeRef(contract.init.data)
      .endCell()
      .toBoc()
      .toString('base64'),
    publicKey: state.activePublicKey,
  };

  return [result];
};

const connectWithNotification = async (
  id: number,
  origin: string,
  data: TonConnectRequest,
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
    const result = await waitApprove<TonConnectItemReply[]>(id, popupId);

    return result;
  } finally {
    memoryStore.removeNotification(id);
  }
};

export const tonConnectRequest = async (
  id: number,
  origin: string,
  data: TonConnectRequest
) => {
  const logo = await getActiveTabLogo();
  const isTonProof = data.items.some((item) => item.name === 'ton_proof');
  if (isTonProof) {
    return connectWithNotification(id, origin, data, logo);
  }
  const reconnect = await tonReConnectRequest(origin).catch(() => null);
  if (reconnect) {
    return reconnect;
  } else {
    return connectWithNotification(id, origin, data, logo);
  }
};

export const tonConnectDisconnect = async (id: number, origin: string) => {
  const network = await getNetwork();
  const connections = await getConnections(network);
  await setConnections(revokeAllDAppAccess(connections, origin), network);
};

export const tonConnectTransaction = async (
  id: number,
  origin: string,
  data: TonConnectTransactionPayload,
  account: TonConnectAccount | undefined
) => {
  console.log(account);

  await checkBaseDAppPermission(origin);
  await switchActiveAddress(origin);

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
