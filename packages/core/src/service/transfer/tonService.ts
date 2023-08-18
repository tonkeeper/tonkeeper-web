import BigNumber from 'bignumber.js';
import { Address, Cell, internal } from 'ton-core';
import { mnemonicToPrivateKey } from 'ton-crypto';
import { IStorage } from '../../Storage';
import { AmountValue, RecipientData } from '../../entries/send';
import { TonConnectTransactionPayload } from '../../entries/tonConnect';
import { WalletState } from '../../entries/wallet';
import {
  AccountApi,
  AccountEvent,
  AccountRepr,
  Configuration,
  Fee,
  SendApi,
} from '../../tonApiV1';
import { DefaultDecimals } from '../../utils/send';
import { getWalletMnemonic } from '../menmonicService';
import { walletContractFromState } from '../wallet/contractService';
import {
  SendMode,
  checkServiceTimeOrDie,
  checkWalletBalanceOrDie,
  checkWalletPositiveBalanceOrDie,
  externalMessage,
  getWalletBalance,
  getWalletSeqNo,
} from './common';

export type AccountsMap = Map<string, AccountRepr>;

export type EstimateData = {
  accounts: AccountsMap;
  accountEvent: AccountEvent;
};

export const getAccountsMap = async (
  tonApi: Configuration,
  params: TonConnectTransactionPayload
): Promise<AccountsMap> => {
  const accounts = await Promise.all(
    params.messages.map(async (message) => {
      return [
        message.address,
        await new AccountApi(tonApi).getAccountInfo({
          account: message.address,
        }),
      ] as const;
    })
  );
  return new Map<string, AccountRepr>(accounts);
};

/*
 * Raw address is bounceable by default,
 * Please make a note that in the TonWeb Raw address is non bounceable by default
 */
const seeIfAddressBounceable = (address: string) => {
  return Address.isFriendly(address)
    ? Address.parseFriendly(address).isBounceable
    : true;
};

/*
 * Allow to send non bounceable only if address is non bounceable and target contract is non active
 */
const seeIfBounceable = (accounts: AccountsMap, address: string) => {
  const bounceableAddress = seeIfAddressBounceable(address);
  const toAccount = accounts.get(address);
  const activeContract = toAccount && toAccount.status === 'active';

  return bounceableAddress || activeContract;
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
          new BigNumber(data.amount).shiftedBy(DefaultDecimals).toString()
        ),
        body: recipient.comment != '' ? recipient.comment : undefined,
      }),
    ],
  });
  return externalMessage(contract, seqno, transfer).toBoc();
};

const createTonConnectTransfer = (
  seqno: number,
  walletState: WalletState,
  accounts: AccountsMap,
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
        bounce: seeIfBounceable(accounts, item.address),
        value: BigInt(item.amount),
        init: toStateInit(item.stateInit),
        body: item.payload ? Cell.fromBase64(item.payload) : undefined,
      })
    ),
  });
  return [
    externalMessage(contract, seqno, transfer).toBoc(),
    transfer,
  ] as const;
};

export const estimateTonTransfer = async (
  tonApi: Configuration,
  walletState: WalletState,
  recipient: RecipientData,
  data: AmountValue
) => {
  await checkServiceTimeOrDie(tonApi);
  const [wallet, seqno] = await getWalletBalance(tonApi, walletState);
  if (!data.max) {
    checkWalletPositiveBalanceOrDie(wallet);
  }

  const cell = createTonTransfer(seqno, walletState, recipient, data);

  const { fee } = await new SendApi(tonApi).estimateTx({
    sendBocRequest: { boc: cell.toString('base64') },
  });
  return fee;
};

export const estimateTonConnectTransfer = async (
  tonApi: Configuration,
  walletState: WalletState,
  accounts: AccountsMap,
  params: TonConnectTransactionPayload
) => {
  await checkServiceTimeOrDie(tonApi);
  const [wallet, seqno] = await getWalletBalance(tonApi, walletState);
  checkWalletPositiveBalanceOrDie(wallet);

  const [external] = createTonConnectTransfer(
    seqno,
    walletState,
    accounts,
    params
  );

  return await new SendApi(tonApi).estimateTx({
    sendBocRequest: { boc: external.toString('base64') },
  });
};

export const sendTonConnectTransfer = async (
  storage: IStorage,
  tonApi: Configuration,
  walletState: WalletState,
  accounts: AccountsMap,
  params: TonConnectTransactionPayload,
  password: string
) => {
  await checkServiceTimeOrDie(tonApi);
  const mnemonic = await getWalletMnemonic(
    storage,
    walletState.publicKey,
    password
  );
  const keyPair = await mnemonicToPrivateKey(mnemonic);
  const seqno = await getWalletSeqNo(tonApi, walletState.active.rawAddress);

  const [external, internal] = createTonConnectTransfer(
    seqno,
    walletState,
    accounts,
    params,
    keyPair.secretKey
  );

  await new SendApi(tonApi).sendBoc({
    sendBocRequest: { boc: external.toString('base64') },
  });

  return internal.toBoc({ idx: false }).toString('base64');
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
  await checkServiceTimeOrDie(tonApi);
  const mnemonic = await getWalletMnemonic(
    storage,
    walletState.publicKey,
    password
  );
  const keyPair = await mnemonicToPrivateKey(mnemonic);

  const total = new BigNumber(fee.total).plus(data.amount);

  const [wallet, seqno] = await getWalletBalance(tonApi, walletState);
  if (!data.max) {
    checkWalletBalanceOrDie(total, wallet);
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
