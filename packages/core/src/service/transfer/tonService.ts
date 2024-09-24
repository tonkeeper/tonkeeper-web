import { Address, Cell, internal, loadStateInit } from '@ton/core';
import BigNumber from 'bignumber.js';
import { AccountTonWalletStandard } from '../../entries/account';
import { APIConfig } from '../../entries/apis';
import { AssetAmount } from '../../entries/crypto/asset/asset-amount';
import {
    TonRecipientData,
    TransferEstimationEvent,
    TransferEstimationEventFee
} from '../../entries/send';
import { CellSigner, Signer } from '../../entries/signer';
import {
    TonConnectTransactionPayload,
    TonConnectTransactionPayloadMessage
} from '../../entries/tonConnect';
import { TonContract, TonWalletStandard } from '../../entries/wallet';
import { LedgerError } from '../../errors/LedgerError';
import { AccountsApi, BlockchainApi, EmulationApi, Multisig } from '../../tonApiV2';
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
    signEstimateMessage,
    toStateInit,
    getWalletSeqnoAndCheckBalance
} from './common';
import { estimateNewOrder } from '../multisig/order/order-estimate';
import { orderActionMinAmount, sendCreateOrder } from '../multisig/order/order-send';

export type EstimateData = {
    accountEvent: TransferEstimationEvent;
};

const createTonTransfer = async (
    timestamp: number,
    seqno: number,
    walletState: TonWalletStandard,
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
    account: AccountTonWalletStandard,
    params: TonConnectTransactionPayload,
    signer: Signer
) => {
    const walletState = account.activeTonWallet;
    const contract = walletContractFromState(walletState);

    if (signer.type === 'ledger') {
        if (params.messages.length !== 1) {
            throw new LedgerError('Ledger signer does not support multiple messages');
        }

        const message = params.messages[0];

        let transfer: Cell;
        try {
            transfer = await signer({
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
        } catch (e) {
            console.error(e);
            throw new LedgerError(
                typeof e === 'string'
                    ? e
                    : typeof e === 'object' && e && 'message' in e
                    ? (e.message as string)
                    : 'Unknown error'
            );
        }

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
    walletState: TonWalletStandard,
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

    const result = await new EmulationApi(api.tonApiV2).emulateMessageToWallet({
        emulateMessageToWalletRequest: { boc: cell.toString('base64') }
    });

    return result;
};

export type ConnectTransferError = { kind: 'not-enough-balance' } | { kind: undefined };

export const tonConnectTransferError = async (
    api: APIConfig,
    walletState: TonContract,
    params: TonConnectTransactionPayload
): Promise<ConnectTransferError> => {
    const wallet = await new AccountsApi(api.tonApiV2).getAccount({
        accountId: walletState.rawAddress
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
    account: AccountTonWalletStandard,
    params: TonConnectTransactionPayload
): Promise<TransferEstimationEvent> => {
    const timestamp = await getServerTime(api);
    const [wallet, seqno] = await getWalletBalance(api, account.activeTonWallet);
    checkWalletPositiveBalanceOrDie(wallet);

    const cell = await createTonConnectTransfer(
        timestamp,
        seqno,
        account,
        params,
        signEstimateMessage
    );

    const result = await new EmulationApi(api.tonApiV2).emulateMessageToWallet({
        emulateMessageToWalletRequest: { boc: cell.toString('base64') }
    });

    return result;
};

export const sendTonConnectTransfer = async (
    api: APIConfig,
    account: AccountTonWalletStandard,
    params: TonConnectTransactionPayload,
    signer: Signer
) => {
    const timestamp = await getServerTime(api);
    const seqno = await getWalletSeqNo(api, account.activeTonWallet.rawAddress);

    const external = await createTonConnectTransfer(timestamp, seqno, account, params, signer);

    const boc = external.toString('base64');

    await new BlockchainApi(api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc }
    });

    return boc;
};

export const sendTonTransfer = async (
    api: APIConfig,
    account: AccountTonWalletStandard,
    recipient: TonRecipientData,
    amount: AssetAmount,
    isMax: boolean,
    fee: TransferEstimationEvent,
    signer: Signer
) => {
    const timestamp = await getServerTime(api);

    const total = new BigNumber(fee.event.extra).multipliedBy(-1).plus(amount.weiAmount);

    const wallet = account.activeTonWallet;
    const [tonapiWallet, seqno] = await getWalletBalance(api, wallet);
    if (!isMax) {
        checkWalletBalanceOrDie(total, tonapiWallet);
    }

    let buffer: Buffer;
    if (signer.type === 'ledger') {
        if (account.type !== 'ledger') {
            throw new Error(`Unexpected account type: ${account.type}`);
        }
        buffer = await createLedgerTonTransfer(
            timestamp,
            seqno,
            account,
            recipient,
            amount.weiAmount,
            isMax,
            signer
        );
    } else {
        buffer = await createTonTransfer(
            timestamp,
            seqno,
            wallet,
            recipient,
            amount.weiAmount,
            isMax,
            signer
        );
    }

    await new BlockchainApi(api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc: buffer.toString('base64') }
    });
};

export const estimateMultisigTonTransfer = async ({
    api,
    hostWallet,
    multisig,
    recipient,
    weiAmount,
    isMax
}: {
    api: APIConfig;
    hostWallet: TonWalletStandard;
    multisig: Pick<Multisig, 'address' | 'signers' | 'threshold'>;
    recipient: TonRecipientData;
    weiAmount: BigNumber;
    isMax: boolean;
}): Promise<TransferEstimationEvent> => {
    const timestamp = await getServerTime(api);

    const [walletInfo] = await getWalletBalance(api, { rawAddress: multisig.address });
    if (isMax) {
        checkWalletPositiveBalanceOrDie(walletInfo);
    } else {
        checkWalletBalanceOrDie(weiAmount, walletInfo);
    }

    await getWalletSeqnoAndCheckBalance({
        walletState: hostWallet,
        amount: orderActionMinAmount,
        api
    });

    return estimateNewOrder({
        multisig,
        api,
        order: {
            validUntilSeconds: getTTL(timestamp),
            actions: tonTransferToMultisigActions({ recipient, weiAmount, isMax })
        }
    });
};

export const sendMultisigTonTransfer = async ({
    api,
    hostWallet,
    multisig,
    recipient,
    weiAmount,
    isMax,
    fee,
    signer,
    ttlSeconds
}: {
    api: APIConfig;
    hostWallet: TonWalletStandard;
    multisig: Pick<Multisig, 'address' | 'signers' | 'proposers'>;
    recipient: TonRecipientData;
    weiAmount: BigNumber;
    isMax: boolean;
    fee: TransferEstimationEventFee;
    signer: CellSigner;
    ttlSeconds: number;
}): Promise<void> => {
    const timestamp = await getServerTime(api);

    const [walletInfo] = await getWalletBalance(api, { rawAddress: multisig.address });
    if (isMax) {
        checkWalletPositiveBalanceOrDie(walletInfo);
    } else {
        checkWalletBalanceOrDie(weiAmount.minus(fee.event.extra), walletInfo);
    }

    await getWalletSeqnoAndCheckBalance({
        walletState: hostWallet,
        amount: orderActionMinAmount,
        api
    });

    await sendCreateOrder({
        multisig,
        api,
        hostWallet,
        signer,
        order: {
            validUntilSeconds: timestamp + ttlSeconds,
            actions: tonTransferToMultisigActions({ recipient, weiAmount, isMax })
        }
    });
};

export const estimateMultisigTonConnectTransfer = async (
    api: APIConfig,
    hostWallet: TonContract,
    multisig: Pick<Multisig, 'address' | 'signers' | 'threshold'>,
    params: TonConnectTransactionPayload
): Promise<TransferEstimationEvent> => {
    const timestamp = await getServerTime(api);

    const amount = new BigNumber(
        params.messages.reduce((acc, m) => acc.plus(m.amount), new BigNumber(0))
    );
    await getWalletSeqnoAndCheckBalance({
        api,
        walletState: { rawAddress: multisig.address },
        amount
    });

    await getWalletSeqnoAndCheckBalance({
        walletState: hostWallet,
        amount: orderActionMinAmount,
        api
    });

    return estimateNewOrder({
        multisig,
        api,
        order: {
            validUntilSeconds: getTTL(timestamp),
            actions: tonConnectMessagesToMultisigActions(params.messages)
        }
    });
};

export const sendMultisigTonConnectTransfer = async ({
    api,
    multisig,
    params,
    hostWallet,
    signer,
    ttlSeconds
}: {
    api: APIConfig;
    hostWallet: TonWalletStandard;
    multisig: Pick<Multisig, 'address' | 'signers' | 'proposers'>;
    params: TonConnectTransactionPayload;
    signer: CellSigner;
    ttlSeconds: number;
}): Promise<string> => {
    const timestamp = await getServerTime(api);

    const amount = new BigNumber(
        params.messages.reduce((acc, m) => acc.plus(m.amount), new BigNumber(0))
    );
    await getWalletSeqnoAndCheckBalance({
        api,
        walletState: { rawAddress: multisig.address },
        amount
    });

    await getWalletSeqnoAndCheckBalance({
        walletState: hostWallet,
        amount: orderActionMinAmount,
        api
    });

    const boc = await sendCreateOrder({
        multisig,
        api,
        hostWallet,
        signer,
        order: {
            validUntilSeconds: timestamp + ttlSeconds,
            actions: tonConnectMessagesToMultisigActions(params.messages)
        }
    });

    return boc.toString('base64');
};

function tonConnectMessagesToMultisigActions(messages: TonConnectTransactionPayloadMessage[]) {
    return messages.map(
        message =>
            ({
                type: 'transfer',
                message: internal({
                    to: Address.parse(message.address),
                    bounce: seeIfAddressBounceable(message.address),
                    value: BigInt(message.amount),
                    body: message.payload ? Cell.fromBase64(message.payload) : undefined,
                    init: message.stateInit
                        ? loadStateInit(Cell.fromBase64(message.stateInit).beginParse())
                        : undefined
                }),
                sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS
            } as const)
    );
}

function tonTransferToMultisigActions({
    recipient,
    weiAmount,
    isMax
}: {
    recipient: TonRecipientData;
    weiAmount: BigNumber;
    isMax: boolean;
}) {
    return [
        {
            type: 'transfer',
            message: internal({
                to: Address.parse(recipient.toAccount.address),
                bounce: seeIfTransferBounceable(recipient.toAccount, recipient.address),
                value: BigInt(weiAmount.toFixed(0)),
                body: recipient.comment !== '' ? recipient.comment : undefined
            }),
            sendMode: isMax
                ? SendMode.CARRY_ALL_REMAINING_BALANCE + SendMode.IGNORE_ERRORS
                : SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS
        } as const
    ];
}
