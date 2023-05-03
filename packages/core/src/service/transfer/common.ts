import BigNumber from 'bignumber.js';
import { beginCell, Cell, comment, external, storeMessage } from 'ton-core';

import { WalletContractV3R1 } from 'ton/dist/wallets/WalletContractV3R1';
import { WalletContractV3R2 } from 'ton/dist/wallets/WalletContractV3R2';
import { WalletContractV4 } from 'ton/dist/wallets/WalletContractV4';
import { WalletState } from '../../entries/wallet';
import {
  AccountApi,
  AccountRepr,
  Configuration,
  WalletApi,
} from '../../tonApiV1';

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

export const checkWalletBalance = (total: BigNumber, wallet: AccountRepr) => {
  if (total.isGreaterThanOrEqualTo(wallet.balance)) {
    throw new Error(
      `Not enough account "${wallet.address}" amount: "${
        wallet.balance
      }", transaction total: ${total.toString()}`
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
