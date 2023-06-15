import BigNumber from 'bignumber.js';
import { Address, beginCell, Cell, comment, toNano } from 'ton-core';
import { mnemonicToPrivateKey } from 'ton-crypto';
import { RecipientData } from '../../entries/send';
import { WalletState } from '../../entries/wallet';
import { IStorage } from '../../Storage';
import { Configuration, Fee, NftItemRepr, SendApi } from '../../tonApiV1';
import { getWalletMnemonic } from '../menmonicService';
import {
  checkServiceTimeOrDie,
  checkWalletBalanceOrDie,
  checkWalletPositiveBalanceOrDie,
  createTransferMessage, getKeyPairAndSeqno,
  getWalletBalance,
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

const nftRenewBody = (params?: { queryId?: number }) => {
  return beginCell()
    .storeUint(0x4eb1f0f9, 32) // op::change_dns_record,
    .storeUint(params?.queryId || 0, 64)
    .storeUint(0, 256)
    .endCell();
};

const nftLinkBody = (params: { queryId?: number, linkToAddress: string }) => {
  const addressToDNSAddressFormat = (address: string) => beginCell()
        .storeUint(0x9fd3, 16)
        .storeAddress(Address.parse(address))
        .storeUint(0, 8);

  return beginCell()
      .storeUint(0x4eb1f0f9, 32) // op::change_dns_record,
      .storeUint(params?.queryId || 0, 64)
      .storeUint(BigInt('0xe8d44050873dba865aa7c170ab4cce64d90839a34dcfd6cf71d14e0205443b1b'), 256) // DNS_CATEGORY_WALLET
      .storeRef(addressToDNSAddressFormat(params.linkToAddress))
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

  return createTransferMessage(
    { seqno, state: walletState, secretKey },
    { to: nftAddress, value: nftTransferAmount, body }
  );
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
  storage: IStorage;
  tonApi: Configuration;
  walletState: WalletState;
  nftAddress: string;
  fee: Fee;
  password: string;
  amount: BigNumber;
}) => {
  const { seqno, keyPair } = await getKeyPairAndSeqno(options);

  const body = nftRenewBody();

  const cell = createTransferMessage(
    {
      seqno,
      state: options.walletState,
      secretKey: keyPair.secretKey,
    },
    { to: options.nftAddress, value: options.amount, body }
  );

  await new SendApi(options.tonApi).sendBoc({
    sendBocRequest: { boc: cell.toString('base64') },
  });
};

export const estimateNftRenew = async (options: {
  tonApi: Configuration;
  walletState: WalletState;
  nftAddress: string;
  amount: BigNumber;
}) => {
  await checkServiceTimeOrDie(options.tonApi);
  const [wallet, seqno] = await getWalletBalance(
    options.tonApi,
    options.walletState
  );
  checkWalletPositiveBalanceOrDie(wallet);

  const body = nftRenewBody();

  const cell = createTransferMessage(
    {
      seqno,
      state: options.walletState,
      secretKey: Buffer.alloc(64),
    },
    { to: options.nftAddress, value: options.amount, body }
  );

  return cell.toString('base64');
};

export const sendNftLink = async (options: {
  storage: IStorage;
  tonApi: Configuration;
  walletState: WalletState;
  nftAddress: string;
  linkToAddress: string;
  fee: Fee;
  password: string;
  amount: BigNumber;
}) => {
  const { seqno, keyPair } = await getKeyPairAndSeqno(options);

  const body = nftLinkBody(options);

  const cell = createTransferMessage(
      {
        seqno,
        state: options.walletState,
        secretKey: keyPair.secretKey,
      },
      { to: options.nftAddress, value: options.amount, body }
  );

  await new SendApi(options.tonApi).sendBoc({
    sendBocRequest: { boc: cell.toString('base64') },
  });
};

export const estimateNftLink = async (options: {
  tonApi: Configuration;
  walletState: WalletState;
  nftAddress: string;
  linkToAddress: string;
  amount: BigNumber;
}) => {
  await checkServiceTimeOrDie(options.tonApi);
  const [wallet, seqno] = await getWalletBalance(
      options.tonApi,
      options.walletState
  );
  checkWalletPositiveBalanceOrDie(wallet);

  const body = nftLinkBody(options);

  const cell = createTransferMessage(
      {
        seqno,
        state: options.walletState,
        secretKey: Buffer.alloc(64),
      },
      { to: options.nftAddress, value: options.amount, body }
  );

  return cell.toString('base64');
};
