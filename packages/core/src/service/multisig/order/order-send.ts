import { beginCell, toNano } from '@ton/core';
import { MultisigOp, MultisigParams } from '../utils';
import { APIConfig } from '../../../entries/apis';
import { TonWalletStandard } from '../../../entries/wallet';
import { BlockchainApi, Multisig } from '../../../tonApiV2';
import {
    createTransferMessage,
    getWalletSeqnoAndCheckBalance,
    getServerTime,
    getTonkeeperQueryId
} from '../../transfer/common';
import BigNumber from 'bignumber.js';
import { CellSigner } from '../../../entries/signer';
import { createNewOrderMessage, MAX_ORDER_SEQNO, NewOrder } from './order-utils';

const createOrderAmount = toNano(0.2);
const signOrderAmount = toNano(0.1);

export async function sendCreateOrder(options: {
    api: APIConfig;
    hostWallet: TonWalletStandard;
    multisig: Pick<Multisig, 'address' | 'signers' | 'proposers'>;
    order: NewOrder;
    signer: CellSigner;
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

    const queryId = getTonkeeperQueryId();

    const body = createNewOrderMessage(
        options.order.actions,
        options.order.validUntilSeconds,
        isSigner,
        addrIdx,
        MAX_ORDER_SEQNO,
        queryId
    );

    const timestamp = await getServerTime(options.api);
    const { seqno } = await getWalletSeqnoAndCheckBalance({
        ...options,
        walletState: options.hostWallet,
        amount: BigNumber(createOrderAmount.toString())
    });

    const boc = await createTransferMessage(
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
}

export async function signOrder(options: {
    api: APIConfig;
    walletState: TonWalletStandard;
    multisig: Pick<Multisig, 'signers'>;
    orderAddress: string;
    signer: CellSigner;
}) {
    const addrIdx = options.multisig.signers.indexOf(options.walletState.rawAddress);
    if (addrIdx === -1) {
        throw new Error('Sender is not a signer');
    }

    const { seqno } = await getWalletSeqnoAndCheckBalance({
        ...options,
        amount: BigNumber(signOrderAmount.toString())
    });

    const queryId = getTonkeeperQueryId();
    const body = beginCell()
        .storeUint(MultisigOp.order.approve, MultisigParams.bitsize.op)
        .storeUint(queryId, MultisigParams.bitsize.queryId)
        .storeUint(addrIdx, MultisigParams.bitsize.signerIndex)
        .endCell();

    const boc = await createTransferMessage(
        {
            state: options.walletState,
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
