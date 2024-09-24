import {
    Address,
    beginCell,
    Cell,
    comment,
    external,
    internal,
    loadStateInit,
    MessageRelaxed,
    storeMessage,
    toNano
} from '@ton/core';
import { Maybe } from '@ton/core/dist/utils/maybe';
import { sign } from '@ton/crypto';
import BigNumber from 'bignumber.js';
import nacl from 'tweetnacl';
import { APIConfig } from '../../entries/apis';
import { TonRecipient, TransferEstimationEventFee } from '../../entries/send';
import { TonWalletStandard } from '../../entries/wallet';
import { CellSigner, Signer } from '../../entries/signer';
import { NotEnoughBalanceError } from '../../errors/NotEnoughBalanceError';
import {
    Account,
    AccountsApi,
    EmulationApi,
    LiteServerApi,
    Multisig,
    WalletApi
} from '../../tonApiV2';
import { WalletContract, walletContractFromState } from '../wallet/contractService';
import { orderActionMinAmount, sendCreateOrder } from '../multisig/order/order-send';
import { estimateNewOrder } from '../multisig/order/order-estimate';

export enum SendMode {
    CARRY_ALL_REMAINING_BALANCE = 128,
    CARRY_ALL_REMAINING_INCOMING_VALUE = 64,
    DESTROY_ACCOUNT_IF_ZERO = 32,
    PAY_GAS_SEPARATELY = 1,
    IGNORE_ERRORS = 2,
    NONE = 0
}

export type StateInit = ReturnType<typeof toStateInit>;

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

export const externalMessage = (contract: WalletContract, seqno: number, body: Cell) => {
    return beginCell()
        .storeWritable(
            storeMessage(
                external({
                    to: contract.address,
                    init: seqno === 0 ? contract.init : undefined,
                    body: body
                })
            )
        )
        .endCell();
};

export const forwardPayloadComment = (commentValue: string) => {
    if (!commentValue) beginCell();
    return comment(commentValue).asBuilder();
};

export const seeIfBalanceError = (e: unknown): e is Error => {
    return e instanceof Error && e.message.startsWith('Not enough account');
};

export const checkWalletBalanceOrDie = (total: BigNumber, wallet: Account) => {
    if (total.isGreaterThanOrEqualTo(wallet.balance)) {
        throw new NotEnoughBalanceError(
            `Not enough account "${wallet.address}" amount: "${
                wallet.balance
            }", transaction total: ${total.toString()}`,
            new BigNumber(wallet.balance),
            total
        );
    }
};

export const checkWalletPositiveBalanceOrDie = (wallet: Account) => {
    if (new BigNumber(wallet.balance).isLessThan(toNano('0.01').toString())) {
        throw new Error(`Not enough account "${wallet.address}" amount: "${wallet.balance}"`);
    }
};

export const getWalletSeqNo = async (api: APIConfig, accountId: string) => {
    const { seqno } = await new WalletApi(api.tonApiV2)
        .getAccountSeqno({ accountId })
        .catch(() => ({ seqno: 0 }));
    return seqno;
};

export const getWalletBalance = async (api: APIConfig, walletState: { rawAddress: string }) => {
    const wallet = await new AccountsApi(api.tonApiV2).getAccount({
        accountId: walletState.rawAddress
    });
    const seqno = await getWalletSeqNo(api, walletState.rawAddress);

    return [wallet, seqno] as const;
};

export const getServerTime = async (api: APIConfig) => {
    const { time } = await new LiteServerApi(api.tonApiV2).getRawTime();
    return time;
};

export const seeIfTimeError = (e: unknown): e is Error => {
    return e instanceof Error && e.message.startsWith('Time and date are incorrect');
};

export const createAutoFeeTransferMessage = async (
    api: APIConfig,
    wallet: {
        seqno: number;
        state: TonWalletStandard;
        signer: Signer;
        timestamp: number;
    },
    transaction: {
        to: string;
        value: string | bigint | BigNumber;
        body?: string | Cell | null;
        init?: StateInit | null;
    }
) => {
    const bocToEstimate = await createTransferMessage(
        { ...wallet, signer: signEstimateMessage },
        transaction
    );

    const result = await new EmulationApi(api.tonApiV2).emulateMessageToWallet({
        emulateMessageToWalletRequest: { boc: bocToEstimate.toString('base64') }
    });

    const finalAttachValue = new BigNumber(result.event.extra)
        .absoluteValue()
        .plus(transaction.value.toString());

    const [acc] = await getWalletBalance(api, wallet.state);
    checkWalletBalanceOrDie(finalAttachValue, acc);

    return createTransferMessage(wallet, { ...transaction, value: finalAttachValue });
};

export const createTransferMessage = async (
    wallet: {
        seqno: number;
        state: TonWalletStandard;
        signer: Signer;
        timestamp: number;
    },
    transaction: {
        to: string;
        value: string | bigint | BigNumber;
        body?: string | Cell | null;
        init?: StateInit | null;
    }
) => {
    const value =
        transaction.value instanceof BigNumber ? transaction.value.toFixed(0) : transaction.value;
    const contract = walletContractFromState(wallet.state);
    let transfer: Cell;

    if (wallet.signer.type === 'ledger') {
        transfer = await wallet.signer({
            to: Address.parse(transaction.to),
            bounce: true,
            amount: BigInt(value),
            seqno: wallet.seqno,
            timeout: getTTL(wallet.timestamp),
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
            payload: transaction.body
                ? {
                      type: 'unsafe',
                      message:
                          typeof transaction.body == 'string'
                              ? Cell.fromBase64(transaction.body)
                              : transaction.body
                  }
                : undefined
        });
    } else {
        transfer = await contract.createTransferAndSignRequestAsync({
            seqno: wallet.seqno,
            signer: wallet.signer,
            timeout: getTTL(wallet.timestamp),
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
            messages: [
                internal({
                    to: Address.parse(transaction.to),
                    bounce: true,
                    value: BigInt(value),
                    body: transaction.body,
                    init: transaction.init
                })
            ]
        });
    }
    return externalMessage(contract, wallet.seqno, transfer).toBoc();
};

export const signEstimateMessage = async (message: Cell): Promise<Buffer> => {
    return sign(message.hash(), Buffer.alloc(64));
};
signEstimateMessage.type = 'cell' as const;

export async function getWalletSeqnoAndCheckBalance(options: {
    api: APIConfig;
    walletState: { rawAddress: string };
    fee?: { event: { extra: number | BigNumber } };
    amount: BigNumber;
}) {
    const total = options.fee ? options.amount.minus(options.fee.event.extra) : options.amount;

    const [wallet, seqno] = await getWalletBalance(options.api, options.walletState);
    checkWalletBalanceOrDie(total, wallet);
    return { seqno };
}

export const getTTL = (unixTimestamp: number) => {
    // int Seconds
    return unixTimestamp + 300; // 5min
};

export const getTonkeeperQueryId = () => {
    return beginCell()
        .storeUint(0x546de4ef, 32) //crc32("tonkeeper")
        .storeBuffer(Buffer.from(nacl.randomBytes(4))) //random 32 bits
        .asSlice()
        .loadIntBig(64);
};

/*
 * Raw address is bounceable by default,
 * Please make a note that in the TonWeb Raw address is non bounceable by default
 */
export const seeIfAddressBounceable = (address: string) => {
    return Address.isFriendly(address) ? Address.parseFriendly(address).isBounceable : true;
};

export const seeIfTransferBounceable = (account: Account, recipient: TonRecipient) => {
    if ('dns' in recipient) {
        return false;
    }
    if (!seeIfAddressBounceable(recipient.address)) {
        return false;
    }

    return account.status === 'active';
};

export const sendMultisigTransfer = async ({
    api,
    hostWallet,
    multisig,
    message,
    amount,
    fee,
    signer,
    ttlSeconds
}: {
    api: APIConfig;
    hostWallet: TonWalletStandard;
    multisig: Pick<Multisig, 'address' | 'signers' | 'proposers'>;
    message: MessageRelaxed;
    fee: TransferEstimationEventFee;
    amount: BigNumber;
    signer: CellSigner;
    ttlSeconds: number;
}): Promise<void> => {
    const timestamp = await getServerTime(api);

    await getWalletSeqnoAndCheckBalance({
        api,
        walletState: { rawAddress: multisig.address },
        amount,
        fee
    });
    await getWalletSeqnoAndCheckBalance({
        walletState: hostWallet,
        amount: orderActionMinAmount,
        api
    });

    await sendCreateOrder({
        hostWallet,
        multisig,
        api,
        signer,
        order: {
            validUntilSeconds: timestamp + ttlSeconds,
            actions: [
                {
                    type: 'transfer',
                    message,
                    sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS
                }
            ]
        }
    });
};

export const estimateMultisigTransfer = async ({
    api,
    hostWallet,
    multisig,
    message,
    amount
}: {
    api: APIConfig;
    hostWallet: TonWalletStandard;
    multisig: Pick<Multisig, 'address' | 'signers' | 'threshold'>;
    message: MessageRelaxed;
    amount: BigNumber;
}) => {
    const timestamp = await getServerTime(api);
    await getWalletSeqnoAndCheckBalance({
        api,
        walletState: hostWallet,
        amount
    });

    return estimateNewOrder({
        multisig,
        api,
        order: {
            validUntilSeconds: getTTL(timestamp),
            actions: [
                {
                    type: 'transfer',
                    message,
                    sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS
                }
            ]
        }
    });
};
