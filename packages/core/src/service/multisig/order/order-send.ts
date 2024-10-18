import { beginCell, toNano } from '@ton/core';
import { MultisigOp, MultisigParams } from '../utils';
import { APIConfig } from '../../../entries/apis';
import { TonWalletStandard } from '../../../entries/wallet';
import { BlockchainApi, Multisig } from '../../../tonApiV2';
import {
    getWalletSeqnoAndCheckBalance,
    getServerTime,
    getTonkeeperQueryId,
    createAutoFeeTransferMessage
} from '../../transfer/common';
import BigNumber from 'bignumber.js';
import { Signer } from '../../../entries/signer';
import { createNewOrderMessage, NewOrder } from './order-utils';

const createOrderAmount = toNano(0.05);
const signOrderAmount = toNano(0.05);
export const orderActionMinAmount = new BigNumber(
    createOrderAmount > signOrderAmount ? createOrderAmount.toString() : signOrderAmount.toString()
);

const MAX_ORDER_SEQNO =
    115792089237316195423570985008687907853269984665640564039457584007913129639935n;

export const getOrderSeqno = async (options: {
    api: APIConfig;
    multisig: Pick<Multisig, 'address'>;
}) => {
    const result = await new BlockchainApi(options.api.tonApiV2).execGetMethodForBlockchainAccount({
        accountId: options.multisig.address,
        methodName: 'get_multisig_data'
    });

    const nextSeqno = result.stack[0]?.num;
    if (nextSeqno === undefined) {
        throw new Error("Can't get next seqno");
    }

    let nextSeqnoParsed = parseInt(nextSeqno);

    if (nextSeqnoParsed < -1) {
        throw new Error('Invalid next seqno');
    }

    /**
     * if ~ allow_arbitrary_order_seqno
     */
    if (nextSeqnoParsed !== -1) {
        return MAX_ORDER_SEQNO;
    } else {
        return BigInt(Date.now());
    }
};

export async function sendCreateOrder(options: {
    api: APIConfig;
    hostWallet: TonWalletStandard;
    multisig: Pick<Multisig, 'address' | 'signers' | 'proposers'>;
    order: NewOrder;
    signer: Signer;
}) {
    let isSigner = false;
    let addrIdx = options.multisig.signers.indexOf(options.hostWallet.rawAddress);
    if (addrIdx !== -1) {
        isSigner = true;
    } else {
        addrIdx = options.multisig.proposers.indexOf(options.hostWallet.rawAddress);
        if (addrIdx === -1) {
            throw new Error('Sender is not a signer or proposer');
        }
    }

    const newOrderSeqno = await getOrderSeqno({ api: options.api, multisig: options.multisig });

    const queryId = getTonkeeperQueryId();

    const body = createNewOrderMessage(
        options.order.actions,
        options.order.validUntilSeconds,
        isSigner,
        addrIdx,
        newOrderSeqno,
        queryId
    );

    const timestamp = await getServerTime(options.api);
    const { seqno } = await getWalletSeqnoAndCheckBalance({
        ...options,
        walletState: options.hostWallet,
        amount: BigNumber(createOrderAmount.toString())
    });

    const boc = await createAutoFeeTransferMessage(
        options.api,
        {
            state: options.hostWallet,
            timestamp,
            seqno,
            signer: options.signer
        },
        {
            value: createOrderAmount,
            to: options.multisig.address,
            body
        }
    );

    await new BlockchainApi(options.api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc: boc.toString('base64') }
    });

    return boc;
}

export async function signOrder(options: {
    api: APIConfig;
    hostWallet: TonWalletStandard;
    multisig: Pick<Multisig, 'signers'>;
    orderAddress: string;
    signer: Signer;
}) {
    const addrIdx = options.multisig.signers.indexOf(options.hostWallet.rawAddress);
    if (addrIdx === -1) {
        throw new Error('Sender is not a signer');
    }

    const { seqno } = await getWalletSeqnoAndCheckBalance({
        ...options,
        walletState: options.hostWallet,
        amount: BigNumber(signOrderAmount.toString())
    });

    const queryId = getTonkeeperQueryId();
    const body = beginCell()
        .storeUint(MultisigOp.order.approve, MultisigParams.bitsize.op)
        .storeUint(queryId, MultisigParams.bitsize.queryId)
        .storeUint(addrIdx, MultisigParams.bitsize.signerIndex)
        .endCell();

    const boc = await createAutoFeeTransferMessage(
        options.api,
        {
            state: options.hostWallet,
            timestamp: await getServerTime(options.api),
            seqno,
            signer: options.signer
        },
        {
            value: signOrderAmount,
            to: options.orderAddress,
            body
        }
    );

    await new BlockchainApi(options.api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc: boc.toString('base64') }
    });
}
