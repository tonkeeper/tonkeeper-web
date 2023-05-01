import BigNumber from 'bignumber.js';
import { Address, Cell, fromNano, internal, toNano } from 'ton-core';
import { mnemonicToPrivateKey } from 'ton-crypto';
import { AmountValue, RecipientData } from '../../entries/send';
import { TonConnectTransactionPayload } from '../../entries/tonConnect';
import { WalletState } from '../../entries/wallet';
import { IStorage } from '../../Storage';
import { Configuration, Fee, SendApi, WalletApi } from '../../tonApiV1';
import { DefaultDecimals } from '../../utils/send';
import { getWalletMnemonic } from '../menmonicService';
import { walletContractFromState } from '../wallet/contractService';
import {
  checkWalletBalance,
  externalMessage,
  getWalletBalance,
  SendMode,
} from './common';

const seeIfBounceable = (address: string) => {
  return Address.isFriendly(address)
    ? Address.parseFriendly(address).isBounceable
    : false;
};

const toStateInit = (
  stateInit?: string
): { code: Cell; data: Cell } | undefined => {
  if (!stateInit) {
    return undefined;
  }
  const initSlice = Cell.fromBase64(stateInit).asSlice();
  return {
    code: initSlice.loadRef(),
    data: initSlice.loadRef(),
  };
};

const createTonTransfer = (
  seqno: number,
  walletState: WalletState,
  recipient: RecipientData,
  data: AmountValue,
  secretKey: Buffer = Buffer.alloc(64)
) => {
  const contract = walletContractFromState(walletState);
  const transfer = contract.createTransfer({
    seqno,
    secretKey,
    sendMode: data.max
      ? SendMode.CARRY_ALL_REMAINING_BALANCE
      : SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    messages: [
      internal({
        to: recipient.toAccount.address.raw,
        bounce: recipient.toAccount.status == 'active',
        value: BigInt(
          new BigNumber(data.amount)
            .multipliedBy(Math.pow(10, DefaultDecimals))
            .toString()
        ),
        body: recipient.comment ?? undefined,
      }),
    ],
  });
  return externalMessage(contract, seqno, transfer).toBoc();
};

const createTonConnectTransfer = (
  seqno: number,
  walletState: WalletState,
  params: TonConnectTransactionPayload,
  secretKey: Buffer = Buffer.alloc(64)
) => {
  const contract = walletContractFromState(walletState);

  const transfer = contract.createTransfer({
    seqno,
    secretKey,
    sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    messages: params.messages.map((item) =>
      internal({
        to: item.address,
        bounce: seeIfBounceable(item.address),
        value: toNano(fromNano(item.amount)),
        init: toStateInit(item.stateInit),
        body: item.payload ? Cell.fromBase64(item.payload) : undefined,
      })
    ),
  });
  return externalMessage(contract, seqno, transfer).toBoc();
};

export const estimateTonTransfer = async (
  tonApi: Configuration,
  walletState: WalletState,
  recipient: RecipientData,
  data: AmountValue
) => {
  const { seqno } = await new WalletApi(tonApi)
    .getWalletSeqno({
      account: walletState.active.rawAddress,
    })
    .catch(() => ({
      seqno: 0,
    }));

  const cell = createTonTransfer(seqno, walletState, recipient, data);

  const { fee } = await new SendApi(tonApi).estimateTx({
    sendBocRequest: { boc: cell.toString('base64') },
  });
  return fee;
};

export const estimateTonConnectTransfer = async (
  tonApi: Configuration,
  walletState: WalletState,
  params: TonConnectTransactionPayload
) => {
  const { seqno } = await new WalletApi(tonApi)
    .getWalletSeqno({
      account: walletState.active.rawAddress,
    })
    .catch(() => ({
      seqno: 0,
    }));

  const cell = createTonConnectTransfer(seqno, walletState, params);

  return await new SendApi(tonApi).estimateTx({
    sendBocRequest: { boc: cell.toString('base64') },
  });
};

export const sendTonConnectTransfer = async (
  storage: IStorage,
  tonApi: Configuration,
  walletState: WalletState,
  params: TonConnectTransactionPayload,
  password: string
) => {
  const mnemonic = await getWalletMnemonic(
    storage,
    walletState.publicKey,
    password
  );
  const keyPair = await mnemonicToPrivateKey(mnemonic);

  const { seqno } = await new WalletApi(tonApi)
    .getWalletSeqno({
      account: walletState.active.rawAddress,
    })
    .catch(() => ({
      seqno: 0,
    }));

  const cell = createTonConnectTransfer(
    seqno,
    walletState,
    params,
    keyPair.secretKey
  );

  await new SendApi(tonApi).sendBoc({
    sendBocRequest: { boc: cell.toString('base64') },
  });
};

export const sendTonTransfer = async (
  storage: IStorage,
  tonApi: Configuration,
  walletState: WalletState,
  recipient: RecipientData,
  data: AmountValue,
  fee: Fee,
  password: string
) => {
  const mnemonic = await getWalletMnemonic(
    storage,
    walletState.publicKey,
    password
  );
  const keyPair = await mnemonicToPrivateKey(mnemonic);

  const total = new BigNumber(fee.total).plus(
    toNano(data.amount.toString()).toString()
  );

  const [wallet, seqno] = await getWalletBalance(tonApi, walletState);
  if (!data.max) {
    checkWalletBalance(total, wallet);
  }

  const cell = createTonTransfer(
    seqno,
    walletState,
    recipient,
    data,
    keyPair.secretKey
  );

  await new SendApi(tonApi).sendBoc({
    sendBocRequest: { boc: cell.toString('base64') },
  });
};
