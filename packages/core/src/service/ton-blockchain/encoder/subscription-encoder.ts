import {
    Address,
    Cell,
    beginCell,
    contractAddress,
    StateInit as TonStateInit,
    toNano,
    SendMode,
    internal
} from '@ton/core';
import { OutActionWalletV5 } from '@ton/ton/dist/wallets/v5beta/WalletV5OutActions';
import { getTonkeeperQueryId } from '../utils';
import { TonWalletStandard, WalletVersion } from '../../../entries/wallet';

/**
 * https://raw.githubusercontent.com/tonkeeper/w5-subscriptions/refs/heads/main/build/NativeSubExt.compiled.json?token=GHSAT0AAAAAADG5JG3Q7377EGHFYEHIQ6AU2FIOINQ
 */
export const SUBSCRIPTION_V2_CODE_BOC = Buffer.from(
    'b5ee9c7241022401000899000114ff00f4a413f4bcf2c80b01020120021c02014803120202cb040f020120050c03f7d99f6a2687a0200fc37e98f80fc35698f80fc34698080fc30ea00fc38698f80fc34fd0000fc35fd2000fc31698380fc31fd2000fc32699f80fc32fd0000fc33698f80fc33ea00e87d2000fc366a187c36ea187c37686981fd201800b8d8492f81f001698fe99f9890c10878363ab3dd718110c1083239ba395d7181406080901e25bf841c001f823f848f849a0bbb0f2e1d6f84212c705f2e1cff846bef2e1ccf848f847a0f84f6eb3f84bc300b08e23f84fd020d70b01c0028e15c8801001cb0501cf16f84bfa027001cb6ac973fb009130e2deed44d0f404318042d72171706dc8f400cb1f13cb1f12cb0101cf16c9ed5407006a81571370f836aa018032814e208209e1338070f837a0f84ba070fb02c8801001cb05f84ccf1670fa02f84d7158cb6accc98306fb00018c5f03f841c001f2e1d6f8445210c705f843c033b09730f842f844f00f8e24f8445210c705f843c004b09730f842f844f0109ff842c70594f844f00e94840ff2f0e2e2e272f8612301fa218210508238ecba8e626c21f841c001f2e1d6f84412c705f2e1d3fa0030f8465210b9f2e1d5f866f84ef84dc8f84ccf16ccc9f847f845f843f849f850f841f848f84af84fc8f400cb1fcb1fcb01cccb1ff84bfa02f842cf16cb07f844cf16cb3ff846fa02cb1fccccc9ed54e0018210f71783cbbae3025f03840ff2f00a03b4f841c000f2e1d1f84213c705f2e1cf01d31f21c00022f823beb1f2e1d471f861fa0001f866d31f01f867d31f01f869fa0001f86bfa4001f86cd401f86dd430f86ef842f84cf019f2e1d7209331f868e30e81298b70f836db3c300b2123008630f846bef2e1cc81571370f836aa018032814e208209e1338070f837a0f84ba070fb02c8801001cb05f84ccf1670fa02f84d7158cb6accc98306fb00f823f847a0f8680201f40d0e002b3220040072c14073c59c3e809c0072dab260c1bec0200089087e910c2049c4007e0d9c5c082084195e1d1bb220040072c15401f3c594013e809c0072da8572c7c4b2cfc4f2c004b2c03e0a1b5cd400f2c1c073c5bd00325cfec03c03a00201201011005dd90fd221840938800fc1b3841083239ba3964400800e582a802e78b2c7d013800e5b509e58f89659fe4b9fd80780740017b203f48805f488b37ab37b630201201317020148141500c9b4c9bda89a1e80803f0dfa63e03f0d5a63e03f0d1a60203f0c3a803f0e1a63e03f0d3f40003f0d7f48003f0c5a60e03f0c7f48003f0c9a67e03f0cbf40003f0cda63e03f0cfa803a1f48003f0d9a861f0dba861f0ddf083800331f047f091f0934177c0e1001dbb60b7da89a1e80803f0dfa63e03f0d5a63e03f0d1a60203f0c3a803f0e1a63e03f0d3f40003f0d7f48003f0c5a60e03f0c7f48003f0c9a67e03f0cbf40003f0cda63e03f0cfa803a1f48003f0d9a861f0dba861f0ddf04ede21026de8e1f06d42e1f0838003c601f097f08e8261016003430f84af848b992f8489ff848f849a0f84af84973a904a0b608e2020120181b020120191a00ddb7a27da89a1e80803f0dfa63e03f0d5a63e03f0d1a60203f0c3a803f0e1a63e03f0d3f40003f0d7f48003f0c5a60e03f0c7f48003f0c9a67e03f0cbf40003f0cda63e03f0cfa803a1f48003f0d9a861f0dba861f0dd02ae26e1f06d54030065029c410413c26700e1f06f41f09741000c7b5e87da89a1e80803f0dfa63e03f0d5a63e03f0d1a60203f0c3a803f0e1a63e03f0d3f40003f0d7f48003f0c5a60e03f0c7f48003f0c9a67e03f0cbf40003f0cda63e03f0cfa803a1f48003f0d9a861f0dba861f0ddf083f08df08ff091f093f095f097000c7bb90ced44d0f40401f86fd31f01f86ad31f01f868d30101f861d401f870d31f01f869fa0001f86bfa4001f862d30701f863fa4001f864d33f01f865fa0001f866d31f01f867d401d0fa4001f86cd430f86dd430f86ef842f843f844f845f84cf84df84e803d0f2d31f840f0282102114702dba12f2f4ed44d0f40431d31f20d31fd301d4d31f07fa40d31f3120d1f8235363a0bee30204c001f2e1d0f82325bef8235163a016b915b0f2e1cdf8230173a90416a015bef2e1cef80081298b70f83604d0fa005115bae302135f03321d1f2001fe185f08f800ed44d0f40401f86fd31f01f86ad31f01f868d30101f861d401f870d31f01f869fa0001f86bfa4001f862d30701f863fa4001f864d33f01f865fa0001f866d31f01f867d401d0fa4001f86cd430f86dd430f86ef84b21d70b01c002b08e15c8801001cb0501cf16f84bfa027001cb6ac973fb009130e2f843c0331e00c496f842f844f00f8e11f843c00496f842f844f01094840ff2f0e2e272f861f84ef84dc8f84ccf16ccc9f847f845f843f849f850f841f848f84af84fc8f400cb1fcb1fcb01cccb1ff84bfa02f842cf16cb07f844cf16cb3ff846fa02cb1fccccc9ed54004e313302d430ed5502fa0030c80198c858cf16c901f400946d32f400e2f82301cb1f01cf16c9ed5402d6ed44d0f40401f86fd31f01f86ad31f01f868d30101f861d401f870d31f01f869fa0001f86bfa4001f862d30701f863fa4001f864d33f01f865fa0001f866d31f01f867d401d0fa4001f86cd430f86dd430f86edb3ced55f823f86af84b9ac801fa4030cf16c9f86f9130e2212301ba6df843c0338e36f843c0048e2a30f846216d708210706c7567c8801801cb05f842cf165004fa027001cb6a13cb1f12cb3f58fa02f400c994840ff2f0e2e30dc8c9702282100ec3c86d03c8cc13cb1fcb07ccc9c85003fa0212ccc9f8702200be30f84621f8258210f06c7567c8801801cb05f828cf165004fa027001cb6a13cb1f12cb3fc970821032bc3a37aa40c8801801cb05f842cf165004fa027001cb6a13cb5fc8c98042580382100ec3c86d03c8cc13cb1fcb07ccc901f400cb00c90088f84ef84dc8f84ccf16ccc9f847f845f843f849f850f841f848f84af84fc8f400cb1fcb1fcb01cccb1ff84bfa02f842cf16cb07f844cf16cb3ff846fa02cb1fccccc9ed544998fbd3',
    'hex'
).toString('base64');

const OP = {
    DEPLOY: 0xf71783cb,
    CRON_TRIGGER: 0x2114702d,
    DESTRUCT: 0x64737472
} as const;

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

type CreateResult = {
    actions: OutActionWalletV5[];
    extensionAddress: Address;
};

interface IBuildStateDataParams {
    wallet: Address;
    walletVersion: WalletVersion.V5R1;
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

const MIN_RESERVE = toNano('0.05');

export class SubscriptionV5Encoder {
    constructor(
        private readonly wallet: TonWalletStandard,
        private readonly defaultCodeBocBase64 = SUBSCRIPTION_V2_CODE_BOC
    ) {}

    encodeCreateSubscriptionV2(params: DeployParams): CreateResult {
        const code = Cell.fromBoc(Buffer.from(this.defaultCodeBocBase64, 'base64'))[0];

        if (this.wallet.version !== WalletVersion.V5R1) {
            throw new Error(`Unsupported wallet version: ${this.wallet.version}`);
        }

        if (params.paymentPerPeriod < toNano('0.1')) {
            throw new Error("Subscription amount can't be less than 0.1 TON!");
        }

        const stateData = this.buildStateData({
            wallet: Address.parse(this.wallet.rawAddress),
            walletVersion: this.wallet.version,
            beneficiary: params.beneficiary,
            subscriptionId: params.subscriptionId ?? Date.now()
        });

        const stateInit: TonStateInit = { code, data: stateData };

        const extAddr = contractAddress(0, stateInit);

        const reserve =
            params.firstChargingDate === 0 ? params.paymentPerPeriod + MIN_RESERVE : MIN_RESERVE;

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
            value: reserve,
            init: stateInit,
            body
        });

        const actions: OutActionWalletV5[] = [
            { type: 'addExtension', address: extAddr },
            {
                type: 'sendMsg',
                mode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
                outMsg: initMsg
            }
        ];

        return { actions, extensionAddress: extAddr };
    }

    encodeDestructAction(extension: Address): OutActionWalletV5[] {
        const body = beginCell()
            .storeUint(OP.DESTRUCT, 32)
            .storeUint(getTonkeeperQueryId(), 64)
            .endCell();

        const outMsg = internal({
            to: extension,
            bounce: true,
            value: toNano('0.05'),
            body
        });

        return [
            { type: 'sendMsg', mode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS, outMsg }
        ];
    }

    private buildStateData(params: IBuildStateDataParams): Cell {
        const precompiled = beginCell().storeCoins(0).storeRef(beginCell().endCell()).endCell();

        const withdrawInfo = beginCell()
            .storeAddress(null)
            .storeRef(beginCell().endCell())
            .endCell();

        return beginCell()
            .storeMaybeRef(null)
            .storeUint(0, 32)
            .storeUint(0, 32)
            .storeUint(0, 2)
            .storeRef(precompiled)
            .storeUint(0, 32)
            .storeCoins(0)
            .storeAddress(params.wallet)
            .storeUint(51, 8)
            .storeAddress(params.beneficiary)
            .storeUint(params.subscriptionId, 64)
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
}
