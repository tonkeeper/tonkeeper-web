import BigNumber from 'bignumber.js';
import { TonClient } from 'ton';
import {
  Address,
  beginCell,
  Builder,
  internal,
  SendMode,
  toNano,
} from 'ton-core';
import { mnemonicToPrivateKey } from 'ton-crypto';
import { AmountValue, RecipientData } from '../../entries/send';
import { WalletState } from '../../entries/wallet';
import { IStorage } from '../../Storage';
import {
  Configuration,
  Fee,
  JettonBalance,
  SendApi,
  WalletApi,
} from '../../tonApiV1';
import { DefaultDecimals, toNumberAmount } from '../../utils/send';
import { getWalletMnemonic } from '../menmonicService';
import {
  checkWalletBalance,
  externalMessage,
  getWalletBalance,
  walletContract,
} from './common';

const jettonTransferAmount = toNano('0.64');
const jettonTransferForwardAmount = toNano('0.0001');

const jettonTransferBody = (params: {
  queryId?: number;
  jettonAmount: bigint;
  toAddress: Address;
  responseAddress: Address;
  forwardAmount: bigint;
  forwardPayload: Builder | null;
}) => {
  return beginCell()
    .storeUint(0xf8a7ea5, 32) // request_transfer op
    .storeUint(params.queryId || 0, 64)
    .storeCoins(params.jettonAmount)
    .storeAddress(params.toAddress)
    .storeAddress(params.responseAddress)
    .storeBit(false) // null custom_payload
    .storeCoins(params.forwardAmount)
    .storeBit(false) // forward_payload in this slice, not separate cell
    .storeMaybeBuilder(params.forwardPayload)
    .endCell();
};

/**
 * @deprecated use ton api
 */
const getJettonAddress = async (
  tonClient: TonClient,
  jettonInfo: JettonBalance,
  recipient: RecipientData
) => {
  const result = await tonClient.callGetMethodWithError(
    Address.parse(jettonInfo.jettonAddress),
    'get_wallet_address',
    [
      {
        type: 'slice',
        cell: beginCell()
          .storeAddress(Address.parse(recipient.toAccount.address.raw))
          .endCell(),
      },
    ]
  );

  const jettonWalletAddress = result.stack.readAddress();

  const jettonData = await tonClient.callGetMethodWithError(
    jettonWalletAddress,
    'get_wallet_data'
  );
  if (jettonData.exit_code === 0) {
    const balance = jettonData.stack.readBigNumber();
    const owner = jettonData.stack.readAddress();
    const jettonMaster = jettonData.stack.readAddress();

    if (
      jettonMaster.toString() !==
      Address.parse(jettonInfo.jettonAddress).toString()
    ) {
      throw new Error('Jetton minter address not match');
    }
  }

  return jettonWalletAddress;
};

// export const getJettonDate = async (
//   tonApi: Configuration,
//   jettonInfo: JettonBalance,
//   recipient: RecipientData
// ) => {
//   const tonApiV2 = new ConfigurationV2({
//     ...(tonApi as any).configuration,
//   });
//   const result = await new BlockchainApi(tonApiV2).execGetMethod(
//     {
//       accountId: jettonInfo.jettonAddress,
//       methodName: 'get_jetton_data', //'get_wallet_address',
//     },
//     { method: 'GET' }
//   );

//   console.log(result);
// };

const createJettonTransfer = (
  seqno: number,
  walletState: WalletState,
  recipientAddress: string,
  data: AmountValue,
  jettonInfo: JettonBalance,
  forwardPayload: Builder | null,
  secretKey: Buffer = Buffer.alloc(64)
) => {
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
    toAddress: Address.parse(recipientAddress),
    responseAddress: Address.parse(walletState.active.rawAddress),
    forwardAmount: jettonTransferForwardAmount,
    forwardPayload,
  });

  const contract = walletContract(walletState);
  const transfer = contract.createTransfer({
    seqno,
    secretKey,
    sendMode: SendMode.PAY_GAS_SEPARATLY + SendMode.IGNORE_ERRORS,
    messages: [
      internal({
        to: Address.parse(jettonInfo.walletAddress.address),
        bounce: true,
        value: jettonTransferAmount,
        body: body,
      }),
    ],
  });

  return externalMessage(contract, seqno, transfer).toBoc();
};

export const estimateJettonTransfer = async (
  tonApi: Configuration,
  walletState: WalletState,
  recipient: RecipientData,
  data: AmountValue,
  jettonInfo: JettonBalance
) => {
  const { seqno } = await new WalletApi(tonApi).getWalletSeqno({
    account: walletState.active.rawAddress,
  });

  const cell = createJettonTransfer(
    seqno,
    walletState,
    recipient.toAccount.address.raw,
    data,
    jettonInfo,
    null
  );

  const { fee } = await new SendApi(tonApi).estimateTx({
    sendBocRequest: { boc: cell.toString('base64') },
  });
  return fee;
};

export const sendJettonTransfer = async (
  storage: IStorage,
  tonApi: Configuration,
  walletState: WalletState,
  recipient: RecipientData,
  data: AmountValue,
  jettonInfo: JettonBalance,
  fee: Fee,
  password: string
) => {
  const mnemonic = await getWalletMnemonic(
    storage,
    walletState.publicKey,
    password
  );
  const keyPair = await mnemonicToPrivateKey(mnemonic);

  const total = new BigNumber(fee.total).plus(jettonTransferAmount.toString());

  const [wallet, seqno] = await getWalletBalance(tonApi, walletState);
  checkWalletBalance(total, wallet);

  const cell = createJettonTransfer(
    seqno,
    walletState,
    recipient.toAccount.address.raw,
    data,
    jettonInfo,
    null,
    keyPair.secretKey
  );

  await new SendApi(tonApi).sendBoc({
    sendBocRequest: { boc: cell.toString('base64') },
  });
};
