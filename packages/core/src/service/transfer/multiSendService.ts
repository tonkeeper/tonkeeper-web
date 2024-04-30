import { WalletState, WalletVersion } from '../../entries/wallet';
import { APIConfig } from '../../entries/apis';
import {
    checkServiceTimeOrDie,
    checkWalletBalanceOrDie,
    externalMessage,
    getTonkeeperQueryId,
    getTTL,
    getWalletBalance,
    SendMode
} from './common';
import BigNumber from 'bignumber.js';
import { BlockchainApi, EmulationApi } from '../../tonApiV2';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { walletContractFromState } from '../wallet/contractService';
import { Address, comment, internal } from '@ton/core';
import { unShiftedDecimals } from '../../utils/balance';
import {
    jettonTransferAmount,
    jettonTransferBody,
    jettonTransferForwardAmount
} from './jettonService';

export type TransferMessage = {
    to: string;
    bounce: boolean;
    weiAmount: BigNumber;
    comment?: string;
};

export const MAX_ALLOWED_WALLET_MSGS = {
    [WalletVersion.W5]: 255,
    [WalletVersion.V4R2]: 4,
    [WalletVersion.V4R1]: 4,
    [WalletVersion.V3R2]: 4,
    [WalletVersion.V3R1]: 4
};
const checkMaxAllowedMessagesInMultiTransferOrDie = (
    messagesNumber: number,
    walletVersion: WalletVersion
) => {
    if (messagesNumber > MAX_ALLOWED_WALLET_MSGS[walletVersion]) {
        throw new Error(
            `Max number of transfers in one multi transfer exceeded. Max allowed is ${MAX_ALLOWED_WALLET_MSGS[walletVersion]}, but got ${messagesNumber}.`
        );
    }
};

export const estimateTonMultiTransfer = async (
    api: APIConfig,
    walletState: WalletState,
    transferMessages: TransferMessage[]
) => {
    await checkServiceTimeOrDie(api);

    const total = transferMessages.reduce((acc, msg) => acc.plus(msg.weiAmount), new BigNumber(0));
    const [wallet, seqno] = await getWalletBalance(api, walletState);
    checkWalletBalanceOrDie(total, wallet);

    checkMaxAllowedMessagesInMultiTransferOrDie(
        transferMessages.length,
        walletState.active.version
    );

    const cell = createTonMultiTransfer(seqno, walletState, transferMessages);

    const emulationApi = new EmulationApi(api.tonApiV2);

    return emulationApi.emulateMessageToAccountEvent({
        ignoreSignatureCheck: true,
        accountId: wallet.address,
        decodeMessageRequest: { boc: cell.toString('base64') }
    });
};

export const sendTonMultiTransfer = async (
    api: APIConfig,
    walletState: WalletState,
    transferMessages: TransferMessage[],
    feeEstimate: BigNumber,
    mnemonic: string[]
) => {
    await checkServiceTimeOrDie(api);
    const keyPair = await mnemonicToPrivateKey(mnemonic);

    const total = transferMessages.reduce((acc, msg) => acc.plus(msg.weiAmount), new BigNumber(0));
    const [wallet, seqno] = await getWalletBalance(api, walletState);
    checkWalletBalanceOrDie(total.plus(feeEstimate), wallet);

    checkMaxAllowedMessagesInMultiTransferOrDie(
        transferMessages.length,
        walletState.active.version
    );

    const cell = createTonMultiTransfer(seqno, walletState, transferMessages, {
        secretKey: keyPair.secretKey
    });

    await new BlockchainApi(api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc: cell.toString('base64') }
    });

    return true;
};

const createTonMultiTransfer = (
    seqno: number,
    walletState: WalletState,
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
                to: msg.to,
                bounce: msg.bounce,
                value: BigInt(msg.weiAmount.toFixed(0)),
                body: msg.comment !== '' ? msg.comment : undefined
            })
        )
    });

    return externalMessage(contract, seqno, transfer).toBoc();
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

    const attachValue = feeEstimate.div(transferMessages.length).plus(unShiftedDecimals(0.05));

    const estimationCell = createJettonMultiTransfer(
        seqno,
        walletState,
        jettonWalletAddress,
        transferMessages,
        { attachValue }
    );

    const res = await new EmulationApi(api.tonApiV2).emulateMessageToAccountEvent({
        ignoreSignatureCheck: true,
        accountId: wallet.address,
        decodeMessageRequest: { boc: estimationCell.toString('base64') }
    });

    if (
        res.actions
            .filter(action => action.type === 'JettonTransfer')
            .some(action => action.status !== 'ok')
    ) {
        throw new Error('Jetton transfer estimation failed');
    }

    const cell = createJettonMultiTransfer(
        seqno,
        walletState,
        jettonWalletAddress,
        transferMessages,
        { attachValue, secretKey: keyPair.secretKey }
    );

    await new BlockchainApi(api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc: cell.toString('base64') }
    });
    return true;
};

const createJettonMultiTransfer = (
    seqno: number,
    walletState: WalletState,
    jettonWalletAddress: string,
    transferMessages: TransferMessage[],
    options: {
        secretKey?: Buffer;
        attachValue?: BigNumber;
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
                value: options.attachValue
                    ? BigInt(options.attachValue.toFixed(0))
                    : jettonTransferAmount,
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
