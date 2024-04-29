import { Address, beginCell, Cell, comment, internal, toNano } from '@ton/core';
import { mnemonicToPrivateKey } from '@ton/crypto';
import BigNumber from 'bignumber.js';
import { APIConfig } from '../../entries/apis';
import { AssetAmount } from '../../entries/crypto/asset/asset-amount';
import { TonAsset } from '../../entries/crypto/asset/ton-asset';
import { TonRecipientData, TransferEstimationEvent } from '../../entries/send';
import { WalletState } from '../../entries/wallet';
import { BlockchainApi, EmulationApi } from '../../tonApiV2';
import { walletContractFromState } from '../wallet/contractService';
import {
    checkMaxAllowedMessagesInMultiTransferOrDie,
    checkServiceTimeOrDie,
    checkWalletBalanceOrDie,
    checkWalletPositiveBalanceOrDie,
    externalMessage,
    getTonkeeperQueryId,
    getTTL,
    getWalletBalance,
    SendMode
} from './common';
import { TransferMessage } from './tonService';

const jettonTransferAmount = toNano(0.1);
const jettonTransferForwardAmount = toNano(0.01);

const jettonTransferBody = (params: {
    queryId: bigint;
    jettonAmount: bigint;
    toAddress: Address;
    responseAddress: Address;
    forwardAmount: bigint;
    forwardPayload: Cell | null;
}) => {
    return beginCell()
        .storeUint(0xf8a7ea5, 32) // request_transfer op
        .storeUint(params.queryId, 64)
        .storeCoins(params.jettonAmount)
        .storeAddress(params.toAddress)
        .storeAddress(params.responseAddress)
        .storeBit(false) // null custom_payload
        .storeCoins(params.forwardAmount)
        .storeMaybeRef(params.forwardPayload) // storeMaybeRef put 1 bit before cell (forward_payload in cell) or 0 for null (forward_payload in slice)
        .endCell();
};

const createJettonMultiTransfer = (
    seqno: number,
    walletState: WalletState,
    jettonWalletAddress: string,
    transferMessages: TransferMessage[],
    options: {
        secretKey?: Buffer;
    } = {}
) => {
    const contract = walletContractFromState(walletState);

    const transfer = contract.createTransfer({
        seqno,
        secretKey: options.secretKey || Buffer.alloc(64),
        timeout: getTTL(),
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        messages: transferMessages.map(msg =>
            internal({
                to: Address.parse(jettonWalletAddress),
                bounce: true,
                value: jettonTransferAmount,
                body: jettonTransferBody({
                    queryId: getTonkeeperQueryId(),
                    jettonAmount: BigInt(msg.weiAmount.toFixed(0)),
                    toAddress: Address.parse(msg.to),
                    responseAddress: Address.parse(walletState.active.rawAddress),
                    forwardAmount: jettonTransferForwardAmount,
                    forwardPayload: msg.comment ? comment(msg.comment) : null
                })
            })
        )
    });

    return externalMessage(contract, seqno, transfer).toBoc();
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
        queryId: getTonkeeperQueryId(),
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
        timeout: getTTL(),
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
    api: APIConfig,
    walletState: WalletState,
    recipient: TonRecipientData,
    amount: AssetAmount<TonAsset>,
    jettonWalletAddress: string
): Promise<TransferEstimationEvent> => {
    await checkServiceTimeOrDie(api);
    const [wallet, seqno] = await getWalletBalance(api, walletState);
    checkWalletPositiveBalanceOrDie(wallet);

    const cell = createJettonTransfer(
        seqno,
        walletState,
        recipient.toAccount.address,
        amount,
        jettonWalletAddress,
        recipient.comment ? comment(recipient.comment) : null
    );

    const event = await new EmulationApi(api.tonApiV2).emulateMessageToAccountEvent({
        ignoreSignatureCheck: true,
        accountId: wallet.address,
        decodeMessageRequest: { boc: cell.toString('base64') }
    });

    return { event };
};

export const sendJettonTransfer = async (
    api: APIConfig,
    walletState: WalletState,
    recipient: TonRecipientData,
    amount: AssetAmount<TonAsset>,
    jettonWalletAddress: string,
    fee: TransferEstimationEvent,
    mnemonic: string[]
) => {
    await checkServiceTimeOrDie(api);
    const keyPair = await mnemonicToPrivateKey(mnemonic);

    const total = new BigNumber(fee.event.extra)
        .multipliedBy(-1)
        .plus(jettonTransferAmount.toString());

    const [wallet, seqno] = await getWalletBalance(api, walletState);
    checkWalletBalanceOrDie(total, wallet);

    const cell = createJettonTransfer(
        seqno,
        walletState,
        recipient.toAccount.address,
        amount,
        jettonWalletAddress,
        recipient.comment ? comment(recipient.comment) : null,
        keyPair.secretKey
    );

    await new BlockchainApi(api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc: cell.toString('base64') }
    });
};

export const estimateJettonMultiTransfer = async (
    api: APIConfig,
    walletState: WalletState,
    jettonWalletAddress: string,
    transferMessages: TransferMessage[]
) => {
    await checkServiceTimeOrDie(api);

    const [wallet, seqno] = await getWalletBalance(api, walletState);
    checkWalletBalanceOrDie(
        BigNumber((jettonTransferAmount * BigInt(transferMessages.length)).toString()),
        wallet
    );

    checkMaxAllowedMessagesInMultiTransferOrDie(
        transferMessages.length,
        walletState.active.version
    );

    const cell = createJettonMultiTransfer(
        seqno,
        walletState,
        jettonWalletAddress,
        transferMessages
    );

    const emulationApi = new EmulationApi(api.tonApiV2);

    return emulationApi.emulateMessageToAccountEvent({
        ignoreSignatureCheck: true,
        accountId: wallet.address,
        decodeMessageRequest: { boc: cell.toString('base64') }
    });
};

export const sendJettonMultiTransfer = async (
    api: APIConfig,
    walletState: WalletState,
    jettonWalletAddress: string,
    transferMessages: TransferMessage[],
    feeEstimate: BigNumber,
    mnemonic: string[]
) => {
    await checkServiceTimeOrDie(api);
    const keyPair = await mnemonicToPrivateKey(mnemonic);

    const [wallet, seqno] = await getWalletBalance(api, walletState);
    checkWalletBalanceOrDie(feeEstimate, wallet);

    checkMaxAllowedMessagesInMultiTransferOrDie(
        transferMessages.length,
        walletState.active.version
    );

    const cell = createJettonMultiTransfer(
        seqno,
        walletState,
        jettonWalletAddress,
        transferMessages,
        { secretKey: keyPair.secretKey }
    );

    await new BlockchainApi(api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc: cell.toString('base64') }
    });
    return true;
};
