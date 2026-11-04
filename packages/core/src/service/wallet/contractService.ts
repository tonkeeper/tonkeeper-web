import { beginCell, Cell, storeStateInit } from '@ton/core';

import { Network } from '../../entries/network';
import { TonWalletStandard, WalletVersion } from '../../entries/wallet';
import { BlockchainConfig } from '../../tonApiV2';
import { getStrategy, registerWalletContractStrategies } from './contracts';
import type { TonWalletContract, TonWalletContractArgs } from './contracts/ton-strategy';

const GAS_SAFETY_MULTIPLIER = 105n;
const GAS_SAFETY_MULTIPLIER_DENOMINATOR = 100n;

export type WalletContract = TonWalletContract;

export const walletContract = (
    publicKey: Buffer | string,
    version: WalletVersion,
    network: Network
): TonWalletContract => {
    registerWalletContractStrategies();
    return getStrategy<TonWalletContractArgs, TonWalletContract>('ton').create({
        publicKey,
        version,
        network
    });
};

export const walletContractFromState = (wallet: TonWalletStandard): TonWalletContract =>
    walletContract(wallet.publicKey, wallet.version, wallet.network ?? Network.MAINNET);

export const walletStateInitFromState = (wallet: TonWalletStandard): string =>
    beginCell()
        .store(storeStateInit(walletContractFromState(wallet).init))
        .endCell()
        .toBoc({ idx: false })
        .toString('base64');

interface ITxData {
    inMsgBocHex: string;
    outMsgBocHex: string;
    walletVersion: WalletVersion;
}

export const estimateWalletContractExecutionGasFee = (config: BlockchainConfig, data: ITxData) => {
    const { inMsgBocHex, outMsgBocHex, walletVersion } = data;

    const {
        bitPrice = 26214400,
        cellPrice = 2621440000,
        lumpPrice = 400000
    } = config?._25?.msgForwardPrices ?? {};

    const timeChunk = 65536; // 2^16
    const msgFwdBitPrice = bitPrice;
    const msgFwdCellPrice = cellPrice;
    const gasPrice = (config._21?.gasLimitsPrices.gasPrice ?? 26214400) / timeChunk;

    function computeMsgFwdFee(msgBits: number, msgCells: number): number {
        const bitsPrice = msgFwdBitPrice * msgBits;
        const cellsPrice = msgFwdCellPrice * msgCells;

        return lumpPrice + Math.ceil((bitsPrice + cellsPrice) / timeChunk);
    }

    function computeGasFee(v: WalletVersion): number {
        let gasUsed = 0;
        switch (v) {
            case WalletVersion.V4R2:
                gasUsed = 6615;
                break;
            case WalletVersion.V5_BETA:
                gasUsed = 8444;
                break;
            case WalletVersion.V5R1:
                gasUsed = 8444;
                break;
            default:
                throw Error(`Unknown version: ${v}`);
        }

        return gasUsed * gasPrice;
    }

    function computeImportFee(msgBits: number, msgCells: number): number {
        return (
            lumpPrice +
            Math.ceil((msgFwdBitPrice * msgBits + msgFwdCellPrice * msgCells) / timeChunk)
        );
    }

    function countBitsAndCellsInMsg(msg: Cell, hashes: Set<Buffer>): [number, number] {
        const temp = hashes.size;
        hashes.add(msg.hash());
        if (hashes.size === temp) {
            return [0, 0];
        }

        let cells = 1;
        let bits = msg.bits.length;

        for (let i = 0; i < msg.refs.length; i++) {
            const ref = msg.refs[i];
            const [innerBits, innerCells] = countBitsAndCellsInMsg(ref, hashes);
            bits += innerBits;
            cells += innerCells;
        }

        return [bits, cells];
    }

    const inMsgs = Cell.fromBoc(Buffer.from(inMsgBocHex, 'hex'));
    if (inMsgs.length > 1) {
        throw Error('inbound external msg must be single');
    }

    const inMsgHashes = new Set<Buffer>();
    let [msgBits, msgCells] = [0, 0];
    const inMsg = inMsgs[0];
    for (const ref of inMsg.refs) {
        const [innerMsgBits, innerMsgCells] = countBitsAndCellsInMsg(ref, inMsgHashes);
        msgBits += innerMsgBits;
        msgCells += innerMsgCells;
    }

    let [fwdMsgBits, fwdMsgCells] = [0, 0];
    const outMsgs = Cell.fromBoc(Buffer.from(outMsgBocHex, 'hex'));
    if (outMsgs.length > 1) {
        throw Error('outbound internal msg must be single');
    }
    const outMsg = outMsgs[0];
    const fwdMsgHashes = new Set<Buffer>();
    for (const ref of outMsg.refs) {
        const [innerFwdMsgBits, innerFwdMsgCells] = countBitsAndCellsInMsg(ref, fwdMsgHashes);
        fwdMsgBits += innerFwdMsgBits;
        fwdMsgCells += innerFwdMsgCells;
    }

    const msgFwdFee = computeMsgFwdFee(fwdMsgBits, fwdMsgCells);
    const gasFee = computeGasFee(walletVersion);
    const importFee = computeImportFee(msgBits, msgCells);

    const base = BigInt(Math.ceil(msgFwdFee + gasFee + importFee));

    return (base * GAS_SAFETY_MULTIPLIER) / GAS_SAFETY_MULTIPLIER_DENOMINATOR;
};
