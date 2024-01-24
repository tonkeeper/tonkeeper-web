import {
    Address,
    beginCell,
    BitBuilder,
    BitReader,
    BitString,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Dictionary,
    MessageRelaxed,
    Sender,
    SendMode
} from 'ton-core';
import { sign } from 'ton-crypto';
import { ActionSendMsg, packActionsList } from './actions';
import { LibraryDeployer } from './library-deployer';

export function bufferToBigInt(buffer: Buffer): bigint {
    return BigInt('0x' + buffer.toString('hex'));
}

const WALLET_W5_CODE =
    'b5ee9c7241020f0100026d0004d0ff00208f5e3020c700dc01d0d60301c713dc01d72c232bc3a3748ec501fa4030fa4401a4b2ed44d0810171d721f4058307f40edd21d72c028e23d74c20d020c700dc8e15d72820761e436c20d71d06c712f265d74cd020c700e630ed55e05bdb3ce30ee120a4e3030d0c0b010110f4a413f4bcf2c80b02020271060302015805040015b7055da89a1ae144185ff0001bb57c3da89a10202e3ae43e8086100201200a0702012009080019b45d1da89a10043ae43ae169f00015b592fda89a1ae14416c1700019bb39ced44d08071d721d70bff801e230d728239b4b3b748308d71820d34fd31fd31fed44d0d22020d34fd70bff08f9014098f910f2a35122baf2a15035baf2a2f823bbf264f800a4c8ca2001cf16c9ed54f80f20d72c028e23d74c20d020c700dc8e15d72820761e436c20d71d06c712f265d74cd020c700e630ed55e030db3c0d01e831d72c239b4b73a4dd20d749810291b9dc8308d71820d34fd31fd31fed44d0d22020d34fd70bff08f9014098f910dd5122badd5035baddf823bbdca4c8ca2001cf16c9ed54f80f20d72c028e23d74c20d020c700dc8e15d72820761e436c20d71d06c712f265d74cd020c700e630ed55e030db3c0d015293d300018ae8d74c20d020c700dc8e15d72820761e436c20d71d06c712f265d74cd020c700e630ed550e00fed72c20e206dcfc01d72c22f577a5245220b18e38fa4001fa44521001a4b2ed44d0810171d718f405059c02c8ca0740148307f453f2a7996c12038307f45bf2a8e2c85003cf1612f400c9ed548e2d31d72c21065dcad48e22d300ed44d0d220039720c10092a3a4de9720c2ff92a4a3dee2c8ca2058cf16c9ed54dee2d74cd02a1aca57';

export const WALLET_W5_BASE64 = Buffer.from(WALLET_W5_CODE, 'hex').toString('base64');

export type WalletV5Config = {
    seqno: number;
    walletId: bigint;
    publicKey: Buffer;
    extensions: Dictionary<bigint, bigint>;
};

export function walletV5ConfigToCell(config: WalletV5Config): Cell {
    return beginCell()
        .storeInt(config.seqno, 33)
        .storeUint(config.walletId, 80)
        .storeBuffer(config.publicKey, 32)
        .storeDict(config.extensions, Dictionary.Keys.BigUint(256), Dictionary.Values.BigInt(8))
        .endCell();
}

export const Opcodes = {
    action_send_msg: 0x0ec3c86d,
    action_set_code: 0xad4de08e,
    action_extended_set_data: 0x1ff8ea0b,
    action_extended_add_extension: 0x1c40db9f,
    action_extended_remove_extension: 0x5eaef4a4,
    action_extended_set_public_key_enabled: 0x20cbb95a,
    auth_extension: 0x6578746e,
    auth_signed: 0x7369676e,
    auth_signed_internal: 0x73696e74
};

export class WalletId {
    static readonly versionsSerialisation: Record<WalletId['walletVersion'], number> = {
        v5: 0
    };

    static deserialize(walletId: bigint | Buffer): WalletId {
        const bitReader = new BitReader(
            new BitString(
                typeof walletId === 'bigint' ? Buffer.from(walletId.toString(16), 'hex') : walletId,
                0,
                80
            )
        );
        const networkGlobalId = bitReader.loadInt(32);
        const workChain = bitReader.loadInt(8);
        const walletVersionRaw = bitReader.loadUint(8);
        const subwalletNumber = bitReader.loadUint(32);

        const walletVersion = Object.entries(this.versionsSerialisation).find(
            ([_, value]) => value === walletVersionRaw
        )?.[0] as WalletId['walletVersion'] | undefined;

        if (walletVersion === undefined) {
            throw new Error(
                `Can't deserialize walletId: unknown wallet version ${walletVersionRaw}`
            );
        }

        return new WalletId({ networkGlobalId, workChain, walletVersion, subwalletNumber });
    }

    readonly walletVersion: 'v5';

    // -239 is mainnet, -3 is testnet
    readonly networkGlobalId: number;

    readonly workChain: number;

    readonly subwalletNumber: number;

    readonly serialized: bigint;

    constructor(args?: {
        networkGlobalId?: number;
        workChain?: number;
        subwalletNumber?: number;
        walletVersion?: 'v5';
    }) {
        this.networkGlobalId = args?.networkGlobalId ?? -239;
        this.workChain = args?.workChain ?? 0;
        this.subwalletNumber = args?.subwalletNumber ?? 0;
        this.walletVersion = args?.walletVersion ?? 'v5';

        const bitBuilder = new BitBuilder(80);
        bitBuilder.writeInt(this.networkGlobalId, 32);
        bitBuilder.writeInt(this.workChain, 8);
        bitBuilder.writeUint(WalletId.versionsSerialisation[this.walletVersion], 8);
        bitBuilder.writeUint(this.subwalletNumber, 32);

        this.serialized = bufferToBigInt(bitBuilder.buffer());
    }
}

export class WalletContractW5 implements Contract {
    public walletType: string = 'w5';

    constructor(
        readonly address: Address,
        public readonly init: { code: Cell; data: Cell },
        private readonly walletId: bigint
    ) {}

    static create({
        workchain,
        publicKey,
        walletId,
        networkGlobalId,
        subwalletNumber
    }: {
        workchain: number;
        publicKey: Buffer;
        walletId?: bigint;
        subwalletNumber?: number;
        networkGlobalId?: number;
    }) {
        const WALLET_ID = new WalletId({
            networkGlobalId: networkGlobalId ?? -239,
            subwalletNumber: subwalletNumber ?? 0,
            workChain: workchain ?? 0
        });

        return WalletContractW5.createFromConfig(
            {
                seqno: 0,
                walletId: walletId ?? WALLET_ID.serialized,
                publicKey: publicKey,
                extensions: Dictionary.empty()
            },
            LibraryDeployer.exportLibCode(Cell.fromBase64(WALLET_W5_BASE64)),
            WALLET_ID.networkGlobalId
        );
    }

    static createFromConfig(
        config: WalletV5Config,
        code: Cell,
        networkGlobalId: number,
        workchain = 0
    ) {
        const data = walletV5ConfigToCell(config);
        const init = { code, data };
        const address = contractAddress(workchain, init);
        const addressInNetwork = Address.parse(
            address.toString({
                testOnly: networkGlobalId !== -239,
                bounceable: false
            })
        );
        return new WalletContractW5(addressInNetwork, init, config.walletId);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell()
        });
    }

    async sendInternalSignedMessage(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            body: Cell;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.auth_signed_internal, 32)
                .storeSlice(opts.body.beginParse())
                .endCell()
        });
    }

    async sendInternalMessageFromExtension(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            body: Cell;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.auth_extension, 32)
                .storeSlice(opts.body.beginParse())
                .endCell()
        });
    }

    async sendInternal(
        provider: ContractProvider,
        via: Sender,
        opts: Parameters<ContractProvider['internal']>[1]
    ) {
        await provider.internal(via, opts);
    }

    async sendExternalSignedMessage(provider: ContractProvider, body: Cell) {
        await provider.external(
            beginCell().storeUint(Opcodes.auth_signed, 32).storeSlice(body.beginParse()).endCell()
        );
    }

    // async sendExternal(provider: ContractProvider, body: Cell) {
    //     await provider.external(body);
    // }

    async getPublicKey(provider: ContractProvider) {
        const result = await provider.get('get_public_key', []);
        return result.stack.readBigNumber();
    }

    async getSeqno(provider: ContractProvider) {
        const state = await provider.getState();
        if (state.state.type === 'active') {
            let res = await provider.get('seqno', []);
            return res.stack.readNumber();
        } else {
            return 0;
        }
    }

    async getWalletId(provider: ContractProvider) {
        const result = await provider.get('get_wallet_id', []);
        return WalletId.deserialize(result.stack.readBigNumber());
    }

    async getExtensions(provider: ContractProvider) {
        const result = await provider.get('get_extensions', []);
        return result.stack.readCellOpt();
    }

    async getExtensionsArray(provider: ContractProvider) {
        const extensions = await this.getExtensions(provider);
        if (!extensions) {
            return [];
        }

        const dict: Dictionary<bigint, bigint> = Dictionary.loadDirect(
            Dictionary.Keys.BigUint(256),
            Dictionary.Values.BigInt(8),
            extensions
        );

        return dict.keys().map(key => {
            const wc = dict.get(key)!;
            const addressHex = key ^ (wc + 1n);
            return Address.parseRaw(`${wc}:${addressHex.toString(16)}`);
        });
    }

    createTransfer(args: {
        seqno: number;
        secretKey: Buffer;
        messages: MessageRelaxed[];
        sendMode?: SendMode;
        timeout?: number;
    }): Cell {
        let sendMode = SendMode.PAY_GAS_SEPARATELY;
        if (args.sendMode !== null && args.sendMode !== undefined) {
            sendMode = args.sendMode;
        }

        const actionsList = packActionsList(
            args.messages.map(message => new ActionSendMsg(sendMode, message))
        );

        const payload = beginCell()
            .storeUint(this.walletId, 80)
            .storeUint(args.timeout || Math.floor(Date.now() / 1e3) + 60, 32)
            .storeUint(args.seqno, 32) // seqno
            .storeSlice(actionsList.beginParse())
            .endCell();

        const signature = sign(payload.hash(), args.secretKey);

        const body = beginCell()
            .storeUint(bufferToBigInt(signature), 512)
            .storeSlice(payload.beginParse())
            .endCell();

        return beginCell()
            .storeUint(Opcodes.auth_signed, 32)
            .storeSlice(body.beginParse())
            .endCell();
    }
}
