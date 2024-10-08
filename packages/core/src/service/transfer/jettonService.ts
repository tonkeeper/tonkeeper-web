import { Address, beginCell, Cell, comment, internal, toNano } from '@ton/core';
import BigNumber from 'bignumber.js';
import { AccountTonWalletStandard } from '../../entries/account';
import { APIConfig } from '../../entries/apis';
import { AssetAmount } from '../../entries/crypto/asset/asset-amount';
import { TonAsset } from '../../entries/crypto/asset/ton-asset';
import {
    TonRecipientData,
    TransferEstimationEvent,
    TransferEstimationEventFee
} from '../../entries/send';
import { CellSigner, Signer } from '../../entries/signer';
import { TonContract, TonWalletStandard } from '../../entries/wallet';
import { BlockchainApi, EmulationApi, Multisig } from '../../tonApiV2';
import { createLedgerJettonTransfer } from '../ledger/transfer';
import { walletContractFromState } from '../wallet/contractService';
import {
    checkWalletBalanceOrDie,
    checkWalletPositiveBalanceOrDie,
    estimateMultisigTransfer,
    externalMessage,
    getServerTime,
    getTonkeeperQueryId,
    getTTL,
    getWalletBalance,
    SendMode,
    sendMultisigTransfer,
    signEstimateMessage
} from './common';
import { getJettonCustomPayload } from './jettonPayloadService';

export const jettonTransferAmount = toNano(0.1);
export const jettonTransferForwardAmount = BigInt(1);

export const jettonTransferBody = (params: {
    queryId: bigint;
    jettonAmount: bigint;
    toAddress: Address;
    responseAddress: Address;
    forwardAmount: bigint;
    forwardPayload: Cell | null;
    customPayload: Cell | null;
}) => {
    return beginCell()
        .storeUint(0xf8a7ea5, 32) // request_transfer op
        .storeUint(params.queryId, 64)
        .storeCoins(params.jettonAmount)
        .storeAddress(params.toAddress)
        .storeAddress(params.responseAddress)
        .storeMaybeRef(params.customPayload) // null custom_payload
        .storeCoins(params.forwardAmount)
        .storeMaybeRef(params.forwardPayload) // storeMaybeRef put 1 bit before cell (forward_payload in cell) or 0 for null (forward_payload in slice)
        .endCell();
};

const createJettonTransferMsgParams = async ({
    api,
    jettonWalletAddress,
    amount,
    recipientAddress,
    walletState,
    forwardPayload
}: {
    api: APIConfig;
    walletState: Pick<TonContract, 'rawAddress'>;
    recipientAddress: string;
    amount: AssetAmount<TonAsset>;
    jettonWalletAddress: string;
    forwardPayload: Cell | null;
}) => {
    const { customPayload, stateInit } = await getJettonCustomPayload(
        api,
        walletState.rawAddress,
        amount
    );

    const jettonAmount = BigInt(amount.stringWeiAmount);

    const body = jettonTransferBody({
        queryId: getTonkeeperQueryId(),
        jettonAmount,
        toAddress: Address.parse(recipientAddress),
        responseAddress: Address.parse(walletState.rawAddress),
        forwardAmount: jettonTransferForwardAmount,
        forwardPayload,
        customPayload
    });

    return {
        to: Address.parse(jettonWalletAddress),
        bounce: true,
        value: jettonTransferAmount,
        body: body,
        init: stateInit
    };
};

const createJettonTransferExternal = async (
    api: APIConfig,
    seqno: number,
    walletState: TonWalletStandard,
    recipientAddress: string,
    amount: AssetAmount<TonAsset>,
    jettonWalletAddress: string,
    forwardPayload: Cell | null,
    signer: CellSigner
) => {
    const timestamp = await getServerTime(api);
    const internalParams = await createJettonTransferMsgParams({
        api,
        walletState,
        recipientAddress,
        amount,
        jettonWalletAddress,
        forwardPayload
    });

    const contract = walletContractFromState(walletState);
    const transfer = await contract.createTransferAndSignRequestAsync({
        seqno,
        signer,
        timeout: getTTL(timestamp),
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        messages: [internal(internalParams)]
    });

    return externalMessage(contract, seqno, transfer).toBoc();
};

export const estimateJettonTransfer = async (
    api: APIConfig,
    walletState: TonWalletStandard,
    recipient: TonRecipientData,
    amount: AssetAmount<TonAsset>,
    jettonWalletAddress: string
): Promise<TransferEstimationEvent> => {
    const [wallet, seqno] = await getWalletBalance(api, walletState);
    checkWalletPositiveBalanceOrDie(wallet);

    const cell = await createJettonTransferExternal(
        api,
        seqno,
        walletState,
        recipient.toAccount.address,
        amount,
        jettonWalletAddress,
        recipient.comment ? comment(recipient.comment) : null,
        signEstimateMessage
    );

    const result = await new EmulationApi(api.tonApiV2).emulateMessageToWallet({
        emulateMessageToWalletRequest: { boc: cell.toString('base64') }
    });

    return result;
};

export const sendJettonTransfer = async (
    api: APIConfig,
    account: AccountTonWalletStandard,
    recipient: TonRecipientData,
    amount: AssetAmount<TonAsset>,
    jettonWalletAddress: string,
    fee: TransferEstimationEvent,
    signer: Signer
) => {
    const total = new BigNumber(fee.event.extra)
        .multipliedBy(-1)
        .plus(jettonTransferAmount.toString());

    const walletState = account.activeTonWallet;
    const [wallet, seqno] = await getWalletBalance(api, walletState);
    checkWalletBalanceOrDie(total, wallet);

    let buffer: Buffer;

    if (signer.type === 'ledger') {
        if (account.type !== 'ledger') {
            throw new Error(`Unexpected account type: ${account.type}`);
        }
        buffer = await createLedgerJettonTransfer(
            api,
            seqno,
            account,
            recipient.toAccount.address,
            amount,
            jettonWalletAddress,
            recipient.comment ? comment(recipient.comment) : null,
            signer
        );
    } else {
        buffer = await createJettonTransferExternal(
            api,
            seqno,
            walletState,
            recipient.toAccount.address,
            amount,
            jettonWalletAddress,
            recipient.comment ? comment(recipient.comment) : null,
            signer
        );
    }

    await new BlockchainApi(api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc: buffer.toString('base64') }
    });
};

export const estimateMultisigJettonTransfer = async ({
    api,
    hostWallet,
    multisig,
    recipient,
    jettonWalletAddress,
    amount
}: {
    api: APIConfig;
    hostWallet: TonWalletStandard;
    multisig: Pick<Multisig, 'address' | 'signers' | 'threshold'>;
    recipient: TonRecipientData;
    amount: AssetAmount<TonAsset>;
    jettonWalletAddress: string;
}): Promise<TransferEstimationEvent> => {
    const internalParams = await createJettonTransferMsgParams({
        api,
        walletState: { rawAddress: multisig.address },
        recipientAddress: recipient.toAccount.address,
        amount,
        jettonWalletAddress,
        forwardPayload: recipient.comment ? comment(recipient.comment) : null
    });

    return estimateMultisigTransfer({
        api,
        hostWallet,
        multisig,
        amount: BigNumber(jettonTransferAmount.toString()),
        message: internal(internalParams)
    });
};

export const sendMultisigJettonTransfer = async (params: {
    api: APIConfig;
    hostWallet: TonWalletStandard;
    multisig: Pick<Multisig, 'address' | 'signers' | 'proposers'>;
    recipient: TonRecipientData;
    amount: AssetAmount<TonAsset>;
    jettonWalletAddress: string;
    fee: TransferEstimationEventFee;
    signer: Signer;
    ttlSeconds: number;
}): Promise<void> => {
    const internalParams = await createJettonTransferMsgParams({
        api: params.api,
        walletState: { rawAddress: params.multisig.address },
        recipientAddress: params.recipient.toAccount.address,
        amount: params.amount,
        jettonWalletAddress: params.jettonWalletAddress,
        forwardPayload: params.recipient.comment ? comment(params.recipient.comment) : null
    });

    await sendMultisigTransfer({
        ...params,
        amount: new BigNumber(jettonTransferAmount.toString()),
        message: internal(internalParams)
    });
};
