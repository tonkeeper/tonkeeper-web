import { Address, beginCell, Cell, comment, toNano } from '@ton/core';
import BigNumber from 'bignumber.js';
import { APIConfig } from '../../entries/apis';
import { TonRecipientData, TransferEstimationEvent } from '../../entries/send';
import { CellSigner, Signer } from '../../entries/signer';
import { TonWalletStandard } from '../../entries/wallet';
import { BlockchainApi, EmulationApi, NftItem } from '../../tonApiV2';
import { createLedgerNftTransfer } from '../ledger/transfer';
import {
    checkWalletBalanceOrDie,
    checkWalletPositiveBalanceOrDie,
    createTransferMessage,
    getKeyPairAndSeqno,
    getServerTime,
    getTonkeeperQueryId,
    getWalletBalance,
    signEstimateMessage
} from './common';
import { Account, AccountControllable } from "../../entries/account";

const initNftTransferAmount = toNano('1');
export const nftTransferForwardAmount = BigInt('1');

export const nftTransferBody = (params: {
    queryId: bigint;
    newOwnerAddress: Address;
    responseAddress: Address;
    forwardAmount: bigint;
    forwardPayload: Cell | null;
}) => {
    return beginCell()
        .storeUint(0x5fcc3d14, 32) // transfer op
        .storeUint(params.queryId, 64)
        .storeAddress(params.newOwnerAddress)
        .storeAddress(params.responseAddress)
        .storeBit(false) // null custom_payload
        .storeCoins(params.forwardAmount)
        .storeMaybeRef(params.forwardPayload) // storeMaybeRef put 1 bit before cell (forward_payload in cell) or 0 for null (forward_payload in slice)
        .endCell();
};

const nftRenewBody = (params: { queryId: bigint }) => {
    return beginCell()
        .storeUint(0x4eb1f0f9, 32) // op::change_dns_record,
        .storeUint(params.queryId, 64)
        .storeUint(0, 256)
        .endCell();
};

const addressToDNSAddressFormat = (address: string) =>
    beginCell().storeUint(0x9fd3, 16).storeAddress(Address.parse(address)).storeUint(0, 8);

const nftLinkBody = (params: { queryId: bigint; linkToAddress: string }) => {
    let cell = beginCell()
        .storeUint(0x4eb1f0f9, 32) // op::change_dns_record,
        .storeUint(params?.queryId, 64)
        .storeUint(
            BigInt('0xe8d44050873dba865aa7c170ab4cce64d90839a34dcfd6cf71d14e0205443b1b'),
            256
        ); // DNS_CATEGORY_WALLET

    if (params.linkToAddress) {
        cell = cell.storeRef(addressToDNSAddressFormat(params.linkToAddress));
    }

    return cell.endCell();
};

const createNftTransfer = (
    timestamp: number,
    seqno: number,
    walletState: TonWalletStandard,
    recipientAddress: string,
    nftAddress: string,
    nftTransferAmount: bigint,
    forwardPayload: Cell | null,
    signer: CellSigner
) => {
    const body = nftTransferBody({
        queryId: getTonkeeperQueryId(),
        newOwnerAddress: Address.parse(recipientAddress),
        responseAddress: Address.parse(walletState.rawAddress),
        forwardAmount: nftTransferForwardAmount,
        forwardPayload
    });

    return createTransferMessage(
        { timestamp, seqno, state: walletState, signer },
        { to: nftAddress, value: nftTransferAmount, body }
    );
};

export const estimateNftTransfer = async (
    api: APIConfig,
    walletState: TonWalletStandard,
    recipient: TonRecipientData,
    nftItem: NftItem
): Promise<TransferEstimationEvent> => {
    const timestamp = await getServerTime(api);
    const [wallet, seqno] = await getWalletBalance(api, walletState);
    checkWalletPositiveBalanceOrDie(wallet);

    const cell = await createNftTransfer(
        timestamp,
        seqno,
        walletState,
        recipient.toAccount.address,
        nftItem.address,
        initNftTransferAmount,
        recipient.comment ? comment(recipient.comment) : null,
        signEstimateMessage
    );

    const result = await new EmulationApi(api.tonApiV2).emulateMessageToWallet({
        emulateMessageToWalletRequest: { boc: cell.toString('base64') }
    });
    return result;
};

export const sendNftTransfer = async (
    api: APIConfig,
    account: AccountControllable,
    recipient: TonRecipientData,
    nftItem: NftItem,
    fee: TransferEstimationEvent,
    signer: Signer
) => {
    const timestamp = await getServerTime(api);

    const min = toNano('0.05').toString();
    let nftTransferAmount = new BigNumber(fee.event.extra).multipliedBy(-1).plus(min);

    nftTransferAmount = nftTransferAmount.isLessThan(min) ? new BigNumber(min) : nftTransferAmount;

    const total = nftTransferAmount.plus(fee.event.extra * -1);

    if (nftTransferAmount.isLessThanOrEqualTo(0)) {
        throw new Error(`Unexpected nft transfer amount: ${nftTransferAmount.toString()}`);
    }

    const walletState = account.activeTonWallet;
    const [wallet, seqno] = await getWalletBalance(api, walletState);
    checkWalletBalanceOrDie(total, wallet);

    let buffer: Buffer;
    switch (signer.type) {
        case 'cell': {
            buffer = await createNftTransfer(
                timestamp,
                seqno,
                walletState,
                recipient.toAccount.address,
                nftItem.address,
                BigInt(nftTransferAmount.toString()),
                recipient.comment ? comment(recipient.comment) : null,
                signer
            );
            break;
        }
        case 'ledger': {
            if (account.type !== 'ledger') {
                throw new Error(`Unexpected account type: ${account.type}`);
            }
            buffer = await createLedgerNftTransfer(
                timestamp,
                seqno,
                account,
                recipient.toAccount.address,
                nftItem.address,
                BigInt(nftTransferAmount.toString()),
                recipient.comment ? comment(recipient.comment) : null,
                signer
            );
            break;
        }
    }

    await new BlockchainApi(api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc: buffer.toString('base64') }
    });
};

export const sendNftRenew = async (options: {
    api: APIConfig;
    account: AccountControllable;
    nftAddress: string;
    fee: TransferEstimationEvent;
    signer: CellSigner;
    amount: BigNumber;
}) => {
    const walletState = options.account.activeTonWallet;

    const timestamp = await getServerTime(options.api);
    const { seqno } = await getKeyPairAndSeqno({ ...options, walletState });

    const body = nftRenewBody({ queryId: getTonkeeperQueryId() });

    const cell = await createTransferMessage(
        {
            timestamp,
            seqno,
            state: walletState,
            signer: options.signer
        },
        { to: options.nftAddress, value: options.amount, body }
    );

    await new BlockchainApi(options.api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc: cell.toString('base64') }
    });
};

export const estimateNftRenew = async (options: {
    api: APIConfig;
    walletState: TonWalletStandard;
    nftAddress: string;
    amount: BigNumber;
}) => {
    const timestamp = await getServerTime(options.api);
    const [wallet, seqno] = await getWalletBalance(options.api, options.walletState);
    checkWalletPositiveBalanceOrDie(wallet);

    const body = nftRenewBody({ queryId: getTonkeeperQueryId() });

    const cell = await createTransferMessage(
        {
            timestamp,
            seqno,
            state: options.walletState,
            signer: signEstimateMessage
        },
        { to: options.nftAddress, value: options.amount, body }
    );

    return cell.toString('base64');
};

export const sendNftLink = async (options: {
    api: APIConfig;
    account: AccountControllable;
    nftAddress: string;
    linkToAddress: string;
    fee: TransferEstimationEvent;
    signer: CellSigner;
    amount: BigNumber;
}) => {
    const walletState = options.account.activeTonWallet;
    const timestamp = await getServerTime(options.api);
    const { seqno } = await getKeyPairAndSeqno({ ...options, walletState });

    const body = nftLinkBody({ ...options, queryId: getTonkeeperQueryId() });

    const cell = await createTransferMessage(
        {
            timestamp,
            seqno,
            state: walletState,
            signer: options.signer
        },
        { to: options.nftAddress, value: options.amount, body }
    );

    await new BlockchainApi(options.api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc: cell.toString('base64') }
    });
};

export const estimateNftLink = async (options: {
    api: APIConfig;
    walletState: TonWalletStandard;
    nftAddress: string;
    linkToAddress: string;
    amount: BigNumber;
}) => {
    const timestamp = await getServerTime(options.api);
    const [wallet, seqno] = await getWalletBalance(options.api, options.walletState);
    checkWalletPositiveBalanceOrDie(wallet);

    const body = nftLinkBody({ ...options, queryId: getTonkeeperQueryId() });

    const cell = await createTransferMessage(
        {
            timestamp,
            seqno,
            state: options.walletState,
            signer: signEstimateMessage
        },
        { to: options.nftAddress, value: options.amount, body }
    );

    return cell.toString('base64');
};
