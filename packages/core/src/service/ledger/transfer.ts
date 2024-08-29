import { Address, Cell } from '@ton/core';
import BigNumber from 'bignumber.js';
import { AccountLedger } from '../../entries/account';
import { APIConfig } from '../../entries/apis';
import { AssetAmount } from '../../entries/crypto/asset/asset-amount';
import { TonAsset } from '../../entries/crypto/asset/ton-asset';
import { TonRecipientData } from '../../entries/send';
import { LedgerSigner } from '../../entries/signer';
import {
    SendMode,
    externalMessage,
    getServerTime,
    getTTL,
    getTonkeeperQueryId,
    seeIfTransferBounceable
} from '../transfer/common';
import { getJettonCustomPayload } from '../transfer/jettonPayloadService';
import { jettonTransferAmount, jettonTransferForwardAmount } from '../transfer/jettonService';
import { nftTransferForwardAmount } from '../transfer/nftService';
import { walletContractFromState } from '../wallet/contractService';
import { getLedgerAccountPathByIndex } from './utils';

export const createLedgerTonTransfer = async (
    timestamp: number,
    seqno: number,
    account: AccountLedger,
    recipient: TonRecipientData,
    weiAmount: BigNumber,
    isMax: boolean,
    signer: LedgerSigner
) => {
    const path = getLedgerAccountPathByIndex(account.activeDerivationIndex);
    const walletState = account.activeTonWallet;
    const contract = walletContractFromState(walletState);

    const transfer = await signer(path, {
        to: Address.parse(recipient.toAccount.address),
        bounce: seeIfTransferBounceable(recipient.toAccount, recipient.address),
        amount: BigInt(weiAmount.toFixed(0)),
        seqno,
        timeout: getTTL(timestamp),
        sendMode: isMax
            ? SendMode.CARRY_ALL_REMAINING_BALANCE + SendMode.IGNORE_ERRORS
            : SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        payload: recipient.comment !== '' ? { type: 'comment', text: recipient.comment } : undefined
    });

    return externalMessage(contract, seqno, transfer).toBoc();
};

export const createLedgerJettonTransfer = async (
    api: APIConfig,
    seqno: number,
    account: AccountLedger,
    recipientAddress: string,
    amount: AssetAmount<TonAsset>,
    jettonWalletAddress: string,
    forwardPayload: Cell | null,
    signer: LedgerSigner
) => {
    const timestamp = await getServerTime(api);

    const jettonAmount = BigInt(amount.stringWeiAmount);
    const path = getLedgerAccountPathByIndex(account.activeDerivationIndex);
    const wallet = account.activeTonWallet;

    const { customPayload, stateInit } = await getJettonCustomPayload(
        api,
        wallet.rawAddress,
        amount
    );

    const contract = walletContractFromState(wallet);

    const transfer = await signer(path, {
        to: Address.parse(jettonWalletAddress),
        bounce: true,
        amount: jettonTransferAmount,
        seqno,
        timeout: getTTL(timestamp),
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        payload: {
            knownJetton: null,
            type: 'jetton-transfer',
            queryId: getTonkeeperQueryId(),
            amount: jettonAmount,
            destination: Address.parse(recipientAddress),
            responseDestination: Address.parse(wallet.rawAddress),
            forwardAmount: jettonTransferForwardAmount,
            forwardPayload,
            customPayload
        },
        stateInit
    });

    return externalMessage(contract, seqno, transfer).toBoc();
};

export const createLedgerNftTransfer = async (
    timestamp: number,
    seqno: number,
    account: AccountLedger,
    recipientAddress: string,
    nftAddress: string,
    nftTransferAmount: bigint,
    forwardPayload: Cell | null,
    signer: LedgerSigner
) => {
    const path = getLedgerAccountPathByIndex(account.activeDerivationIndex);
    const walletState = account.activeTonWallet;
    const contract = walletContractFromState(walletState);

    const transfer = await signer(path, {
        to: Address.parse(nftAddress),
        bounce: true,
        amount: nftTransferAmount,
        seqno,
        timeout: getTTL(timestamp),
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        payload: {
            type: 'nft-transfer',
            queryId: getTonkeeperQueryId(),
            newOwner: Address.parse(recipientAddress),
            responseDestination: Address.parse(walletState.rawAddress),
            forwardAmount: nftTransferForwardAmount,
            forwardPayload,
            customPayload: null
        }
    });

    return externalMessage(contract, seqno, transfer).toBoc();
};
