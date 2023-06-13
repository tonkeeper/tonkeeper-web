import BigNumber from 'bignumber.js';
import { Address, beginCell, Cell, comment, internal, toNano } from 'ton-core';
import { mnemonicToPrivateKey } from 'ton-crypto';
import { RecipientData } from '../../entries/send';
import { WalletState } from '../../entries/wallet';
import { IStorage } from '../../Storage';
import { Configuration, Fee, NftItemRepr, SendApi } from '../../tonApiV1';
import { getWalletMnemonic } from '../menmonicService';
import { walletContractFromState } from '../wallet/contractService';
import {
  checkServiceTimeOrDie,
  checkWalletBalanceOrDie,
  checkWalletPositiveBalanceOrDie,
  externalMessage,
  getWalletBalance,
  SendMode, createTransferMessage,
} from './common';

const initNftTransferAmount = toNano('1');
const secondNftTransferAmount = toNano('0.05');
const nftTransferForwardAmount = BigInt('1');

const nftTransferBody = (params: {
  queryId?: number;
  newOwnerAddress: Address;
  responseAddress: Address;
  forwardAmount: bigint;
  forwardPayload: Cell | null;
}) => {
  return beginCell()
    .storeUint(0x5fcc3d14, 32) // transfer op
    .storeUint(params.queryId || 0, 64)
    .storeAddress(params.newOwnerAddress)
    .storeAddress(params.responseAddress)
    .storeBit(false) // null custom_payload
    .storeCoins(params.forwardAmount)
    .storeBit(params.forwardPayload != null) // forward_payload in this slice - false, separate cell - true
    .storeMaybeRef(params.forwardPayload)
    .endCell();
};

const createNftTransfer = (
  seqno: number,
  walletState: WalletState,
  recipientAddress: string,
  nftAddress: string,
  nftTransferAmount: bigint,
  forwardPayload: Cell | null = null,
  secretKey: Buffer = Buffer.alloc(64)
) => {
  const body = nftTransferBody({
    queryId: Date.now(),
    newOwnerAddress: Address.parse(recipientAddress),
    responseAddress: Address.parse(walletState.active.rawAddress),
    forwardAmount: nftTransferForwardAmount,
    forwardPayload,
  });

  return createTransferMessage({ seqno, state: walletState, secretKey }, { to: nftAddress, value: nftTransferAmount, body })
};

export const estimateNftTransfer = async (
  tonApi: Configuration,
  walletState: WalletState,
  recipient: RecipientData,
  nftItem: NftItemRepr
) => {
  await checkServiceTimeOrDie(tonApi);
  const [wallet, seqno] = await getWalletBalance(tonApi, walletState);
  checkWalletPositiveBalanceOrDie(wallet);

  const cell = createNftTransfer(
    seqno,
    walletState,
    recipient.toAccount.address.raw,
    nftItem.address,
    initNftTransferAmount,
    recipient.comment ? comment(recipient.comment) : null
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
  await checkServiceTimeOrDie(tonApi);
  const mnemonic = await getWalletMnemonic(
    storage,
    walletState.publicKey,
    password
  );
  const keyPair = await mnemonicToPrivateKey(mnemonic);

  const min = toNano('0.05').toString();
  let nftTransferAmount = new BigNumber(fee.deposit)
    .minus(fee.refund)
    .plus(min);

  nftTransferAmount = nftTransferAmount.isLessThan(min)
    ? new BigNumber(min)
    : nftTransferAmount;

  const total = nftTransferAmount.plus(fee.total);

  if (nftTransferAmount.isLessThanOrEqualTo(0)) {
    throw new Error(
      `Unexpected nft transfer amount: ${nftTransferAmount.toString()}`
    );
  }

  const [wallet, seqno] = await getWalletBalance(tonApi, walletState);
  checkWalletBalanceOrDie(total, wallet);

  const cell = createNftTransfer(
    seqno,
    walletState,
    recipient.toAccount.address.raw,
    nftItem.address,
    BigInt(nftTransferAmount.toString()),
    recipient.comment ? comment(recipient.comment) : null,
    keyPair.secretKey
  );

  await new SendApi(tonApi).sendBoc({
    sendBocRequest: { boc: cell.toString('base64') },
  });
};

export const sendNftRenew = async (options: {
                                     storage: IStorage,
                                     tonApi: Configuration,
                                     walletState: WalletState,
                                     nftAddress: string,
                                     fee: Fee,
                                     password: string
                                   }) => {
  await checkServiceTimeOrDie(options.tonApi);
  const mnemonic = await getWalletMnemonic(
      options.storage,
      options.walletState.publicKey,
      options.password
  );
  const keyPair = await mnemonicToPrivateKey(mnemonic);

  const nftRenewAmount = new BigNumber(toNano('0.01').toString());
  const total = nftRenewAmount.plus(options.fee.total);

  const [wallet, seqno] = await getWalletBalance(options.tonApi, options.walletState);
  checkWalletBalanceOrDie(total, wallet);

  const cell = createTransferMessage({
     seqno,
      state: options.walletState,
      secretKey: keyPair.secretKey
    }, { to: options.nftAddress, value: nftRenewAmount });

  await new SendApi(options.tonApi).sendBoc({
    sendBocRequest: { boc: cell.toString('base64') },
  });
};
