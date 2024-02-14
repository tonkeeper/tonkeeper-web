import BigNumber from 'bignumber.js';
import { Address, beginCell, Cell, comment, toNano } from 'ton-core';
import { mnemonicToPrivateKey } from 'ton-crypto';
import { APIConfig } from '../../entries/apis';
import { TonRecipientData } from '../../entries/send';
import { WalletState } from '../../entries/wallet';
import { BlockchainApi, EmulationApi, MessageConsequences, NftItem } from '../../tonApiV2';
import {
    checkServiceTimeOrDie,
    checkWalletBalanceOrDie,
    checkWalletPositiveBalanceOrDie,
    createTransferMessage,
    getKeyPairAndSeqno,
    getTonkeeperQueryId,
    getWalletBalance
} from './common';

const initNftTransferAmount = toNano('1');
const nftTransferForwardAmount = BigInt('1');

const nftTransferBody = (params: {
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
    seqno: number,
    walletState: WalletState,
    recipientAddress: string,
    nftAddress: string,
    nftTransferAmount: bigint,
    forwardPayload: Cell | null = null,
    secretKey: Buffer = Buffer.alloc(64)
) => {
    const body = nftTransferBody({
        queryId: getTonkeeperQueryId(),
        newOwnerAddress: Address.parse(recipientAddress),
        responseAddress: Address.parse(walletState.active.rawAddress),
        forwardAmount: nftTransferForwardAmount,
        forwardPayload
    });

    return createTransferMessage(
        { seqno, state: walletState, secretKey },
        { to: nftAddress, value: nftTransferAmount, body }
    );
};

export const estimateNftTransfer = async (
    api: APIConfig,
    walletState: WalletState,
    recipient: TonRecipientData,
    nftItem: NftItem
) => {
    await checkServiceTimeOrDie(api);
    const [wallet, seqno] = await getWalletBalance(api, walletState);
    checkWalletPositiveBalanceOrDie(wallet);

    const cell = createNftTransfer(
        seqno,
        walletState,
        recipient.toAccount.address,
        nftItem.address,
        initNftTransferAmount,
        recipient.comment ? comment(recipient.comment) : null
    );

    const emulation = await new EmulationApi(api.tonApiV2).emulateMessageToWallet({
        emulateMessageToWalletRequest: { boc: cell.toString('base64') }
    });
    return emulation;
};

export const sendNftTransfer = async (
    api: APIConfig,
    walletState: WalletState,
    recipient: TonRecipientData,
    nftItem: NftItem,
    fee: MessageConsequences,
    mnemonic: string[]
) => {
    await checkServiceTimeOrDie(api);
    const keyPair = await mnemonicToPrivateKey(mnemonic);

    const min = toNano('0.05').toString();
    let nftTransferAmount = new BigNumber(fee.event.extra).multipliedBy(-1).plus(min);

    nftTransferAmount = nftTransferAmount.isLessThan(min) ? new BigNumber(min) : nftTransferAmount;

    const total = nftTransferAmount.plus(fee.event.extra * -1);

    if (nftTransferAmount.isLessThanOrEqualTo(0)) {
        throw new Error(`Unexpected nft transfer amount: ${nftTransferAmount.toString()}`);
    }

    const [wallet, seqno] = await getWalletBalance(api, walletState);
    checkWalletBalanceOrDie(total, wallet);

    const cell = createNftTransfer(
        seqno,
        walletState,
        recipient.toAccount.address,
        nftItem.address,
        BigInt(nftTransferAmount.toString()),
        recipient.comment ? comment(recipient.comment) : null,
        keyPair.secretKey
    );

    await new BlockchainApi(api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc: cell.toString('base64') }
    });
};

export const sendNftRenew = async (options: {
    api: APIConfig;
    walletState: WalletState;
    nftAddress: string;
    fee: MessageConsequences;
    mnemonic: string[];
    amount: BigNumber;
}) => {
    const { seqno, keyPair } = await getKeyPairAndSeqno(options);

    const body = nftRenewBody({ queryId: getTonkeeperQueryId() });

    const cell = createTransferMessage(
        {
            seqno,
            state: options.walletState,
            secretKey: keyPair.secretKey
        },
        { to: options.nftAddress, value: options.amount, body }
    );

    await new BlockchainApi(options.api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc: cell.toString('base64') }
    });
};

export const estimateNftRenew = async (options: {
    api: APIConfig;
    walletState: WalletState;
    nftAddress: string;
    amount: BigNumber;
}) => {
    await checkServiceTimeOrDie(options.api);
    const [wallet, seqno] = await getWalletBalance(options.api, options.walletState);
    checkWalletPositiveBalanceOrDie(wallet);

    const body = nftRenewBody({ queryId: getTonkeeperQueryId() });

    const cell = createTransferMessage(
        {
            seqno,
            state: options.walletState,
            secretKey: Buffer.alloc(64)
        },
        { to: options.nftAddress, value: options.amount, body }
    );

    return cell.toString('base64');
};

export const sendNftLink = async (options: {
    api: APIConfig;
    walletState: WalletState;
    nftAddress: string;
    linkToAddress: string;
    fee: MessageConsequences;
    mnemonic: string[];
    amount: BigNumber;
}) => {
    const { seqno, keyPair } = await getKeyPairAndSeqno(options);

    const body = nftLinkBody({ ...options, queryId: getTonkeeperQueryId() });

    const cell = createTransferMessage(
        {
            seqno,
            state: options.walletState,
            secretKey: keyPair.secretKey
        },
        { to: options.nftAddress, value: options.amount, body }
    );

    await new BlockchainApi(options.api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc: cell.toString('base64') }
    });
};

export const estimateNftLink = async (options: {
    api: APIConfig;
    walletState: WalletState;
    nftAddress: string;
    linkToAddress: string;
    amount: BigNumber;
}) => {
    await checkServiceTimeOrDie(options.api);
    const [wallet, seqno] = await getWalletBalance(options.api, options.walletState);
    checkWalletPositiveBalanceOrDie(wallet);

    const body = nftLinkBody({ ...options, queryId: getTonkeeperQueryId() });

    const cell = createTransferMessage(
        {
            seqno,
            state: options.walletState,
            secretKey: Buffer.alloc(64)
        },
        { to: options.nftAddress, value: options.amount, body }
    );

    return cell.toString('base64');
};
