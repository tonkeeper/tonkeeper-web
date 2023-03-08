import { fromNano, internal, SendMode, toNano } from 'ton-core';
import { mnemonicToPrivateKey } from 'ton-crypto';
import { AmountValue, RecipientData } from '../../entries/send';
import { WalletState } from '../../entries/wallet';
import { IStorage } from '../../Storage';
import { Configuration, SendApi, WalletApi } from '../../tonApiV1';
import { toNumberAmount } from '../../utils/send';
import { getWalletMnemonic } from '../menmonicService';
import { externalMessage, walletContract } from './common';

const createTonTransfer = (
  seqno: number,
  walletState: WalletState,
  recipient: RecipientData,
  data: AmountValue,
  secretKey: Buffer = Buffer.alloc(64)
) => {
  const contract = walletContract(walletState);
  const transfer = contract.createTransfer({
    seqno,
    secretKey,
    sendMode: data.max
      ? SendMode.CARRRY_ALL_REMAINING_BALANCE
      : SendMode.PAY_GAS_SEPARATLY + SendMode.IGNORE_ERRORS,
    messages: [
      internal({
        to: recipient.toAccount.address.raw,
        bounce: recipient.toAccount.status !== 'active',
        value: toNano(fromNano(toNumberAmount(data.amount))),
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
  data: AmountValue
) => {
  const { seqno } = await new WalletApi(tonApi).getWalletSeqno({
    account: walletState.active.rawAddress,
  });
  const cell = createTonTransfer(seqno, walletState, recipient, data);

  const { fee } = await new SendApi(tonApi).estimateTx({
    sendBocRequest: { boc: cell.toString('base64') },
  });
  return fee;
};

export const sendTonTransfer = async (
  storage: IStorage,
  tonApi: Configuration,
  walletState: WalletState,
  recipient: RecipientData,
  data: AmountValue,
  password: string
) => {
  const mnemonic = await getWalletMnemonic(
    storage,
    walletState.publicKey,
    password
  );
  const keyPair = await mnemonicToPrivateKey(mnemonic);

  const { seqno } = await new WalletApi(tonApi).getWalletSeqno({
    account: walletState.active.rawAddress,
  });
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
