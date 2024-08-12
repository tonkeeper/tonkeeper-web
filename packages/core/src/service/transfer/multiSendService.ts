import { Address, comment, internal } from '@ton/core';
import BigNumber from 'bignumber.js';
import { APIConfig } from '../../entries/apis';
import { CellSigner } from '../../entries/signer';
import { TonWalletStandard, WalletVersion } from '../../entries/wallet';
import { BlockchainApi, EmulationApi } from '../../tonApiV2';
import { unShiftedDecimals } from '../../utils/balance';
import { walletContractFromState } from '../wallet/contractService';
import {
    SendMode,
    checkWalletBalanceOrDie,
    externalMessage,
    getServerTime,
    getTTL,
    getTonkeeperQueryId,
    getWalletBalance,
    signEstimateMessage
} from './common';
import {
    jettonTransferAmount,
    jettonTransferBody,
    jettonTransferForwardAmount
} from './jettonService';
import { nftTransferBody, nftTransferForwardAmount } from './nftService';

export type TransferMessage = {
    to: string;
    bounce: boolean;
    weiAmount: BigNumber;
    comment?: string;
};

export const MAX_ALLOWED_WALLET_MSGS = {
    [WalletVersion.V5R1]: 255,
    [WalletVersion.V5_BETA]: 255,
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
    walletState: TonWalletStandard,
    transferMessages: TransferMessage[]
) => {
    const timestamp = await getServerTime(api);

    const total = transferMessages.reduce((acc, msg) => acc.plus(msg.weiAmount), new BigNumber(0));
    const [wallet, seqno] = await getWalletBalance(api, walletState);
    checkWalletBalanceOrDie(total, wallet);

    checkMaxAllowedMessagesInMultiTransferOrDie(transferMessages.length, walletState.version);

    const cell = await createTonMultiTransfer(
        timestamp,
        seqno,
        walletState,
        transferMessages,
        signEstimateMessage
    );

    const emulationApi = new EmulationApi(api.tonApiV2);

    const { event } = await emulationApi.emulateMessageToWallet({
        emulateMessageToWalletRequest: { boc: cell.toString('base64') }
    });

    return event;
};

export const sendTonMultiTransfer = async (
    api: APIConfig,
    walletState: TonWalletStandard,
    transferMessages: TransferMessage[],
    feeEstimate: BigNumber,
    signer: CellSigner
) => {
    const timestamp = await getServerTime(api);

    const total = transferMessages.reduce((acc, msg) => acc.plus(msg.weiAmount), new BigNumber(0));
    const [wallet, seqno] = await getWalletBalance(api, walletState);
    checkWalletBalanceOrDie(total.plus(feeEstimate), wallet);

    checkMaxAllowedMessagesInMultiTransferOrDie(transferMessages.length, walletState.version);

    const cell = await createTonMultiTransfer(
        timestamp,
        seqno,
        walletState,
        transferMessages,
        signer
    );

    await new BlockchainApi(api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc: cell.toString('base64') }
    });

    return true;
};

const createTonMultiTransfer = async (
    timestamp: number,
    seqno: number,
    walletState: TonWalletStandard,
    transferMessages: TransferMessage[],
    signer: CellSigner
) => {
    const contract = walletContractFromState(walletState);

    const transfer = await contract.createTransferAndSignRequestAsync({
        seqno,
        signer,
        timeout: getTTL(timestamp),
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
    walletState: TonWalletStandard,
    jettonWalletAddress: string,
    transferMessages: TransferMessage[]
) => {
    const timestamp = await getServerTime(api);

    const [wallet, seqno] = await getWalletBalance(api, walletState);
    checkWalletBalanceOrDie(
        BigNumber((jettonTransferAmount * BigInt(transferMessages.length)).toString()),
        wallet
    );

    checkMaxAllowedMessagesInMultiTransferOrDie(transferMessages.length, walletState.version);

    const cell = await createJettonMultiTransfer(
        timestamp,
        seqno,
        walletState,
        jettonWalletAddress,
        transferMessages,
        BigNumber(jettonTransferAmount.toString()),
        signEstimateMessage
    );

    const emulationApi = new EmulationApi(api.tonApiV2);

    const { event } = await emulationApi.emulateMessageToWallet({
        emulateMessageToWalletRequest: { boc: cell.toString('base64') }
    });
    return event;
};

export const sendJettonMultiTransfer = async (
    api: APIConfig,
    walletState: TonWalletStandard,
    jettonWalletAddress: string,
    transferMessages: TransferMessage[],
    feeEstimate: BigNumber,
    signer: CellSigner
) => {
    const timestamp = await getServerTime(api);

    const [wallet, seqno] = await getWalletBalance(api, walletState);

    checkMaxAllowedMessagesInMultiTransferOrDie(transferMessages.length, walletState.version);

    const attachValue = feeEstimate.div(transferMessages.length).plus(unShiftedDecimals(0.05));
    checkWalletBalanceOrDie(attachValue.multipliedBy(transferMessages.length), wallet);

    const estimationCell = await createJettonMultiTransfer(
        timestamp,
        seqno,
        walletState,
        jettonWalletAddress,
        transferMessages,
        attachValue,
        signEstimateMessage
    );

    const res = await new EmulationApi(api.tonApiV2).emulateMessageToWallet({
        emulateMessageToWalletRequest: { boc: estimationCell.toString('base64') }
    });

    if (
        res.event.actions
            .filter(action => action.type === 'JettonTransfer')
            .some(action => action.status !== 'ok')
    ) {
        throw new Error('Jetton transfer estimation failed');
    }

    const cell = await createJettonMultiTransfer(
        timestamp,
        seqno,
        walletState,
        jettonWalletAddress,
        transferMessages,
        attachValue,
        signer
    );

    await new BlockchainApi(api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc: cell.toString('base64') }
    });
    return true;
};

const createJettonMultiTransfer = async (
    timestamp: number,
    seqno: number,
    walletState: TonWalletStandard,
    jettonWalletAddress: string,
    transferMessages: TransferMessage[],
    attachValue: BigNumber,
    signer: CellSigner
) => {
    const contract = walletContractFromState(walletState);

    const transfer = await contract.createTransferAndSignRequestAsync({
        seqno,
        signer,
        timeout: getTTL(timestamp),
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        messages: transferMessages.map(msg =>
            internal({
                to: Address.parse(jettonWalletAddress),
                bounce: true,
                value: BigInt(attachValue.toFixed(0)),
                body: jettonTransferBody({
                    queryId: getTonkeeperQueryId(),
                    jettonAmount: BigInt(msg.weiAmount.toFixed(0)),
                    toAddress: Address.parse(msg.to),
                    responseAddress: Address.parse(walletState.rawAddress),
                    forwardAmount: jettonTransferForwardAmount,
                    forwardPayload: msg.comment ? comment(msg.comment) : null,
                    customPayload: null
                })
            })
        )
    });

    return externalMessage(contract, seqno, transfer).toBoc();
};

export type NftTransferMessage = {
    to: string;
    nft: string;
    comment?: string;
};

export const createNftMultiTransfer = async (
    timestamp: number,
    seqno: number,
    walletState: TonWalletStandard,
    transferMessages: NftTransferMessage[],
    attachValue: BigNumber,
    signer: CellSigner
) => {
    const contract = walletContractFromState(walletState);

    const transfer = await contract.createTransferAndSignRequestAsync({
        seqno,
        signer,
        timeout: getTTL(timestamp),
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        messages: transferMessages.map(msg =>
            internal({
                to: Address.parse(msg.nft),
                bounce: true,
                value: BigInt(attachValue.toFixed(0)),
                body: nftTransferBody({
                    queryId: getTonkeeperQueryId(),
                    newOwnerAddress: Address.parse(msg.to),
                    responseAddress: Address.parse(walletState.rawAddress),
                    forwardAmount: nftTransferForwardAmount,
                    forwardPayload: msg.comment ? comment(msg.comment) : null
                })
            })
        )
    });

    return externalMessage(contract, seqno, transfer).toBoc();
};

export const sendNftMultiTransfer = async (
    api: APIConfig,
    walletState: TonWalletStandard,
    transferMessages: NftTransferMessage[],
    feeEstimate: BigNumber,
    signer: CellSigner
) => {
    const timestamp = await getServerTime(api);

    const [wallet, seqno] = await getWalletBalance(api, walletState);

    checkMaxAllowedMessagesInMultiTransferOrDie(transferMessages.length, walletState.version);

    const attachValue = feeEstimate.div(transferMessages.length).plus(unShiftedDecimals(0.03));
    checkWalletBalanceOrDie(attachValue.multipliedBy(transferMessages.length), wallet);

    const estimationCell = await createNftMultiTransfer(
        timestamp,
        seqno,
        walletState,
        transferMessages,
        attachValue,
        signEstimateMessage
    );

    const res = await new EmulationApi(api.tonApiV2).emulateMessageToWallet({
        emulateMessageToWalletRequest: { boc: estimationCell.toString('base64') }
    });

    if (
        res.event.actions
            .filter(action => action.type === 'JettonTransfer')
            .some(action => action.status !== 'ok')
    ) {
        throw new Error('Jetton transfer estimation failed');
    }

    const cell = await createNftMultiTransfer(
        timestamp,
        seqno,
        walletState,
        transferMessages,
        attachValue,
        signer
    );

    await new BlockchainApi(api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc: cell.toString('base64') }
    });
    return true;
};
