import {
  Address,
  beginCell,
  Builder,
  fromNano,
  internal,
  SendMode,
  toNano,
} from 'ton-core';
import { mnemonicToPrivateKey } from 'ton-crypto';
import { RecipientData } from '../../entries/send';
import { WalletState } from '../../entries/wallet';
import { IStorage } from '../../Storage';
import { Configuration, NftItemRepr, SendApi, WalletApi } from '../../tonApiV1';
import { getWalletMnemonic } from '../menmonicService';
import {
  externalMessage,
  forwardPayloadComment,
  walletContract,
} from './common';

const nftTransferAmount = toNano('1');
const nftTransferForwardAmount = toNano(fromNano('1'));

const nftTransferBody = (params: {
  queryId?: number;
  newOwnerAddress: Address;
  responseAddress: Address;
  forwardAmount: bigint;
  forwardPayload: Builder;
}) => {
  return beginCell()
    .storeUint(0x5fcc3d14, 32) // transfer op
    .storeUint(params.queryId || 0, 64)
    .storeAddress(params.newOwnerAddress)
    .storeAddress(params.responseAddress)
    .storeBit(false) // null custom_payload
    .storeCoins(params.forwardAmount)
    .storeBit(false) // forward_payload in this slice, not separate cell
    .storeBuilder(params.forwardPayload)
    .endCell();
};

export const createNftTransfer = (
  seqno: number,
  walletState: WalletState,
  recipient: RecipientData,
  nftItem: NftItemRepr,
  secretKey: Buffer = Buffer.alloc(64)
) => {
  const forwardPayload = forwardPayloadComment(recipient.comment);

  const body = nftTransferBody({
    queryId: Date.now(),
    newOwnerAddress: Address.parse(recipient.toAccount.address.raw),
    responseAddress: Address.parse(walletState.active.rawAddress),
    forwardAmount: nftTransferForwardAmount,
    forwardPayload,
  });

  const contract = walletContract(walletState);
  const transfer = contract.createTransfer({
    seqno,
    secretKey,
    sendMode: SendMode.PAY_GAS_SEPARATLY + SendMode.IGNORE_ERRORS,
    messages: [
      internal({
        to: Address.parse(nftItem.address),
        bounce: true,
        value: nftTransferAmount,
        body: body,
      }),
    ],
  });

  return externalMessage(contract, seqno, transfer).toBoc();
};

export const estimateNftTransfer = async (
  tonApi: Configuration,
  walletState: WalletState,
  recipient: RecipientData,
  nftItem: NftItemRepr
) => {
  const { seqno } = await new WalletApi(tonApi).getWalletSeqno({
    account: walletState.active.rawAddress,
  });
  const cell = createNftTransfer(seqno, walletState, recipient, nftItem);

  const { fee } = await new SendApi(tonApi).estimateTx({
    sendBocRequest: { boc: cell.toString('base64') },
  });
  return fee;
};

export const sendNftTransfer = async (
  storage: IStorage,
  tonApi: Configuration,
  walletState: WalletState,
  recipient: RecipientData,
  nftItem: NftItemRepr,
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
  const cell = createNftTransfer(
    seqno,
    walletState,
    recipient,
    nftItem,
    keyPair.secretKey
  );

  await new SendApi(tonApi).sendBoc({
    sendBocRequest: { boc: cell.toString('base64') },
  });
};
