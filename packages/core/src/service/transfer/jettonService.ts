import BigNumber from 'bignumber.js';
import { Address, beginCell, Cell, comment, internal, toNano } from 'ton-core';
import { mnemonicToPrivateKey } from 'ton-crypto';
import { AmountValue, RecipientData, TonRecipientData } from '../../entries/send';
import { WalletState } from '../../entries/wallet';
import { IStorage } from '../../Storage';
import { Configuration, Fee, JettonBalance, SendApi } from '../../tonApiV1';
import { getWalletMnemonic } from '../mnemonicService';
import { walletContractFromState } from '../wallet/contractService';
import {
    checkServiceTimeOrDie,
    checkWalletBalanceOrDie,
    checkWalletPositiveBalanceOrDie,
    externalMessage,
    getWalletBalance,
    SendMode
} from './common';
import { AssetAmount } from '../../entries/crypto/asset/asset-amount';
import { TonAsset } from '../../entries/crypto/asset/ton-asset';

const jettonTransferAmount = toNano('0.64');
const jettonTransferForwardAmount = BigInt('1');

const jettonTransferBody = (params: {
    queryId?: number;
    jettonAmount: bigint;
    toAddress: Address;
    responseAddress: Address;
    forwardAmount: bigint;
    forwardPayload: Cell | null;
}) => {
    return beginCell()
        .storeUint(0xf8a7ea5, 32) // request_transfer op
        .storeUint(params.queryId || 0, 64)
        .storeCoins(params.jettonAmount)
        .storeAddress(params.toAddress)
        .storeAddress(params.responseAddress)
        .storeBit(false) // null custom_payload
        .storeCoins(params.forwardAmount)
        .storeBit(params.forwardPayload != null) // forward_payload in this slice - false, separate cell - true
        .storeMaybeRef(params.forwardPayload)
        .endCell();
};

const createJettonTransfer = (
    seqno: number,
    walletState: WalletState,
    recipientAddress: string,
    amount: AssetAmount<TonAsset>,
    jettonWalletAddress: string,
    forwardPayload: Cell | null,
    secretKey: Buffer = Buffer.alloc(64)
) => {
    const jettonAmount = BigInt(amount.stringWeiAmount);

    const body = jettonTransferBody({
        queryId: Date.now(),
        jettonAmount,
        toAddress: Address.parse(recipientAddress),
        responseAddress: Address.parse(walletState.active.rawAddress),
        forwardAmount: jettonTransferForwardAmount,
        forwardPayload
    });

    const contract = walletContractFromState(walletState);
    const transfer = contract.createTransfer({
        seqno,
        secretKey,
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        messages: [
            internal({
                to: Address.parse(jettonWalletAddress),
                bounce: true,
                value: jettonTransferAmount,
                body: body
            })
        ]
    });

    return externalMessage(contract, seqno, transfer).toBoc();
};

export const estimateJettonTransfer = async (
    tonApi: Configuration,
    walletState: WalletState,
    recipient: TonRecipientData,
    amount: AssetAmount<TonAsset>,
    jettonWalletAddress: string
) => {
    await checkServiceTimeOrDie(tonApi);
    const [wallet, seqno] = await getWalletBalance(tonApi, walletState);
    checkWalletPositiveBalanceOrDie(wallet);

    const cell = createJettonTransfer(
        seqno,
        walletState,
        recipient.toAccount.address.raw,
        amount,
        jettonWalletAddress,
        recipient.comment ? comment(recipient.comment) : null
    );

    const { fee } = await new SendApi(tonApi).estimateTx({
        sendBocRequest: { boc: cell.toString('base64') }
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
    await checkServiceTimeOrDie(tonApi);
    const mnemonic = await getWalletMnemonic(storage, walletState.publicKey, password);
    const keyPair = await mnemonicToPrivateKey(mnemonic);

    const total = new BigNumber(fee.total).plus(jettonTransferAmount.toString());

    const [wallet, seqno] = await getWalletBalance(tonApi, walletState);
    checkWalletBalanceOrDie(total, wallet);

    const cell = createJettonTransfer(
        seqno,
        walletState,
        recipient.toAccount.address.raw,
        data,
        jettonInfo,
        recipient.comment ? comment(recipient.comment) : null,
        keyPair.secretKey
    );

    await new SendApi(tonApi).sendBoc({
        sendBocRequest: { boc: cell.toString('base64') }
    });
};
