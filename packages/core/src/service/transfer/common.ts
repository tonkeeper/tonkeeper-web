import BigNumber from 'bignumber.js';
import {
  Address,
  beginCell,
  Cell,
  comment,
  external,
  internal,
  storeMessage,
  toNano,
} from 'ton-core';

import { mnemonicToPrivateKey } from 'ton-crypto';
import { WalletContractV3R1 } from 'ton/dist/wallets/WalletContractV3R1';
import { WalletContractV3R2 } from 'ton/dist/wallets/WalletContractV3R2';
import { WalletContractV4 } from 'ton/dist/wallets/WalletContractV4';
import { WalletState } from '../../entries/wallet';
import { IStorage } from '../../Storage';
import {
  AccountApi,
  AccountRepr,
  Configuration,
  Fee,
  SystemApi,
  WalletApi,
} from '../../tonApiV1';
import { getWalletMnemonic } from '../mnemonicService';
import { walletContractFromState } from '../wallet/contractService';

export enum SendMode {
  CARRY_ALL_REMAINING_BALANCE = 128,
  CARRY_ALL_REMAINING_INCOMING_VALUE = 64,
  DESTROY_ACCOUNT_IF_ZERO = 32,
  PAY_GAS_SEPARATELY = 1,
  IGNORE_ERRORS = 2,
  NONE = 0,
}

export const externalMessage = (
  contract: WalletContractV3R1 | WalletContractV3R2 | WalletContractV4,
  seqno: number,
  body: Cell
) => {
  return beginCell()
    .storeWritable(
      storeMessage(
        external({
          to: contract.address,
          init: seqno === 0 ? contract.init : undefined,
          body: body,
        })
      )
    )
    .endCell();
};

export const forwardPayloadComment = (commentValue: string) => {
  if (!commentValue) beginCell();
  return comment(commentValue).asBuilder();
};

export const seeIfBalanceError = (e: unknown): e is Error => {
  return e instanceof Error && e.message.startsWith('Not enough account');
};

export const checkWalletBalanceOrDie = (
  total: BigNumber,
  wallet: AccountRepr
) => {
  if (total.isGreaterThanOrEqualTo(wallet.balance)) {
    throw new Error(
      `Not enough account "${wallet.address.bounceable}" amount: "${
        wallet.balance
      }", transaction total: ${total.toString()}`
    );
  }
};

export const checkWalletPositiveBalanceOrDie = (wallet: AccountRepr) => {
  if (new BigNumber(wallet.balance).isLessThan(toNano('0.01').toString())) {
    throw new Error(
      `Not enough account "${wallet.address.bounceable}" amount: "${wallet.balance}"`
    );
  }
};

export const getWalletSeqNo = async (
  tonApi: Configuration,
  account: string
) => {
  const { seqno } = await new WalletApi(tonApi)
    .getWalletSeqno({
      account,
    })
    .catch(() => ({
      seqno: 0,
    }));

  return seqno;
};

export const getWalletBalance = async (
  tonApi: Configuration,
  walletState: WalletState
) => {
  const wallet = await new AccountApi(tonApi).getAccountInfo({
    account: walletState.active.rawAddress,
  });
  const seqno = await getWalletSeqNo(tonApi, walletState.active.rawAddress);

  return [wallet, seqno] as const;
};

export const seeIfServiceTimeSync = async (tonApi: Configuration) => {
  const { time } = await new SystemApi(tonApi).currentTime();
  const isSynced = Math.abs(Date.now() - time * 1000) <= 7000;

  return isSynced;
};

export const seeIfTimeError = (e: unknown): e is Error => {
  return (
    e instanceof Error && e.message.startsWith('Time and date are incorrect')
  );
};

export const checkServiceTimeOrDie = async (tonApi: Configuration) => {
  const isSynced = await seeIfServiceTimeSync(tonApi);
  if (!isSynced) {
    throw new Error('Time and date are incorrect');
  }
};

export const createTransferMessage = (
  wallet: {
    seqno: number;
    state: WalletState;
    secretKey: Buffer;
  },
  transaction: {
    to: string;
    value: string | bigint | BigNumber;
    body?: string | Cell | null;
  }
) => {
  const value =
    transaction.value instanceof BigNumber
      ? transaction.value.toFixed(0)
      : transaction.value;
  const contract = walletContractFromState(wallet.state);
  const transfer = contract.createTransfer({
    seqno: wallet.seqno,
    secretKey: wallet.secretKey,
    sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    messages: [
      internal({
        to: Address.parse(transaction.to),
        bounce: true,
        value: BigInt(value),
        body: transaction.body,
      }),
    ],
  });

  return externalMessage(contract, wallet.seqno, transfer).toBoc();
};

export async function getKeyPairAndSeqno(options: {
  storage: IStorage;
  tonApi: Configuration;
  walletState: WalletState;
  fee: Fee;
  password: string;
  amount: BigNumber;
}) {
  await checkServiceTimeOrDie(options.tonApi);
  const mnemonic = await getWalletMnemonic(
    options.storage,
    options.walletState.publicKey,
    options.password
  );
  const keyPair = await mnemonicToPrivateKey(mnemonic);

  const total = options.amount.plus(options.fee.total);

  const [wallet, seqno] = await getWalletBalance(
    options.tonApi,
    options.walletState
  );
  checkWalletBalanceOrDie(total, wallet);
  return { seqno, keyPair };
}

export async function getKeySeqno(options: {
  storage: IStorage;
  tonApi: Configuration;
  walletState: WalletState;
  fee: Fee;
  password: string;
  amount: BigNumber;
}) {
  const mnemonic = await getWalletMnemonic(
    options.storage,
    options.walletState.publicKey,
    options.password
  );
  const keyPair = await mnemonicToPrivateKey(mnemonic);

  const total = options.amount.plus(options.fee.total);

  const [wallet, seqno] = await getWalletBalance(
    options.tonApi,
    options.walletState
  );
  checkWalletBalanceOrDie(total, wallet);
  return { seqno, keyPair };
}
