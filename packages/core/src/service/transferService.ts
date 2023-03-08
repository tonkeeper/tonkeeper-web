import {
  beginCell,
  Cell,
  CellMessage,
  CommonMessageInfo,
  ExternalMessage,
  fromNano,
  internal,
  InternalMessage,
  SendMode,
  StateInit,
  toNano,
} from 'ton-core';
import { Maybe } from 'ton-core/dist/utils/maybe';
import { sign } from 'ton-crypto';
import { WalletV4SigningMessage } from 'ton/dist/wallets/signing/WalletV4SigningMessage';

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

function createWalletTransfer(args: {
  contract: WalletContractV3R1 | WalletContractV3R2 | WalletContractV4;
  seqno: number;
  secretKey: Buffer;
  messages: InternalMessage[];
  sendMode: SendMode;
  timeout?: Maybe<number>;
}) {
  // Check number of messages
  if (args.messages.length > 4) {
    throw new Error('Maximum number of messages in a single transfer is 4');
  }
  let signingMessage = new WalletV4SigningMessage({
    timeout: args.timeout,
    walletId: args.contract.walletId,
    seqno: args.seqno,
    sendMode: args.sendMode,
    messages: args.messages,
  });
  // Sign message
  const cell = beginCell().storeWritable(signingMessage).endCell().hash();

  console.log(args.secretKey.length);

  let signature =
    args.secretKey.length != 64
      ? Buffer.from(new Uint8Array(64)) // For estimation
      : sign(cell, args.secretKey);

  // Body
  const body = beginCell()
    .storeBuffer(signature)
    .storeWritable(signingMessage)
    .endCell();

  return body;
}

const external = async (
  contract: WalletContractV3R1 | WalletContractV3R2 | WalletContractV4,
  message: Cell
) => {
  const neededInit = true;

  const ext = new ExternalMessage({
    to: contract.address,
    body: new CommonMessageInfo({
      stateInit: neededInit
        ? new StateInit({ code: contract.init.code, data: contract.init.data })
        : null,
      body: new CellMessage(message),
    }),
  });
  let boc = beginCell().storeWritable(ext).endCell().toBoc();

  return boc;
};

export const createTonTransfer = async (
  tonApi: Configuration,
  walletState: WalletState,
  recipient: RecipientData,
  amount: string,
  secretKey: Buffer = Buffer.alloc(0)
) => {
  const { seqno } = await new WalletApi(tonApi).getWalletSeqno({
    account: walletState.active.rawAddress,
  });

  const contract = getWalletContract(walletState);
  const message = createWalletTransfer({
    contract,
    seqno,
    secretKey,
    sendMode: 3,
    messages: [
      internal({
        to: recipient.toAccount.address.raw,
        bounce: recipient.toAccount.status !== 'active',
        value: toNano(fromNano(toNumberAmount(amount))),
        init: contract.init,
        body: recipient.comment
          ? beginCell()
              .storeUint(0, 32)
              .storeStringTail(recipient.comment)
              .endCell()
          : undefined,
      }),
    ],
  });

  return await external(contract, message);
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
