import {
    Address,
    Cell,
    beginCell,
    contractAddress,
    StateInit as TonStateInit,
    toNano,
    SendMode,
    internal,
    storeStateInit
} from '@ton/core';
import { WalletContractV4 } from '@ton/ton/dist/wallets/WalletContractV4';
import { OutActionWalletV5 } from '@ton/ton/dist/wallets/v5beta/WalletV5OutActions';

import { getTonkeeperQueryId } from '../utils';
import { assertUnreachable } from '../../../utils/types';
import { TonWalletStandard, WalletVersion } from '../../../entries/wallet';

export type TonRawTransaction = {
    to: Address;
    value: bigint;
    bounce?: boolean;
    body?: Cell;
    init?: TonStateInit;
    sendMode?: SendMode;
};

/**
 * https://github.com/tonkeeper/w5-subscriptions/blob/main/build/NativeSubExt.compiled.json
 */
export const SUBSCRIPTION_V2_CODE_BOC = Buffer.from(
    'b5ee9c7241022101000812000114ff00f4a413f4bcf2c80b01020120021b02014803120202ce04100457433d0d30331fa403002d72c278363ab3ce302d72c23239ba394e302d72c228411c764e302d72c27b8bc1e5c805070a0c01fe30ed44d0f82301f404d31f31d31f20d301d431d31ffa00fa40d30731fa4031d33f31fa00d31fd74c06c001975275a029bec300923470e2f2e1d60ac705f2e1cf5078bef2e1cc5142bef2e1d95253206e915b8e1a21c000915be0d0fa40d1c8cf8508ce01fa0270cf0b6ac973fb00e202d0fa40d4d181571370f836aa01803206006a814e208209e1338070f837a05006a070fb02c8cf8508ce71cf0b6e14ccc98306fb006d02a001c8f400cf9000000002cb1fcec9ed5401ce5bed44d0f404d31fd31fd30120d431d31f31fa0031fa40d307fa403004c001f2e1d65373c7058e2e3016c70594840ff2f0e1f82821fa4402fa4402bd925b7f93bdc300e29ec8cf8508ce70cf0b6ec98306fb009130e2e30d02c8f400cb1fcb1fcf8680cec9ed540801b43726c0048e5206c03394840ff2f0e181271026fa4430f8366df8286dc88bc6578746e00000000000000008cf1613f400cf8607cef400c9c8cf850818ce01fa0271cf0b6a16ccc973fb00c8cf8508ce70cf0b6ec98306fb00e30d0900883681271026fa4430f836c8cf850817ce5006fa028d064000000000000000000000000003239ba3900000000000000004cf16c973fb00c8cf8508ce70cf0b6ec98306fb0001fe31ed44d0f404d31fd31fd301d4d31ffa00fa40d307fa40d33ffa0020d31fd4d74c2cc001f2e1d6111126c705f2e1d30fd33f31fa00305204b9f2e1d581571370f836aa018032814e208209e1338070f837a028a023b9f2e1d881298b70f8362e515e515e515e515d105f514d514d514d514d514051400402111a0201111b010b005a1115f002c858fa02ccc90ac8f40019cb1f17cb1f15cb0117cccb1f5005fa02cecb07ce12cb3f58fa02cec9ed540108e302f23f0d01fced44d0f404d31fd31f31d301d4d31f31fa0031fa40d307fa40d70b3f05c000f2e1d15192c705f2e1cf06d33f31d31ffa00d31fd31ffa00fa40d4d74c27f823bc917f9527c000c300e2f2e1d428fa4424fa4403bd925b7f93bdc300e2f2e1d72dc004917f952dc033c300e2f2e1d85354bcf2e1d881571370f836aa0180320e01fe814e208209e1338070f837a024a027b9f2e1d87103c8ce12ccc927c0008e3c3751d5bef2e1cc25d0fa40d4d181571370f836aa018032814e208209e1338070f837a024a070fb02c8cf850812ce71cf0b6eccc98306fb00f82324a0933e0d06e281298b70f8362c544c30546420542d805468e05614015617015613015610010f0078561001561301561b01f00232c801fa02ccc90ac8f40019cb1f16cb1fcf858018cc14cb1f5005fa02ce15cb0716ce15cb3f58fa02cb1f12ccccc9ed5401af4355f03326c4434343423c0338e3803c00494840ff2f0e16dc8cf858814ce21fa028d0640000000000000000000000000038363ab380000000000000004cf1658fa0212f400c9e30dc8c9c8cf903b0f21b6cccf8402ccc981100be33f828c8cf8588ce58fa028d0640000000000000000000000000078363ab380000000000000004cf16c9c8c9c8cf903b0f21b6cccf850accc9c88bc6578746e00000000000000008cf16f400cf81c9c8cf858813ce21fa0271cf0b6a12ccc9020120131602014814150075b4c9bda89a1e80863a63e63a63fa603a863a63ff40063f48063a60e63f48063a67e63f40063a63e63a863a863a203860324b6e1c003f046054177000d9b60b7da89a1e80863a63fa63fa603a863a63ff401f48063a60e63f48063a67e63f40063a63fa863a863a3f04ede2102ae26e1f06d54030065029c410413c26700e1f06f40474142e00b80031c2c68a6a97324646938a2854004e752082b416c1005c4b32a204c666861c486070020120171a0201201819008db7a27da89a1e80863a63e63a63e63a60263a863a63e63f401f48063a60e63f48063a67e63f40063a63e63a863a863a302ae26e1f06d54030065029c410413c26700e1f06f41410005fb5e87da89a1e80863a63fa63fa603a863a63ff401f48063a60e63f48063a67e63f401a63fa863a863a208a0cc0a862700073bb90ced44d0f40431d31f31d31f31d30131d431d31f31fa0031fa40d307fa40d33ffa0031d31f31d4d4d121d0fa40d431d102d0fa4031d4d101803f8f2ed44d001d72c2108a3816cf2bffa40d31f31d101f404d31fd31fd301d420d31ffa00fa40d307fa40d33ffa00d31fd4d74c2cc001f2e1d6f82353eaa0bce302f823530ebef2e1cd2a73a9045610a0bef2e1cef80081298b70f8362cd0fa00d4d15222bae302300d11100d10cf2e0c56110c0b11110b0a09111109081c1f2002fc5f053436f80021c3009729d72c0531c3009170e28e11c8cf85081ace01fa0270cf0b6ac973fb00923930e223c0048e453381271027fa4430f836c8cf850818ce5007fa028d064000000000000000000000000003239ba3900000000000000004cf16c973fb00c8cf850812ce70cf0b6ec98306fb00e30e03c8f40012cb1f1d1e00a603c03394840ff2f0e181271027fa4430f8366df8286dc88bc6578746e00000000000000008cf1613f400cf8607cef400c9c8cf850819ce01fa0271cf0b6a17ccc973fb00c8cf850812ce70cf0b6ec98306fb000014cb1fcf8680cccec9ed54005257105f0b3503ed5524d72c05319404c8cec992346de2f82301c8f400cb1fcb1f13cb0112cccec9ed54008207111107060511110504031111030201111101f002c858fa0221cf14c901ed5524d72c05319404c8cec992346de2f82301c8f400cb1fcb1f12cb0112cccec9ed5420b87c29',
    'hex'
).toString('base64');

const OP = {
    DEPLOY: 0xf71783cb,
    CRON_TRIGGER: 0x2114702d,
    DESTRUCT: 0x64737472
} as const;

const DEFAULT_V4_SUB_WALLET_ID = 698983191;

export enum EncodedResultKinds {
    V4 = 'v4',
    V5 = 'v5'
}

export type OutActionWalletV5Exported = OutActionWalletV5;

type DeployParams = {
    beneficiary: Address;
    subscriptionId?: number;
    firstChargingDate: number;
    paymentPerPeriod: bigint;
    period: number;
    gracePeriod: number;
    callerFee: bigint;
    withdrawAddress: Address;
    withdrawMsgBody?: string;
};

type CreateResultV5 = {
    kind: EncodedResultKinds.V5;
    actions: OutActionWalletV5[];
    extensionAddress: Address;
};

type CreateResultV4 = {
    kind: EncodedResultKinds.V4;
    tx: TonRawTransaction;
    extensionAddress: Address;
    extStateInit: Cell;
    deployBody: Cell;
    sendAmount: bigint;
};

export type CreateResult = CreateResultV5 | CreateResultV4;

interface IRemoveV4ExtensionOptions {
    validUntil: number;
    seqno: number;
    extension: Address;
    amount: bigint;
}

interface IDeployV4ExtensionOptions {
    validUntil: number;
    seqno: number;
    sendAmount: bigint;
    extStateInit: Cell;
    deployBody: Cell;
}

interface IBuildStateDataParams {
    beneficiary: Address;
    subscriptionId: number;
}

interface IEncodeDeployBodyParams {
    firstChargingDate: number;
    paymentPerPeriod: bigint;
    period: number;
    gracePeriod: number;
    callerFee: bigint;
    withdrawAddress: Address;
    withdrawMsgBody?: string;
}

// TODO Rename it after review
export class SubscriptionV5Encoder {
    public static readonly DEFAULT_SIGNATURE_TTL_SECONDS = 180;

    public static readonly MIN_EXTENSION_AMOUNT = toNano('0.1');

    public static readonly DEFAULT_V4_REMOVE_EXTENSION_AMOUNT = toNano('0.015');

    constructor(
        private readonly wallet: TonWalletStandard,
        private readonly defaultCodeBocBase64 = SUBSCRIPTION_V2_CODE_BOC
    ) {}

    encodeCreateSubscriptionV2(params: DeployParams): CreateResult {
        if (this.wallet.version < WalletVersion.V4R1) {
            throw new Error('Unsupported wallet version!');
        }

        if (params.paymentPerPeriod < SubscriptionV5Encoder.MIN_EXTENSION_AMOUNT) {
            throw new Error("Subscription amount can't be less than 0.1 TON!");
        }

        const code = Cell.fromBoc(Buffer.from(this.defaultCodeBocBase64, 'base64'))[0];

        const stateData = this.buildStateData({
            beneficiary: params.beneficiary,
            subscriptionId: params.subscriptionId ?? Date.now()
        });

        const stateInit: TonStateInit = { code, data: stateData };

        const extAddr = contractAddress(0, stateInit);

        const body = this.encodeDeployBody({
            firstChargingDate: params.firstChargingDate,
            paymentPerPeriod: params.paymentPerPeriod,
            period: params.period,
            gracePeriod: params.gracePeriod,
            callerFee: params.callerFee,
            withdrawAddress: params.withdrawAddress,
            withdrawMsgBody: params.withdrawMsgBody
        });

        const initMsg = internal({
            to: extAddr,
            bounce: true,
            value: params.paymentPerPeriod,
            init: stateInit,
            body
        });

        if (this.isV5()) {
            const actions: OutActionWalletV5[] = [
                { type: 'addExtension', address: extAddr },
                {
                    type: 'sendMsg',
                    mode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
                    outMsg: initMsg
                }
            ];

            return { kind: EncodedResultKinds.V5, actions, extensionAddress: extAddr };
        }

        const extStateInit = beginCell().store(storeStateInit(stateInit)).endCell();

        const tx: TonRawTransaction = {
            to: extAddr,
            value: params.paymentPerPeriod,
            bounce: true,
            init: stateInit,
            body,
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS
        };

        return {
            kind: EncodedResultKinds.V4,
            tx,
            extensionAddress: extAddr,
            extStateInit,
            deployBody: body,
            sendAmount: params.paymentPerPeriod
        };
    }

    encodeDestructAction(extension: Address): OutActionWalletV5[] {
        if (!this.isV5()) {
            throw new Error('Only V5 wallets supported!');
        }

        const body = this.buildDestructBody();

        const outMsg = internal({
            to: extension,
            bounce: true,
            value: SubscriptionV5Encoder.DEFAULT_V4_REMOVE_EXTENSION_AMOUNT,
            body
        });

        return [
            { type: 'sendMsg', mode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS, outMsg }
        ];
    }

    private resolveWalletKind(): EncodedResultKinds {
        if (
            this.wallet.version === WalletVersion.V3R1 ||
            this.wallet.version === WalletVersion.V3R2
        ) {
            throw new Error('Unsupported wallet version!');
        }

        switch (this.wallet.version) {
            case WalletVersion.V4R1:
            case WalletVersion.V4R2:
                return EncodedResultKinds.V4;
            case WalletVersion.V5_BETA:
            case WalletVersion.V5R1:
                return EncodedResultKinds.V5;
            default: {
                return assertUnreachable(this.wallet.version);
            }
        }
    }

    private isV5() {
        return this.resolveWalletKind() === EncodedResultKinds.V5;
    }

    private buildStateData(params: IBuildStateDataParams): Cell {
        const precompiled = beginCell().storeCoins(0).storeRef(beginCell().endCell()).endCell();

        const withdrawInfo = beginCell().storeAddress(null).storeRef(Cell.EMPTY).endCell();

        return beginCell()
            .storeMaybeRef(null)
            .storeUint(0, 32)
            .storeUint(0, 32)
            .storeUint(0, 2)
            .storeRef(precompiled)
            .storeUint(0, 32)
            .storeCoins(0)
            .storeAddress(Address.parse(this.wallet.rawAddress))
            .storeUint(this.isV5() ? 51 : 4, 8)
            .storeAddress(params.beneficiary)
            .storeUint(params.subscriptionId, 32)
            .storeCoins(0)
            .storeUint(0, 32)
            .storeRef(withdrawInfo)
            .storeRef(Cell.EMPTY)
            .endCell();
    }

    private encodeDeployBody(params: IEncodeDeployBodyParams): Cell {
        return beginCell()
            .storeUint(OP.DEPLOY, 32)
            .storeUint(getTonkeeperQueryId(), 64)
            .storeUint(params.firstChargingDate, 32)
            .storeCoins(params.paymentPerPeriod)
            .storeUint(params.period, 32)
            .storeUint(params.gracePeriod, 32)
            .storeCoins(params.callerFee)
            .storeAddress(params.withdrawAddress)
            .storeRef(this.encodeWithdrawMsgBody(params.withdrawMsgBody))
            .storeRef(Cell.EMPTY)
            .endCell();
    }

    private encodeWithdrawMsgBody(message?: string): Cell {
        if (!message) return Cell.EMPTY;

        const boc = Buffer.from(message, 'hex');

        return Cell.fromBoc(boc)[0];
    }

    private resolveV4WalletId(): number {
        if (this.wallet.version < WalletVersion.V4R2 || this.wallet.version >= WalletVersion.V5R1) {
            throw new Error('Only V4 wallets supported!');
        }

        try {
            const pub = this.wallet.publicKey;

            if (!pub) {
                return DEFAULT_V4_SUB_WALLET_ID;
            }

            const w4 = WalletContractV4.create({
                workchain: 0,
                publicKey: Buffer.from(pub, 'hex')
            });

            return w4.walletId;
        } catch {
            return DEFAULT_V4_SUB_WALLET_ID;
        }
    }

    public static computeValidUntil(
        ttlSeconds: number = this.DEFAULT_SIGNATURE_TTL_SECONDS
    ): number {
        const nowSeconds = Math.floor(Date.now() / 1000);

        return nowSeconds + ttlSeconds;
    }

    public buildV4RemoveExtensionUnsignedBody(options: IRemoveV4ExtensionOptions): Cell {
        const { validUntil, seqno, extension, amount } = options;
        const walletId = this.resolveV4WalletId();

        return beginCell()
            .storeUint(walletId, 32)
            .storeUint(validUntil, 32)
            .storeUint(seqno, 32)
            .storeUint(3, 8)
            .storeUint(0, 8)
            .storeBuffer(extension.hash)
            .storeCoins(amount)
            .storeUint(getTonkeeperQueryId(), 64)
            .endCell();
    }

    public buildV4DeployAndLinkUnsignedBody(options: IDeployV4ExtensionOptions): Cell {
        const { validUntil, seqno, sendAmount, extStateInit, deployBody } = options;
        const walletId = this.resolveV4WalletId();

        return beginCell()
            .storeUint(walletId, 32)
            .storeUint(validUntil, 32)
            .storeUint(seqno, 32)
            .storeUint(1, 8)
            .storeUint(0, 8)
            .storeCoins(sendAmount)
            .storeRef(extStateInit)
            .storeRef(deployBody)
            .endCell();
    }

    public buildV4SignedBody(signature: Buffer, unsigned: Cell): Cell {
        return beginCell().storeBuffer(signature).storeSlice(unsigned.beginParse()).endCell();
    }

    public buildDestructBody(): Cell {
        return beginCell()
            .storeUint(OP.DESTRUCT, 32)
            .storeUint(getTonkeeperQueryId(), 64)
            .endCell();
    }
}
