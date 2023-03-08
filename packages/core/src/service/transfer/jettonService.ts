import BigNumber from 'bignumber.js';
import {
  Address,
  beginCell,
  Builder,
  internal,
  SendMode,
  toNano,
} from 'ton-core';
import { AmountValue, RecipientData } from '../../entries/send';
import { WalletState } from '../../entries/wallet';
import { JettonBalance } from '../../tonApiV1';
import { DefaultDecimals, toNumberAmount } from '../../utils/send';
import { externalMessage, walletContract } from './common';

export const jettonTransferForwardAmount = toNano('0.64');

const jettonTransferBody = (params: {
  queryId?: number;
  jettonAmount: bigint;
  toAddress: Address;
  responseAddress: Address;
  forwardAmount: bigint;
  forwardPayload: Builder;
}) => {
  return beginCell()
    .storeUint(0xf8a7ea5, 32) // request_transfer op
    .storeUint(params.queryId || 0, 64)
    .storeCoins(params.jettonAmount)
    .storeAddress(params.toAddress)
    .storeAddress(params.responseAddress)
    .storeBit(false) // null custom_payload
    .storeCoins(params.forwardAmount || 0)
    .storeBit(true) // forward_payload in this slice, not separate cell
    .storeBuilder(params.forwardPayload)
    .endCell();
};

const createJettonTransfer = (
  seqno: number,
  walletState: WalletState,
  recipient: RecipientData,
  data: AmountValue,
  jettonInfo: JettonBalance,
  secretKey: Buffer = Buffer.alloc(64)
) => {
  const payloadCell = beginCell()
    .storeUint(0, 32)
    .storeStringTail(recipient.comment);

  const jettonAmount = data.max
    ? BigInt(jettonInfo.balance)
    : BigInt(
        new BigNumber(toNumberAmount(data.amount))
          .multipliedBy(
            Math.pow(10, jettonInfo.metadata?.decimals ?? DefaultDecimals)
          )
          .toString()
      );

  const body = jettonTransferBody({
    queryId: Date.now(),
    jettonAmount,
    toAddress: Address.parse(recipient.toAccount.address.raw),
    responseAddress: Address.parse(walletState.active.rawAddress),
    forwardAmount: toNano('0.0001'),
    forwardPayload: payloadCell,
  });

  const jettonWalletAddress = Address.parse('123');

  const contract = walletContract(walletState);
  const transfer = contract.createTransfer({
    seqno,
    secretKey,
    sendMode: SendMode.PAY_GAS_SEPARATLY + SendMode.IGNORE_ERRORS,
    messages: [
      internal({
        to: jettonWalletAddress,
        bounce: recipient.toAccount.status !== 'active',
        value: jettonTransferForwardAmount,
        body: body,
      }),
    ],
  });

  return externalMessage(contract, seqno, transfer).toBoc();
};
