import {
    Address,
    beginCell,
    Cell,
    contractAddress,
    Dictionary,
    internal,
    OutActionSendMsg,
    SendMode,
    toNano
} from '@ton/core';
import { APIConfig } from '../../../entries/apis';
import { BlockchainApi } from '../../../tonApiV2';
import { OutActionWalletV5 } from '@ton/ton/dist/wallets/v5beta/WalletV5OutActions';

export class TwoFAEncoder {
    public static readonly deployPluginValue = toNano(0.05); // TODO сколько надо?

    public static readonly removePluginValue = toNano(0.05); // TODO сколько надо?

    /**
     * install#43563174 service_pubkey:uint256 seed_pubkey:uint256 device_pubkeys:(Dict uint32 uint256) = InternalMessage;
     */
    static encodeInstallBody(params: {
        servicePubKey: bigint;
        seedPubKey: bigint;
        devicePubKeys: Dictionary<number, bigint>;
    }) {
        return beginCell()
            .storeUint(0x43563174, 32)
            .storeUint(params.servicePubKey, 256)
            .storeUint(params.seedPubKey, 256)
            .storeDict(params.devicePubKeys)
            .endCell();
    }

    private readonly walletAddress: Address;

    constructor(private readonly api: APIConfig, walletAddressRaw: string) {
        this.walletAddress = Address.parse(walletAddressRaw);
    }

    public encodeInstallForDevice = async (params: {
        servicePubKey: bigint;
        seedPubKey: bigint;
        devicePubKey: bigint;
    }): Promise<OutActionWalletV5[]> => {
        const stateInit = this.pluginStateInit();
        const address = contractAddress(this.walletAddress.workChain, stateInit);

        const seqno = await this.getPluginSeqno(address.toRawString());

        let devicePubKeys: Dictionary<number, bigint>;
        if (seqno === 0) {
            devicePubKeys = Dictionary.empty(
                Dictionary.Keys.Uint(32),
                Dictionary.Values.BigUint(256)
            );
            devicePubKeys.set(0, params.devicePubKey);
        } else {
            devicePubKeys = await this.getPluginDeviceKeysDict(address.toRawString());
            if (devicePubKeys.values().every(v => v !== params.devicePubKey)) {
                const newKey = Math.max(...devicePubKeys.keys()) + 1;
                devicePubKeys.set(newKey, params.devicePubKey);
            }
        }

        const msgInstall: OutActionSendMsg = {
            type: 'sendMsg',
            mode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
            outMsg: internal({
                to: address,
                bounce: false,
                value: TwoFAEncoder.deployPluginValue,
                init: seqno === 0 ? stateInit : undefined,
                body: TwoFAEncoder.encodeInstallBody({
                    ...params,
                    devicePubKeys
                })
            })
        };

        const outActions: OutActionWalletV5[] = [msgInstall];

        if (!(await this.getIsPluginAlreadyInstalled(address))) {
            outActions.push({
                type: 'addExtension',
                address
            });
        }

        return outActions;
    };

    pluginAddress() {
        contractAddress(this.walletAddress.workChain, this.pluginStateInit());
    }

    pluginStateInit() {
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
         * https://raw.githubusercontent.com/tonkeeper/2fa-extension/5b780a0baa0bfbb36ae5d3e5cf2836c84b3b2647/compiled/TFAExtension.compiled.json
         */
        return {
            data: this.stateInitDataCell(findShardCounter),
            code: Cell.fromBase64(
                Buffer.from(
                    'b5ee9c72410223010006f3000114ff00f4a413f4bcf2c80b01020120021602014803070202cb04060165d0831c02456f8007434c0cc7e900c0074c7fb513434c7fe9034fff4fffd0134c057c140e08410d58c5d2eb8c097c12103fcbc20500dec000f2e0a05321c705f2e0a1d3ffd3fff404301034702071c8cb1f5006cf1614cbff12cbfff40012cb01cb3fc9ed54f828fa4430c8801001cb0558cf1681102058f836a703fa027f7082106578746ec8cb1fcb3f6d01f400ca00706d745003cb07cb00f400c97158cb6accc971fb000063a1026a00e841846b8c1810fc80aa100a8b7c887970512a907c8879705240106b90e98f815d797052e99f80fc11df79705340020120081102012009100201200a0f0201200b0e0202760c0d004ba00bb513434c7fe9034fff4fffd0134c05b14b4cfc8b000a65b04b53e800c1c9548380c1b5c20029a25bb513434c7fe9034fff4fffd0134c0441597c1a002bb20bbb513434c7fe9034fff4fffd0134c0441197c1a00027b605fda89a1a63ff481a7ffa7ffe809a602be0d00055b974fed44d0d31ffa40d3ffd3fff404d3016c52d33f22c0019d6c12d430d0d3ffd31f30714313e030702080201201213002bbaf5eed44d0d31ffa40d3ffd3fff404d30110265f0680201581415003fb1173b513434c7fe9034fff4fffd0134c0440997c1a0083d039be84c35c2ffe0002bb28b7b513434c7fe9034fff4fffd0134c0440d97c1a00480f28308d71820d70b1fed44d0d31f20fa40d3ffd3fff404d301288210b15f2c8cbae302362782100a73fcb4bae302278210a04d2666bae30227821059c538ddba1718191a00bc3032333504f2d0a75e2254140504d401d08308d718d70b1f22f901048020f40e6fa130d70bff2359f910f2e0a34133f910f2e0a28020d721d31fd33f5023baf2e0a5f823bef2e0a6f80002a4c8cb1f01cf16c9ed54f80fd307d74c01fb0000e83706f2d0a7541676536504d401d08308d718d70b1f22f901048020f40e6fa130d70bff2359f910f2e0a34133f910f2e0a28020d721d31fd33f5023baf2e0a5f823bef2e0a6d31fd430d040158020f436f2e0a8f80002a405103459700106c8cb1f5005cf1613cbffcbfff400cb0101cf16c9ed5400e43706f2d0a7541676536504d401d08308d718d70b1f22f901048020f40e6fa130d70bff2359f910f2e0a34133f910f2e0a28020d721d31fd33f5023baf2e0a5f823bef2e0a6d31f3050048020f45bf2e0a9f80002a405103459700106c8cb1f5005cf1613cbffcbfff400cb0101cf16c9ed5402fe8ef5375417825386f01203d33f01f823bbf2e0aa25c0008e5c3704c0018e4f05d430d0d6ffd31f3002d6ff5222c705f2e0abd31f305220baf2e0abf800016d8020f41601a470f823810e10a0c8cb3fc9d010261025102306c8cb1f5005cf1613cbffcbfff400cb0101cf16c9ed54955f06f2c0ace2e30de027821030f0a4071b1c007a3034f80001d3ffd31f3001c8cbffcb1fc9f8238203f480a0c8cb3fccc9d002a450554414710106c8cb1f5005cf1613cbffcbfff400cb0101cf16c9ed5403c6ba8e3d35365416765385f0123001c001f2e0adf80001a470f823810e10a0c8cb3fc9d05e321034102306c8cb1f5005cf1613cbffcbfff400cb0101cf16c9ed54e02782109d8084d6bae30227821023d9c15cba9135e30d068210de82b501bae3025f081d1f2201f23234355e23400604d401d08308d718d70b1f22f901048020f40e6fa130d70bff2359f910f2e0a34133f910f2e0a28020d721d31fd33f5023baf2e0a5f823bef2e0a630c000f2e0a7f800c8801001cb0501cf1670fa027f7082106578746ec8cb1fcb3f6d01f400ca0071c8f8286d735003cb0701cf16f400c91e002a745003cb07cb00f400c97158cb6accc98100a0fb0001f85438922823f9015af910f2e0a4018020d721d31f02baf2e0a5d33f01f823bef2e0a605d33f01f823bbf2e0aa28c0008e3b30f80004d4fa00f8238203f480a0c8cb3f13cc01fa02c9d026a401722654463026544a0306c8cb1f5005cf1613cbffcbfff400cb0101cf16c9ed548e8b28c0029430f2c0ace30d04e207042001fcd4fa003021f90007d401f90018baf2e0ab06fa005272baf2e0abf80027a470f823810e10a0c8cb3fc9d0285448302854483006c8cb1f5005cf1613cbffcbfff400cb0101cf16c9ed547022f90074c8cb0212ca07cbffc9d0c8801001cb0527cf1670fa02717082106578746ec8cb1fcb3fc8c97076c8801001cb0527cf1621008c500efa021dcb6b17ccc946b082100ec3c86d03c8cc13cb1fcb07ccc91901f40013cb00c8f8287358cb0701cf16c94130725003cb0701cf16ccc9167158cb6accc98100a0fb0000ac5416772523f9015af910f2e0a4018020d721d31f02baf2e0a5d33f01f823bef2e0a63001c002f2e0aef80001a470f823810e10a0c8cb3fc9d05e321034102306c8cb1f5005cf1613cbffcbfff400cb0101cf16c9ed54dd0feeda',
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
            .storeDict()
            .storeUint(0, 2)
            .storeUint(0, 64)
            .storeUint(findShardCounter, 32) // TODO size
            .endCell();
    }

    private async getPluginDeviceKeysDict(pluginAddress: string) {
        const res = await new BlockchainApi(this.api.tonApiV2).execGetMethodForBlockchainAccount({
            accountId: pluginAddress,
            methodName: 'get_device_pubkeys',
            args: []
        });

        if (res.stack[0].type !== 'cell' || !res.stack[0].cell) {
            throw new Error(`Unexpected result ${res.stack[0].type}`);
        }

        const cell = Cell.fromBase64(res.stack[0].cell!);
        return cell
            .beginParse()
            .loadDictDirect(Dictionary.Keys.Uint(32), Dictionary.Values.BigUint(256));
    }

    public async getPluginSeqno(pluginAddress: string) {
        try {
            const res = await new BlockchainApi(
                this.api.tonApiV2
            ).execGetMethodForBlockchainAccount({
                accountId: pluginAddress,
                methodName: 'get_seqno',
                args: []
            });

            const seqno = res.stack[0].num;

            if (!seqno || !isFinite(Number(seqno))) {
                throw new Error("Can't get seqno");
            }

            return Number(seqno);
        } catch (e) {
            console.error(e);
            return 0;
        }
    }

    public async getIsPluginAlreadyInstalled(address: Address) {
        try {
            const res = await new BlockchainApi(
                this.api.tonApiV2
            ).execGetMethodForBlockchainAccount({
                accountId: this.walletAddress.toRawString(),
                methodName: 'get_extensions'
            });

            if (res.stack[0].type !== 'cell' || !res.stack[0].cell) {
                throw new Error(`Unexpected result ${res.stack[0].type}`);
            }

            const extensions = Cell.fromBase64(res.stack[0].cell);

            const dict: Dictionary<bigint, bigint> = Dictionary.loadDirect(
                Dictionary.Keys.BigUint(256),
                Dictionary.Values.BigInt(1),
                extensions
            );

            const extensionsAddresses = dict.keys().map(addressHex => {
                const wc = this.walletAddress.workChain;
                return Address.parseRaw(`${wc}:${addressHex.toString(16).padStart(64, '0')}`);
            });

            return extensionsAddresses.some(ext => ext.equals(address));
        } catch (e) {
            console.error(e);
            return false;
        }
    }
}
