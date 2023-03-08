import {
  beginCell,
  Cell,
  external,
  fromNano,
  internal,
  toNano,
} from 'ton-core';

import { WalletContractV3R1 } from 'ton/dist/wallets/WalletContractV3R1';
import { WalletContractV3R2 } from 'ton/dist/wallets/WalletContractV3R2';
import { WalletContractV4 } from 'ton/dist/wallets/WalletContractV4';
import { RecipientData } from '../entries/send';
import { WalletState, WalletVersion } from '../entries/wallet';
import { Configuration, SendApi, WalletApi } from '../tonApi';
import { toNumberAmount } from '../utils/send';

const workchain = 0;

export const getWalletContract = (wallet: WalletState) => {
  const publicKey = Buffer.from(wallet.publicKey, 'hex');
  switch (wallet.active.version) {
    case WalletVersion.v3R1:
      return WalletContractV3R1.create({ workchain, publicKey });
    case WalletVersion.v3R2:
      return WalletContractV3R2.create({ workchain, publicKey });
    case WalletVersion.v4R1:
      throw new Error('Unsupported wallet contract version - v4R1');
    case WalletVersion.v4R2:
      return WalletContractV4.create({ workchain, publicKey });
  }
};

export const externalMessage = (
  contract: WalletContractV3R1 | WalletContractV3R2 | WalletContractV4,
  seqno: number,
  body: Cell
) => {
  return beginCell()
    .storeWritable(
      external({
        to: contract.address,
        init: seqno === 0 ? contract.init : undefined,
        body: body,
      })
    )
    .endCell();
};

const createTonTransfer = async (
  tonApi: Configuration,
  walletState: WalletState,
  recipient: RecipientData,
  amount: string,
  secretKey: Buffer = Buffer.alloc(64)
) => {
  const { seqno } = await new WalletApi(tonApi).getWalletSeqno({
    account: walletState.active.rawAddress,
  });

  const contract = getWalletContract(walletState);
  const transfer = contract.createTransfer({
    seqno,
    secretKey,
    sendMode: 3,
    messages: [
      internal({
        to: recipient.toAccount.address.raw,
        bounce: recipient.toAccount.status !== 'active',
        value: toNano(fromNano(toNumberAmount(amount))),
        body: recipient.comment ?? undefined,
      }),
    ],
  });
  return externalMessage(contract, seqno, transfer).toBoc();
};

export const estimateTonTransfer = async (
  tonApi: Configuration,
  walletState: WalletState,
  recipient: RecipientData,
  amount: string
) => {
  const cell = await createTonTransfer(tonApi, walletState, recipient, amount);
  const { fee } = await new SendApi(tonApi).estimateTx({
    sendBocRequest: { boc: cell.toString('base64') },
  });
  return fee;
};
