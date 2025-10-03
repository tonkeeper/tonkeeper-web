import { beginCell, Cell, storeStateInit } from '@ton/core';
import { WalletContractV3R1 } from '@ton/ton/dist/wallets/WalletContractV3R1';
import { WalletContractV3R2 } from '@ton/ton/dist/wallets/WalletContractV3R2';
import { WalletContractV4 } from '@ton/ton/dist/wallets/WalletContractV4';
import { WalletContractV5Beta } from '@ton/ton/dist/wallets/WalletContractV5Beta';
import { WalletContractV5R1 } from '@ton/ton/dist/wallets/WalletContractV5R1';

import { Network } from '../../entries/network';
import { BlockchainConfig } from '../../tonApiV2';
import { TonWalletStandard, WalletVersion } from '../../entries/wallet';

const GAS_SAFETY_MULTIPLIER = 104n;
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
        lumpPrice = 400000,
        firstFrac = 21845
    } = config?._25?.msgForwardPrices ?? {};

    const timeChunk = 65536; // 2^16
    const msgFwdBitPrice = bitPrice;
    const msgFwdCellPrice = cellPrice;
    const gasPrice = (config._21?.gasLimitsPrices.gasPrice ?? 26214400) / timeChunk;

    // function computeStorageFee(v: WalletVersion, timeDelta: number): number {
    //     let usedStorageBits = 0;
    //     let usedStorageCells = 0;
    //
    //     switch (v) {
    //         case WalletVersion.V3R1:
    //             usedStorageBits = 1163;
    //             usedStorageCells = 3;
    //             break;
    //         case WalletVersion.V3R2:
    //             usedStorageBits = 1283;
    //             usedStorageCells = 3;
    //             break;
    //         case WalletVersion.V4R2:
    //             usedStorageBits = 5657;
    //             usedStorageCells = 22;
    //             break;
    //         case WalletVersion.V5_BETA:
    //             usedStorageBits = 709;
    //             usedStorageCells = 3;
    //             break;
    //         case WalletVersion.V5R1:
    //             usedStorageBits = 4980;
    //             usedStorageCells = 22;
    //             break;
    //         default:
    //             throw Error(`Unknown version: ${v}`);
    //     }
    //
    //     const used = usedStorageBits * storageBitPrice + usedStorageCells * storageCellPrice;
    //
    //     return Math.ceil((used * timeDelta) / timeChunk);
    // }

    function computeMsgFwdFee(msgBits: number, msgCells: number): number {
        const bitsPrice = msgFwdBitPrice * msgBits;
        const cellsPrice = msgFwdCellPrice * msgCells;

        return lumpPrice + Math.ceil((bitsPrice + cellsPrice) / timeChunk);
    }

    function computeActionFee(msgFee: number): number {
        return Math.floor((msgFee * firstFrac) / timeChunk);
    }

    function computeGasFee(v: WalletVersion): number {
        let gasUsed = 0;
        switch (v) {
            case WalletVersion.V3R1:
                gasUsed = 2275 + 642; // 2275 - газ за исполнение смарта, 624 - газ за отправку 1 сообщения
                break;
            case WalletVersion.V3R2:
                gasUsed = 2352 + 642; // 2352 - газ за исполнение смарта, 624 - газ за отправку 1 сообщения
                break;
            case WalletVersion.V4R2:
                gasUsed = 2666 + 642; // 2666 - газ за исполнение смарта, 624 - газ за отправку 1 сообщения
                break;
            case WalletVersion.V5_BETA:
                gasUsed = 3079 + 328; // 3079 - газ за исполнение смарта, 328 - газ за отправку 1 сообщения
                break;
            case WalletVersion.V5R1:
                gasUsed = 4222 + 717; // 4222 - газ за исполнение смарта, 717 - газ за отправку 1 сообщения
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

    function countBitsAndCellsInMsg(msg: Cell): [number, number] {
        let cells = 1;
        let bits = msg.bits.length;

        for (const ref of msg.refs) {
            const [innerBits, innerCells] = countBitsAndCellsInMsg(ref);
            bits += innerBits;
            cells += innerCells;
        }

        return [bits, cells];
    }

    const inMsgs = Cell.fromBoc(Buffer.from(inMsgBocHex, 'hex'));
    if (inMsgs.length > 1) {
        throw Error('inbound external msg must be single');
    }

    const outMsgs = Cell.fromBoc(Buffer.from(outMsgBocHex, 'hex'));
    if (outMsgs.length > 1) {
        throw Error('outbound internal msg must be single');
    }

    const inMsg = inMsgs[0];
    const outMsg = outMsgs[0];
    const [msgBits, msgCells] = countBitsAndCellsInMsg(inMsg);
    const [fwdMsgBits, fwdMsgCells] = countBitsAndCellsInMsg(outMsg);

    // const storageFee = computeStorageFee(v, timeDelta);
    const msgFwdFee = computeMsgFwdFee(fwdMsgBits, fwdMsgCells);
    const actionFee = computeActionFee(msgFwdFee);
    const gasFee = computeGasFee(walletVersion);
    const importFee = computeImportFee(msgBits, msgCells);

    const base = BigInt(actionFee + gasFee + importFee);

    return (base * GAS_SAFETY_MULTIPLIER) / GAS_SAFETY_MULTIPLIER_DENOMINATOR;
};
