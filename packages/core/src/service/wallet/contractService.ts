import { beginCell, Cell, storeStateInit } from '@ton/core';
import { WalletContractV3R1 } from '@ton/ton/dist/wallets/WalletContractV3R1';
import { WalletContractV3R2 } from '@ton/ton/dist/wallets/WalletContractV3R2';
import { WalletContractV4 } from '@ton/ton/dist/wallets/WalletContractV4';
import { WalletContractV5Beta } from '@ton/ton/dist/wallets/WalletContractV5Beta';
import { WalletContractV5R1 } from '@ton/ton/dist/wallets/WalletContractV5R1';

import { Network } from '../../entries/network';
import { BlockchainConfig } from '../../tonApiV2';
import { TonWalletStandard, WalletVersion } from '../../entries/wallet';

const GAS_SAFETY_MULTIPLIER = 105n;
const GAS_SAFETY_MULTIPLIER_DENOMINATOR = 100n;

export const walletContractFromState = (wallet: TonWalletStandard) => {
    const publicKey = Buffer.from(wallet.publicKey, 'hex');
    return walletContract(publicKey, wallet.version, wallet.network ?? Network.MAINNET);
};

const workchain = 0;

export type WalletContract = ReturnType<typeof walletContract>;

export const walletContract = (
    publicKey: Buffer | string,
    version: WalletVersion,
    network: Network
) => {
    if (typeof publicKey === 'string') {
        publicKey = Buffer.from(publicKey, 'hex');
    }

    switch (version) {
        case WalletVersion.V3R1:
            return WalletContractV3R1.create({ workchain, publicKey });
        case WalletVersion.V3R2:
            return WalletContractV3R2.create({ workchain, publicKey });
        case WalletVersion.V4R1:
            throw new Error('Unsupported wallet contract version - v4R1');
        case WalletVersion.V4R2:
            return WalletContractV4.create({ workchain, publicKey });
        case WalletVersion.V5_BETA:
            return WalletContractV5Beta.create({
                walletId: {
                    networkGlobalId: network
                },
                publicKey
            });
        case WalletVersion.V5R1:
            return WalletContractV5R1.create({
                workchain: workchain,
                walletId: {
                    networkGlobalId: network
                },
                publicKey
            });
    }
};

export const walletStateInitFromState = (wallet: TonWalletStandard) => {
    const contract = walletContractFromState(wallet);

    return beginCell()
        .store(storeStateInit(contract.init))
        .endCell()
        .toBoc({ idx: false })
        .toString('base64');
};

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
        let temp = hashes.size;
        hashes.add(msg.hash());
        if (hashes.size == temp) {
            return [0, 0];
        }

        let cells = 1;
        let bits = msg.bits.length;

        for (let i = 0; i < msg.refs.length; i++) {
            const ref = msg.refs[i];
            let [innerBits, innerCells] = countBitsAndCellsInMsg(ref, hashes);
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
        let [innerMsgBits, innerMsgCells] = countBitsAndCellsInMsg(ref, inMsgHashes);
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

    const base = BigInt(msgFwdFee + gasFee + importFee);

    return (base * GAS_SAFETY_MULTIPLIER) / GAS_SAFETY_MULTIPLIER_DENOMINATOR;
};
