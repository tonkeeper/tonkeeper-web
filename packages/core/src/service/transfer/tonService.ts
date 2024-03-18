import { Address, Cell, internal, loadStateInit } from '@ton/core';
import { Maybe } from '@ton/core/dist/utils/maybe';
import { mnemonicToPrivateKey } from '@ton/crypto';
import BigNumber from 'bignumber.js';
import { APIConfig } from '../../entries/apis';
import { AssetAmount } from '../../entries/crypto/asset/asset-amount';
import { TonRecipient, TonRecipientData } from '../../entries/send';
import { TonConnectTransactionPayload } from '../../entries/tonConnect';
import { WalletState } from '../../entries/wallet';
import {
    Account,
    AccountsApi,
    BlockchainApi,
    EmulationApi,
    MessageConsequences
} from '../../tonApiV2';
import { walletContractFromState } from '../wallet/contractService';
import {
    SendMode,
    checkServiceTimeOrDie,
    checkWalletBalanceOrDie,
    checkWalletPositiveBalanceOrDie,
    externalMessage,
    getTTL,
    getWalletBalance,
    getWalletSeqNo
} from './common';

export type AccountsMap = Map<string, Account>;

export type EstimateData = {
    accounts: AccountsMap;
    accountEvent: MessageConsequences;
};

export const getAccountsMap = async (
    api: APIConfig,
    params: TonConnectTransactionPayload
): Promise<AccountsMap> => {
    const accounts = await Promise.all(
        params.messages.map(async message => {
            return [
                message.address,
                await new AccountsApi(api.tonApiV2).getAccount({ accountId: message.address })
            ] as const;
        })
    );
    return new Map<string, Account>(accounts);
};

/*
 * Raw address is bounceable by default,
 * Please make a note that in the TonWeb Raw address is non bounceable by default
 */
const seeIfAddressBounceable = (address: string) => {
    return Address.isFriendly(address) ? Address.parseFriendly(address).isBounceable : true;
};

/*
 * Allow to send non bounceable only if address is non bounceable and target contract is non active
 */
const seeIfBounceable = (accounts: AccountsMap, address: string) => {
    const bounceableAddress = seeIfAddressBounceable(address);
    const toAccount = accounts.get(address);
    const activeContract = toAccount && toAccount.status === 'active';

    return bounceableAddress || activeContract;
};

const toStateInit = (stateInit?: string): { code: Maybe<Cell>; data: Maybe<Cell> } | undefined => {
    if (!stateInit) {
        return undefined;
    }
    const { code, data } = loadStateInit(Cell.fromBase64(stateInit).asSlice());
    return {
        code,
        data
    };
};

const seeIfTransferBounceable = (account: Account, recipient: TonRecipient) => {
    if ('dns' in recipient) {
        return false;
    }
    if (!seeIfAddressBounceable(recipient.address)) {
        return false;
    }

    return account.status === 'active';
};

const createTonTransfer = (
    seqno: number,
    walletState: WalletState,
    recipient: TonRecipientData,
    weiAmount: BigNumber,
    isMax: boolean,
    secretKey: Buffer = Buffer.alloc(64)
) => {
    const contract = walletContractFromState(walletState);
    const transfer = contract.createTransfer({
        seqno,
        secretKey,
        timeout: getTTL(),
        sendMode: isMax
            ? SendMode.CARRY_ALL_REMAINING_BALANCE
            : SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        messages: [
            internal({
                to: recipient.toAccount.address,
                bounce: seeIfTransferBounceable(recipient.toAccount, recipient.address),
                value: BigInt(weiAmount.toFixed(0)),
                body: recipient.comment !== '' ? recipient.comment : undefined
            })
        ]
    });
    return externalMessage(contract, seqno, transfer).toBoc();
};

const createTonConnectTransfer = (
    seqno: number,
    walletState: WalletState,
    accounts: AccountsMap,
    params: TonConnectTransactionPayload,
    secretKey: Buffer = Buffer.alloc(64)
) => {
    const contract = walletContractFromState(walletState);

    const transfer = contract.createTransfer({
        seqno,
        secretKey,
        timeout: getTTL(),
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        messages: params.messages.map(item =>
            internal({
                to: item.address,
                bounce: seeIfBounceable(accounts, item.address),
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
    await checkServiceTimeOrDie(api);
    const [wallet, seqno] = await getWalletBalance(api, walletState);
    if (!isMax) {
        checkWalletPositiveBalanceOrDie(wallet);
    }

    const cell = createTonTransfer(seqno, walletState, recipient, weiAmount, isMax);

    const emulation = await new EmulationApi(api.tonApiV2).emulateMessageToWallet({
        emulateMessageToWalletRequest: { boc: cell.toString('base64') }
    });

    return emulation;
};

export const estimateTonConnectTransfer = async (
    api: APIConfig,
    walletState: WalletState,
    accounts: AccountsMap,
    params: TonConnectTransactionPayload
) => {
    await checkServiceTimeOrDie(api);
    const [wallet, seqno] = await getWalletBalance(api, walletState);
    checkWalletPositiveBalanceOrDie(wallet);

    const cell = createTonConnectTransfer(seqno, walletState, accounts, params);

    return await new EmulationApi(api.tonApiV2).emulateMessageToWallet({
        emulateMessageToWalletRequest: { boc: cell.toString('base64') }
    });
};

export const sendTonConnectTransfer = async (
    api: APIConfig,
    walletState: WalletState,
    accounts: AccountsMap,
    params: TonConnectTransactionPayload,
    mnemonic: string[]
) => {
    await checkServiceTimeOrDie(api);
    const keyPair = await mnemonicToPrivateKey(mnemonic);
    const seqno = await getWalletSeqNo(api, walletState.active.rawAddress);

    const external = createTonConnectTransfer(
        seqno,
        walletState,
        accounts,
        params,
        keyPair.secretKey
    );

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
    fee: MessageConsequences,
    mnemonic: string[]
) => {
    await checkServiceTimeOrDie(api);
    const keyPair = await mnemonicToPrivateKey(mnemonic);

    const total = new BigNumber(fee.event.extra).multipliedBy(-1).plus(amount.weiAmount);

    const [wallet, seqno] = await getWalletBalance(api, walletState);
    if (!isMax) {
        checkWalletBalanceOrDie(total, wallet);
    }

    const cell = createTonTransfer(
        seqno,
        walletState,
        recipient,
        amount.weiAmount,
        isMax,
        keyPair.secretKey
    );

    await new BlockchainApi(api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc: cell.toString('base64') }
    });
};
