import {
    Address,
    beginCell,
    Cell,
    contractAddress,
    internal,
    OutActionSendMsg,
    SendMode,
    toNano
} from '@ton/core';
import { APIConfig } from '../../../entries/apis';
import { BlockchainApi } from '../../../tonApiV2';
import { OutActionWalletV5 } from '@ton/ton/dist/wallets/v5beta/WalletV5OutActions';
import { Builder } from '@ton/ton';
import { getServerTime, getTTL } from '../utils';

export class TwoFAEncoder {
    public static readonly deployPluginValue = toNano(0.15);

    public static readonly refillAtValue = toNano(0.1);

    public static readonly refillValue = toNano(0.1);

    /**
     * install#43563174 service_pubkey:uint256 seed_pubkey:uint256 = InternalMessage;
     */
    static installBody(params: { servicePubKey: bigint; seedPubKey: bigint }) {
        return beginCell()
            .storeUint(0x43563174, 32)
            .storeUint(params.servicePubKey, 256)
            .storeUint(params.seedPubKey, 256)
            .endCell();
    }

    /**
     * remove_extension#9d8084d6 = ExternalMessage;
     */
    static removeBody(builder: Builder) {
        return builder.storeUint(0x9d8084d6, 32);
    }

    /**
     * cancel_delegation#de82b501 = ExternalMessage;
     */
    static cancelRecoveryBody(builder: Builder) {
        return builder.storeUint(0xde82b501, 32);
    }

    private readonly walletAddress: Address;

    private pluginAddressCache: Address | undefined;

    get pluginAddress() {
        if (!this.pluginAddressCache) {
            this.pluginAddressCache = this.calculatePluginAddress();
        }

        return this.pluginAddressCache;
    }

    private stateInitCache: { data: Cell; code: Cell } | undefined;

    get pluginStateInit() {
        if (!this.stateInitCache) {
            this.stateInitCache = this.calculatePluginStateInit();
        }
        return this.stateInitCache;
    }

    constructor(private readonly api: APIConfig, walletAddressRaw: string) {
        this.walletAddress = Address.parse(walletAddressRaw);
    }

    public encodeInstall = async (params: {
        servicePubKey: bigint;
        seedPubKey: bigint;
    }): Promise<OutActionWalletV5[]> => {
        const stateInit = this.pluginStateInit;
        const address = contractAddress(this.walletAddress.workChain, stateInit);

        const seqno = await this.getPluginSeqno(address.toRawString());

        const msgInstall: OutActionSendMsg = {
            type: 'sendMsg',
            mode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
            outMsg: internal({
                to: address,
                bounce: false,
                value: TwoFAEncoder.deployPluginValue,
                init: seqno === 0 ? stateInit : undefined,
                body: TwoFAEncoder.installBody(params)
            })
        };

        return [
            msgInstall,
            {
                type: 'addExtension',
                address
            }
        ];
    };

    /**
     * send_actions#b15f2c8c msg:^Cell mode:uint8 = ExternalMessage;
     */
    public encodeSendAction(pluginAddress: string, msgToTheWallet: Cell) {
        const opCode = 0xb15f2c8c;
        const payload = beginCell()
            .storeRef(msgToTheWallet)
            .storeUint(SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS, 8);
        return this.encodeTwoFARequest(pluginAddress, opCode, payload);
    }

    private async encodeTwoFARequest(pluginAddress: string, opCode: number, payload: Builder) {
        const timestamp = await getServerTime(this.api);
        const validUntil = getTTL(timestamp);

        return beginCell()
            .storeUint(opCode, 32)
            .storeUint(await this.getPluginSeqno(pluginAddress), 32)
            .storeUint(validUntil, 64)
            .storeBuilder(payload)
            .endCell();
    }

    private calculatePluginAddress() {
        return contractAddress(this.walletAddress.workChain, this.pluginStateInit);
    }

    private calculatePluginStateInit() {
        let counter = 0;
        let stateInit = undefined;

        while (!stateInit) {
            const stateInitCandidate = this.pluginStateInitByCounter(counter);
            const pluginAddress = contractAddress(this.walletAddress.workChain, stateInitCandidate);

            if (this.isSameShardWithWallet(pluginAddress)) {
                stateInit = stateInitCandidate;
            } else {
                counter = counter + 1;
            }
        }

        return stateInit;
    }

    private isSameShardWithWallet(address: Address) {
        const watchFirstBits = 9;
        return address.hash
            .subarray(0, watchFirstBits / 8)
            .equals(this.walletAddress.hash.subarray(0, watchFirstBits / 8));
    }

    private pluginStateInitByCounter(findShardCounter: number) {
        /**
         * https://raw.githubusercontent.com/tonkeeper/2fa-extension/063456fa55c54e8c96d0ec01f28bbee63b8ea12e/build/TFAExtension.compiled.json
         */
        return {
            data: this.stateInitDataCell(findShardCounter),
            code: Cell.fromBase64(
                Buffer.from(
                    'b5ee9c7241021b01000509000114ff00f4a413f4bcf2c80b01020120021402014803090202cb040802f3d0831c02456f8007434c0cc7e900c0074c7c8608414da100deea3b35b085c0860c235c880a0c235c8c835c2c7fb513434c7c83e9034fff4fff4c009e0842c57cb232ea3888c0ccd4dbcb429d151493c047e0000693232c7d633c5b27b553e03f4c1f534407ec038c3b83b513434c7fe9034fff4fff4c017c108e150502fc821043563174ba8e6533c000f2e0a05321c705f2e0a1d3ffd3ff3010237071c8cb1f5004cf1612cbffcbffcb40c9ed54f828fa4430c8801001cb0558cf1681315b58f836fa027f7082106578746ec8cb1fcb3f6d01f400ca00706d745003cb07cb00f400c97158cb6accc971fb00e06c21018210c2d7f22bbae3025b840f0607003666c705f2e0a170c8801001cb0558cf1621fa02cb6ac98100a0fb000004f2f000a5a0826a00e81041846b9100c1846b9190699fe9ffe8817c80a01b7c88797051fc11df7970536a00e841846b8c6890fc80b3027c887970522099fc8879705140106b90e98f815d797052e99f80fc11df797053400201200a110201200b0e0201200c0d0027b5b2dda89a1a63ff481a7ffa7ffa600208abe0b00023b605fda89a1a63ff481a7ffa7ffa600be0b00201580f100027b1227b513434c7fe9034fff4fff4c0040d57c160004bb01ba04a62e040b35400ea04a82041f4162a281c3e0d806049c43e501be95be856dc3e0e28200201201213003fb9ea0ed44d0d31ffa40d3ffd3ffd3006c42d33f2296d4fa00306f02e0306f0080027bba2ded44d0d31ffa40d3ffd3ffd30010255f0580198f271218308d722028308d72320d70b1fed44d0d31f20fa40d3ffd3ffd300278210b15f2c8cba8e2230333536f2d0a7454524f011f80001a4c8cb1f58cf16c9ed54f80fd307d4d101fb00e30e1503fe3508f2e0af2582109d8084d6bae30225821023d9c15cba8ee6355415742423f9015af910f2e0a4018020d721d31f02baf2e0a5d33f01f823bef2e0a601d33f01f823bbf2e0aa05e3023403d4fa00d1f800f8238208127500a0c8cb3f12cc01fa02c9d003a4441403710105c8cb1f5004cf1612cbffcbffcb0001cf16c9ed5416181a01fe3334064313f011d1f2d0a7f8008210c2d7f22b70c8801001cb05f828cf16810be222f836fa02cb6acb1fc9c8801001cb0558cf16813bf870f836fa027f7082106578746ec8cb1fcb3fc8c973580582100ec3c86d03c8cc13cb1fcb07ccc91301f40012ca0071c8f8286d735003cb0701cf16f400c9745003cb07cb00f400c91700127158cb6accc971fb0001fe04d4fa003021f90006d401f90017baf2e0ab05fa005262baf2e0abd1f80001a47020c8cb3fc9d02510350408552005c8cb1f5004cf1612cbffcbffcb0001cf16c9ed547023f90074c8cb0212ca07cbffc9d076c8801001cb0522cf165004fa0213cb6b13ccc98210c2d7f22b70c8801001cb05f828cf16810be222f836fa021900e4cb6acb1fc9c8801001cb055004cf16813ec570f836fa02717082106578746ec8cb1fcb3fc8c972580582100ec3c86d03c8cc13cb1fcb07ccc973580682100ec3c86d03c8cc13cb1fcb07ccc91201f40013cb00c8f8287358cb0701cf16c912725003cb0701cf16ccc97158cb6accc971fb0000cce033048210de82b501ba8e535414642323f9015af910f2e0a4018020d721d31f02baf2e0a5d33f01f823bef2e0a6d103f2e0aef80002a470f82382015180a0c8cb3fc9d010251024102305c8cb1f5004cf1612cbffcbffcb0001cf16c9ed54e05f07840ff2f0034e07ef',
                    'hex'
                ).toString('base64')
            )
        };
    }

    private stateInitDataCell(findShardCounter: number) {
        return beginCell()
            .storeUint(0, 32)
            .storeAddress(this.walletAddress)
            .storeUint(0, 256)
            .storeUint(0, 256)
            .storeUint(0, 2)
            .storeUint(0, 64)
            .storeUint(findShardCounter, 32)
            .endCell();
    }

    public async getPluginSeqno(pluginAddress = this.pluginAddress.toRawString()) {
        try {
            const res = await new BlockchainApi(
                this.api.tonApiV2
            ).execGetMethodForBlockchainAccount({
                accountId: pluginAddress,
                methodName: 'get_seqno'
            });

            const seqno = res.stack[0].num;

            if (!res.success || !seqno || !isFinite(Number(seqno))) {
                throw new Error("Can't get seqno");
            }

            return Number(seqno);
        } catch (e) {
            console.error(e);
            return 0;
        }
    }

    public async getPluginState(): Promise<
        | { type: 'not_exist' }
        | { type: 'active' }
        | { type: 'deactivating'; willBeDisabledAtUnixSeconds: number }
    > {
        const seqno = await this.getPluginSeqno();

        if (seqno === 0) {
            return { type: 'not_exist' };
        }

        const res = await new BlockchainApi(this.api.tonApiV2).execGetMethodForBlockchainAccount({
            accountId: this.pluginAddress.toRawString(),
            methodName: 'get_delegation_state'
        });

        const state = res.stack[0]?.num;

        if (!res.success || !state || !isFinite(Number(state))) {
            throw new Error("Can't get state");
        }

        if (Number(state) === 0) {
            return { type: 'active' };
        } else if (Number(state) === 1) {
            if (!res.stack[1]?.num || !isFinite(Number(res.stack[1].num))) {
                throw new Error("Can't get deactivating time");
            }

            return {
                type: 'deactivating',
                willBeDisabledAtUnixSeconds: Number(res.stack[1].num)
            };
        } else {
            throw new Error(`Unknown state ${state}`);
        }
    }
}
