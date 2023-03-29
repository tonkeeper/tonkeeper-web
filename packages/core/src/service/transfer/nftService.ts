import BigNumber from 'bignumber.js';
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
import {
  Configuration,
  Fee,
  NftItemRepr,
  SendApi,
  WalletApi,
} from '../../tonApiV1';
import { getWalletMnemonic } from '../menmonicService';
import {
  checkWalletBalance,
  externalMessage,
  getWalletBalance,
  walletContract,
} from './common';

const initNftTransferAmount = toNano('1');
const nftTransferForwardAmount = toNano(fromNano('1'));

const nftTransferBody = (params: {
  queryId?: number;
  newOwnerAddress: Address;
  responseAddress: Address;
  forwardAmount: bigint;
  forwardPayload: Builder | null;
}) => {
  return beginCell()
    .storeUint(0x5fcc3d14, 32) // transfer op
    .storeUint(params.queryId || 0, 64)
    .storeAddress(params.newOwnerAddress)
    .storeAddress(params.responseAddress)
    .storeBit(false) // null custom_payload
    .storeCoins(params.forwardAmount)
    .storeBit(false) // forward_payload in this slice, not separate cell
    .storeMaybeBuilder(params.forwardPayload)
    .endCell();
};

const createNftTransfer = (
  seqno: number,
  walletState: WalletState,
  recipientAddress: string,
  nftAddress: string,
  nftTransferAmount: bigint,
  forwardPayload: Builder | null = null,
  secretKey: Buffer = Buffer.alloc(64)
) => {
  const body = nftTransferBody({
    queryId: Date.now(),
    newOwnerAddress: Address.parse(recipientAddress),
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
        to: Address.parse(nftAddress),
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
  const { seqno } = await new WalletApi(tonApi)
    .getWalletSeqno({
      account: walletState.active.rawAddress,
    })
    .catch(() => ({
      seqno: 0,
    }));

  const cell = createNftTransfer(
    seqno,
    walletState,
    recipient.toAccount.address.raw,
    nftItem.address,
    initNftTransferAmount,
    null
  );

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
  fee: Fee,
  password: string
) => {
  const mnemonic = await getWalletMnemonic(
    storage,
    walletState.publicKey,
    password
  );
  const keyPair = await mnemonicToPrivateKey(mnemonic);

  const nftTransferAmount = new BigNumber(fee.deposit)
    .minus(fee.refund)
    .plus(toNano('0.05').toString());

  const total = nftTransferAmount.plus(fee.total);

  if (nftTransferAmount.isLessThanOrEqualTo(0)) {
    throw new Error(
      `Unexpected nft transfer amount: ${nftTransferAmount.toString()}`
    );
  }

  const [wallet, seqno] = await getWalletBalance(tonApi, walletState);
  checkWalletBalance(total, wallet);

  const cell = createNftTransfer(
    seqno,
    walletState,
    recipient.toAccount.address.raw,
    nftItem.address,
    BigInt(nftTransferAmount.toString()),
    null,
    keyPair.secretKey
  );

  await new SendApi(tonApi).sendBoc({
    sendBocRequest: { boc: cell.toString('base64') },
  });
};
