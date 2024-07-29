import { Address, Cell, internal, loadStateInit } from '@ton/core';
import { Maybe } from '@ton/core/dist/utils/maybe';
import BigNumber from 'bignumber.js';
import { APIConfig } from '../../entries/apis';
import { AssetAmount } from '../../entries/crypto/asset/asset-amount';
import { TonRecipientData, TransferEstimationEvent } from '../../entries/send';
import { CellSigner, Signer } from '../../entries/signer';
import { TonConnectTransactionPayload } from '../../entries/tonConnect';
import { WalletState } from '../../entries/wallet';
import { AccountsApi, BlockchainApi, EmulationApi } from '../../tonApiV2';
import { createLedgerTonTransfer } from '../ledger/transfer';
import { walletContractFromState } from '../wallet/contractService';
import {
    SendMode,
    checkWalletBalanceOrDie,
    checkWalletPositiveBalanceOrDie,
    externalMessage,
    getServerTime,
    getTTL,
    getWalletBalance,
    getWalletSeqNo,
    seeIfAddressBounceable,
    seeIfTransferBounceable,
    signEstimateMessage
} from './common';
import { getLedgerAccountPathByIndex } from '../ledger/utils';
import { AuthLedger } from '../../entries/password';

export type EstimateData = {
    accountEvent: TransferEstimationEvent;
};

export const toStateInit = (
    stateInit?: string
): { code: Maybe<Cell>; data: Maybe<Cell> } | undefined => {
    if (!stateInit) {
        return undefined;
    }
    const { code, data } = loadStateInit(Cell.fromBase64(stateInit).asSlice());
    return {
        code,
        data
    };
};

const createTonTransfer = async (
    timestamp: number,
    seqno: number,
    walletState: WalletState,
    recipient: TonRecipientData,
    weiAmount: BigNumber,
    isMax: boolean,
    signer: CellSigner
) => {
    const contract = walletContractFromState(walletState);
    const transfer = await contract.createTransferAndSignRequestAsync({
        seqno,
        signer,
        timeout: getTTL(timestamp),
        sendMode: isMax
            ? SendMode.CARRY_ALL_REMAINING_BALANCE + SendMode.IGNORE_ERRORS
            : SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        messages: [
            internal({
                to: Address.parse(recipient.toAccount.address),
                bounce: seeIfTransferBounceable(recipient.toAccount, recipient.address),
                value: BigInt(weiAmount.toFixed(0)),
                body: recipient.comment !== '' ? recipient.comment : undefined
            })
        ]
    });
    return externalMessage(contract, seqno, transfer).toBoc();
};

const createTonConnectTransfer = async (
    timestamp: number,
    seqno: number,
    walletState: WalletState,
    params: TonConnectTransactionPayload,
    signer: Signer
) => {
    const contract = walletContractFromState(walletState);

    if (signer.type === 'ledger') {
        if (params.messages.length !== 1) {
            throw new Error('Ledger signer does not support multiple messages');
        }

        const message = params.messages[0];
        const path = getLedgerAccountPathByIndex((walletState.auth as AuthLedger).accountIndex);

        const transfer = await signer(path, {
            to: Address.parse(message.address),
            bounce: seeIfAddressBounceable(message.address),
            amount: BigInt(message.amount),
            seqno,
            timeout: getTTL(timestamp),
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
            payload: message.payload
                ? {
                      type: 'unsafe',
                      message: Cell.fromBase64(message.payload)
                  }
                : undefined,
            stateInit: toStateInit(message.stateInit)
        });

        return externalMessage(contract, seqno, transfer).toBoc();
    }

    const transfer = await contract.createTransferAndSignRequestAsync({
        seqno,
        signer,
        timeout: getTTL(timestamp),
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        messages: params.messages.map(item =>
            internal({
                to: Address.parse(item.address),
                bounce: seeIfAddressBounceable(item.address),
                value: BigInt(item.amount),
                init: toStateInit(item.stateInit),
                body: item.payload ? Cell.fromBase64(item.payload) : undefined
            })
        )
    });
    return externalMessage(contract, seqno, transfer).toBoc({ idx: false });
};

export const estimateTonTransfer = async (
    api: APIConfig,
    walletState: WalletState,
    recipient: TonRecipientData,
    weiAmount: BigNumber,
    isMax: boolean
) => {
    const timestamp = await getServerTime(api);
    const [wallet, seqno] = await getWalletBalance(api, walletState);
    if (!isMax) {
        checkWalletPositiveBalanceOrDie(wallet);
    }

    const cell = await createTonTransfer(
        timestamp,
        seqno,
        walletState,
        recipient,
        weiAmount,
        isMax,
        signEstimateMessage
    );

    const event = await new EmulationApi(api.tonApiV2).emulateMessageToAccountEvent({
        ignoreSignatureCheck: true,
        accountId: wallet.address,
        decodeMessageRequest: { boc: cell.toString('base64') }
    });

    return { event };
};

export type ConnectTransferError = { kind: 'not-enough-balance' } | { kind: undefined };

export const tonConnectTransferError = async (
    api: APIConfig,
    walletState: WalletState,
    params: TonConnectTransactionPayload
): Promise<ConnectTransferError> => {
    const wallet = await new AccountsApi(api.tonApiV2).getAccount({
        accountId: walletState.active.rawAddress
    });

    const total = params.messages.reduce(
        (acc, message) => acc.plus(message.amount),
        new BigNumber(0)
    );

    if (total.isGreaterThanOrEqualTo(wallet.balance)) {
        return { kind: 'not-enough-balance' };
    }

    return { kind: undefined };
};

export const estimateTonConnectTransfer = async (
    api: APIConfig,
    walletState: WalletState,
    params: TonConnectTransactionPayload
): Promise<TransferEstimationEvent> => {
    const timestamp = await getServerTime(api);
    const [wallet, seqno] = await getWalletBalance(api, walletState);
    checkWalletPositiveBalanceOrDie(wallet);

    const cell = await createTonConnectTransfer(
        timestamp,
        seqno,
        walletState,
        params,
        signEstimateMessage
    );

    const event = await new EmulationApi(api.tonApiV2).emulateMessageToAccountEvent({
        ignoreSignatureCheck: true,
        accountId: wallet.address,
        decodeMessageRequest: { boc: cell.toString('base64') }
    });

    return { event };
};

export const sendTonConnectTransfer = async (
    api: APIConfig,
    walletState: WalletState,
    params: TonConnectTransactionPayload,
    signer: Signer
) => {
    const timestamp = await getServerTime(api);
    const seqno = await getWalletSeqNo(api, walletState.active.rawAddress);

    const external = await createTonConnectTransfer(timestamp, seqno, walletState, params, signer);

    const boc = external.toString('base64');

    await new BlockchainApi(api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc }
    });

    return boc;
};

export const sendTonTransfer = async (
    api: APIConfig,
    walletState: WalletState,
    recipient: TonRecipientData,
    amount: AssetAmount,
    isMax: boolean,
    fee: TransferEstimationEvent,
    signer: Signer
) => {
    const timestamp = await getServerTime(api);

    const total = new BigNumber(fee.event.extra).multipliedBy(-1).plus(amount.weiAmount);

    const [wallet, seqno] = await getWalletBalance(api, walletState);
    if (!isMax) {
        checkWalletBalanceOrDie(total, wallet);
    }

    let buffer: Buffer;
    const params = [timestamp, seqno, walletState, recipient, amount.weiAmount, isMax] as const;
    if (signer.type === 'ledger') {
        buffer = await createLedgerTonTransfer(...params, signer);
    } else {
        buffer = await createTonTransfer(...params, signer);
    }

    await new BlockchainApi(api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc: buffer.toString('base64') }
    });
};
