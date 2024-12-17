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
    public static readonly deployPluginValue = toNano(0.05); // TODO сколько надо? 0.5

    public static readonly removePluginValue = toNano(0.05); // TODO сколько надо? 0.5

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
    static removeBody() {
        return beginCell().storeUint(0x9d8084d6, 32).endCell();
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
            .storeUint(opCode, 32) // op code of the method
            .storeUint(await this.getPluginSeqno(pluginAddress), 32)
            .storeUint(validUntil, 64)
            .storeBuilder(payload) // payload of the method
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
        const watchFirstBits = 9; // TODO мб меньше брать? Долго ли будет
        return address.hash
            .subarray(0, watchFirstBits / 8)
            .equals(this.walletAddress.hash.subarray(0, watchFirstBits / 8));
    }

    private pluginStateInitByCounter(findShardCounter: number) {
        /**
         * https://github.com/tonkeeper/2fa-extension/blob/49d79c4f60484081cb29c931f991d480378c6f05/compiled/TFAExtension.compiled.json
         */
        return {
            data: this.stateInitDataCell(findShardCounter),
            code: Cell.fromBase64(
                Buffer.from(
                    'b5ee9c724102190100047f000114ff00f4a413f4bcf2c80b01020120021202014803070202cb040601afd0831c02456f8007434c0cc7e900c0074c7fb513434c7fe9034fff4fff4c017c108e08410d58c5d2eb8c09b0840608430b5fc8aeea386d9b1c17cb8285c3220040072c15633c5887e80b2dab26040283ec03816e103fcbc20500ca33c000f2e0a05321c705f2e0a1d3ffd3ff3010237071c8cb1f5004cf1612cbffcbffcb40c9ed54f828fa4430c8801001cb0558cf1681315b58f836fa027f7082106578746ec8cb1fcb3f6d01f400ca00706d745003cb07cb00f400c97158cb6accc971fb00005fa0826a00e841846b8c6890fc80b3027c887970522099fc8879705140106b90e98f815d797052e99f80fc11df79705340020120080f020120090e0201200a0d0201200b0c0027b365bb513434c7fe9034fff4fff4c0041157c1600027b20bbb513434c7fe9034fff4fff4c0040d57c1600023b605fda89a1a63ff481a7ffa7ffa600be0b0004bbb06e81298b8102cd5003a812a08107d058a8a070f83601812710f9406fa56fa15b70f838a080201201011003fb9ea0ed44d0d31ffa40d3ffd3ffd3006c42d33f2296d4fa00306f02e0306f0080027bba2ded44d0d31ffa40d3ffd3ffd30010255f05803e2f28308d71820d70b1fed44d0d31f20fa40d3ffd3ffd300278210b15f2c8cba8e2430333501f2d0a75e22541045f011f80002a4c8cb1f01cf16c9ed54f80fd307d4d101fb00e0352682109d8084d6bae30226821023d9c15cbae30234258210de82b501bae30210575f07fe2030840ff2f013151801ee34355e234056f011d101f2d0a7f8008210c2d7f22b70c8801001cb05f828cf16810ac322f836fa02cb6acb1fc9c8801001cb0558cf16813bf870f836fa027f7082106578746ec8cb1fcb3fc8c973580582100ec3c86d03c8cc13cb1fcb07ccc91301f40012ca0071c8f8286d735003cb0701cf16f400c9140026745003cb07cb00f400c97158cb6accc971fb0001c8365416772523f9015af910f2e0a4018020d721d31f02baf2e0a5d33f01f823bef2e0a602d33f01f823bbf2e0aa04e30233d4fa00d1f800f8238208127500a0c8cb3f12cc01fa02c9d001a44344710105c8cb1f5004cf1612cbffcbffcb0001cf16c9ed541601fc03d4fa003021f90003d401f90014baf2e0ab02fa005232baf2e0abd1f80002a47020c8cb3fc9d0251035041037488805c8cb1f5004cf1612cbffcbffcb0001cf16c9ed547022f90074c8cb0212ca07cbffc9d076c8801001cb0522cf165005fa0214cb6b12ccc98210c2d7f22b70c8801001cb05f828cf16810ac322f8361700eafa02cb6acb1fc9c8801001cb055003cf16813ec570f836fa02717082106578746ec8cb1fcb3fc8c972580582100ec3c86d03c8cc13cb1fcb07ccc973580582100ec3c86d03c8cc13cb1fcb07ccc91201f40012cb00c8f8287358cb0701cf16c94130725003cb0701cf16ccc97158cb6accc971fb0000a0355415642423f9015af910f2e0a4018020d721d31f02baf2e0a5d33f01f823bef2e0a6d1f2e0aef800a470f82382015180a0c8cb3fc9d01025102305c8cb1f5004cf1612cbffcbffcb0001cf16c9ed544dcff569',
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
            .storeUint(findShardCounter, 32) // TODO size
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

    public async getPluginState(): Promise<'not_exist' | 'active' | 'deactivating'> {
        const seqno = await this.getPluginSeqno();

        if (seqno === 0) {
            return 'not_exist';
        }

        const res = await new BlockchainApi(this.api.tonApiV2).execGetMethodForBlockchainAccount({
            accountId: this.pluginAddress.toRawString(),
            methodName: 'get_delegation_state'
        });

        const state = res.stack[0].num;

        if (!res.success || !state || !isFinite(Number(state))) {
            throw new Error("Can't get state");
        }

        if (Number(state) === 0) {
            return 'active';
        } else if (Number(state) === 1) {
            return 'deactivating';
        } else {
            throw new Error(`Unknown state ${state}`);
        }
    }
}
