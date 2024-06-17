import { Address, beginCell, Cell, comment, internal, toNano } from '@ton/core';
import BigNumber from 'bignumber.js';
import { APIConfig } from '../../entries/apis';
import { AssetAmount } from '../../entries/crypto/asset/asset-amount';
import { TonAsset } from '../../entries/crypto/asset/ton-asset';
import { TonRecipientData, TransferEstimationEvent } from '../../entries/send';
import { CellSigner, Signer } from '../../entries/signer';
import { WalletState } from '../../entries/wallet';
import { BlockchainApi, EmulationApi } from '../../tonApiV2';
import { createLedgerJettonTransfer } from '../ledger/transfer';
import { walletContractFromState } from '../wallet/contractService';
import {
    checkWalletBalanceOrDie,
    checkWalletPositiveBalanceOrDie,
    externalMessage,
    getServerTime,
    getTonkeeperQueryId,
    getTTL,
    getWalletBalance,
    SendMode,
    signEstimateMessage
} from './common';

export const jettonTransferAmount = toNano(0.1);
export const jettonTransferForwardAmount = BigInt(1);

export const jettonTransferBody = (params: {
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

const createJettonTransfer = async (
    timestamp: number,
    seqno: number,
    walletState: WalletState,
    recipientAddress: string,
    amount: AssetAmount<TonAsset>,
    jettonWalletAddress: string,
    forwardPayload: Cell | null,
    signer: CellSigner
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
    const transfer = await contract.createTransferAndSignRequestAsync({
        seqno,
        signer,
        timeout: getTTL(timestamp),
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
    const timestamp = await getServerTime(api);
    const [wallet, seqno] = await getWalletBalance(api, walletState);
    checkWalletPositiveBalanceOrDie(wallet);

    const cell = await createJettonTransfer(
        timestamp,
        seqno,
        walletState,
        recipient.toAccount.address,
        amount,
        jettonWalletAddress,
        recipient.comment ? comment(recipient.comment) : null,
        signEstimateMessage
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
    signer: Signer
) => {
    const timestamp = await getServerTime(api);

    const total = new BigNumber(fee.event.extra)
        .multipliedBy(-1)
        .plus(jettonTransferAmount.toString());

    const [wallet, seqno] = await getWalletBalance(api, walletState);
    checkWalletBalanceOrDie(total, wallet);

    let buffer: Buffer;
    const params = [
        timestamp,
        seqno,
        walletState,
        recipient.toAccount.address,
        amount,
        jettonWalletAddress,
        recipient.comment ? comment(recipient.comment) : null
    ] as const;
    if (signer.type === 'ledger') {
        buffer = await createLedgerJettonTransfer(...params, signer);
    } else {
        buffer = await createJettonTransfer(...params, signer);
    }

    await new BlockchainApi(api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc: buffer.toString('base64') }
    });
};
