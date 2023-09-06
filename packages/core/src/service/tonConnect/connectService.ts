import queryString from 'query-string';
import { Address, beginCell, storeStateInit } from 'ton-core';
import {
    KeyPair,
    getSecureRandomBytes,
    keyPairFromSeed,
    mnemonicToPrivateKey,
    sha256_sync
} from 'ton-crypto';
import nacl from 'tweetnacl';
import { IStorage } from '../../Storage';
import { TonConnectError } from '../../entries/exception';
import { Network } from '../../entries/network';
import {
    CONNECT_EVENT_ERROR_CODES,
    ConnectEvent,
    ConnectItem,
    ConnectItemReply,
    ConnectRequest,
    DAppManifest,
    DeviceInfo,
    TonAddressItemReply,
    TonProofItemReplySuccess
} from '../../entries/tonConnect';
import { WalletState } from '../../entries/wallet';
import { getWalletMnemonic } from '../mnemonicService';
import { walletContractFromState } from '../wallet/contractService';
import { getCurrentWallet } from '../wallet/storeService';
import {
    TonConnectParams,
    disconnectAccountConnection,
    getAccountConnection,
    saveAccountConnection
} from './connectionService';

const TC_PREFIX = 'tc://';

export function parseTonConnect(options: { url: string }): TonConnectParams | null {
    try {
        if (!options.url.startsWith(TC_PREFIX)) {
            throw new Error('must starts with ' + TC_PREFIX);
        }

        const { query } = queryString.parseUrl(options.url);

        if (query.v !== '2') {
            throw Error('Unknown version' + options.url);
        }
        if (typeof query.id !== 'string') {
            throw Error('missing id ' + options.url);
        }
        if (typeof query.r !== 'string') {
            throw Error('missing payload ' + options.url);
        }

        const protocolVersion = parseInt(query.v);
        const request = JSON.parse(decodeURIComponent(query.r)) as ConnectRequest;
        const clientSessionId = query.id;
        //const sessionCrypto = new SessionCrypto();
        return {
            protocolVersion,
            request,
            clientSessionId,
            sessionKeyPair: undefined!
        };
    } catch (e) {
        return null;
    }
}

export const getTonConnectParams = async (
    request: ConnectRequest,
    protocolVersion?: number,
    clientSessionId?: string
): Promise<TonConnectParams> => {
    const randomBytes: Buffer = await getSecureRandomBytes(32);
    const keypair: KeyPair = keyPairFromSeed(randomBytes);

    return {
        protocolVersion: protocolVersion ?? 2,
        request,
        clientSessionId: clientSessionId ?? (await getSecureRandomBytes(32)).toString('hex'),
        sessionKeyPair: {
            secretKey: keypair.secretKey.toString('hex'),
            publicKey: keypair.publicKey.toString('hex')
        }
    };
};

export const getManifest = async (request: ConnectRequest) => {
    // TODO: get fetch from context
    const response = await window.fetch(request.manifestUrl, {
        method: 'GET'
    });

    const manifest = (await response.json()) as DAppManifest;

    const isValid =
        manifest &&
        typeof manifest.url === 'string' &&
        typeof manifest.name === 'string' &&
        typeof manifest.iconUrl === 'string';

    if (!isValid) {
        throw new Error('Manifest is not valid');
    }

    return manifest;
};

function getPlatform(): DeviceInfo['platform'] {
    const platform =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window.navigator as any)?.userAgentData?.platform || window.navigator.platform;

    const userAgent = window.navigator.userAgent;

    const macosPlatforms = ['macOS', 'Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
    const iphonePlatforms = ['iPhone'];
    const iosPlatforms = ['iPad', 'iPod'];

    let os: DeviceInfo['platform'] | null = null;

    if (macosPlatforms.indexOf(platform) !== -1) {
        os = 'mac';
    } else if (iphonePlatforms.indexOf(platform) !== -1) {
        os = 'iphone';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
        os = 'ipad';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = 'windows';
    } else if (/Android/.test(userAgent)) {
        os = 'android';
    } else if (/Linux/.test(platform)) {
        os = 'linux';
    }

    return os!;
}

export const getDeviceInfo = (appVersion: string): DeviceInfo => {
    return {
        platform: getPlatform()!,
        appName: 'Tonkeeper',
        appVersion: appVersion,
        maxProtocolVersion: 2,
        features: [
            'SendTransaction',
            {
                name: 'SendTransaction',
                maxMessages: 4
            }
        ]
    };
};

export const checkWalletConnectionOrDie = async (options: {
    storage: IStorage;
    wallet: WalletState;
    webViewUrl: string;
}) => {
    const connections = await getAccountConnection(options.storage, options.wallet);

    console.log(connections);

    const connection = connections.find(item => item.webViewUrl === options.webViewUrl);
    if (connection === undefined) {
        throw new TonConnectError(
            'Missing connection',
            CONNECT_EVENT_ERROR_CODES.BAD_REQUEST_ERROR
        );
    }
};

export const tonReConnectRequest = async (
    storage: IStorage,
    webViewUrl: string
): Promise<ConnectItem[]> => {
    const wallet = await getCurrentWallet(storage);
    console.log(wallet);

    await checkWalletConnectionOrDie({ storage, wallet, webViewUrl });
    return [toTonAddressItemReply(wallet)];
};

export const toTonAddressItemReply = (wallet: WalletState) => {
    const contract = walletContractFromState(wallet);
    const result: TonAddressItemReply = {
        name: 'ton_addr',
        address: contract.address.toRawString(),
        network: (wallet.network || Network.MAINNET).toString(),
        walletStateInit: beginCell()
            .storeWritable(storeStateInit(contract.init))
            .endCell()
            .toBoc()
            .toString('base64'),
        publicKey: wallet.publicKey
    };

    return result;
};

export interface ConnectProofPayload {
    timestamp: number;
    bufferToSign: Buffer;
    domainBuffer: Buffer;
    payload: string;
    origin: string;
}

export const tonConnectProofPayload = (
    origin: string,
    wallet: string,
    payload: string
): ConnectProofPayload => {
    const timestamp = Math.round(Date.now() / 1000);
    const timestampBuffer = Buffer.allocUnsafe(8);
    timestampBuffer.writeBigInt64LE(BigInt(timestamp));

    const domainBuffer = Buffer.from(new URL(origin).host);

    const domainLengthBuffer = Buffer.allocUnsafe(4);
    domainLengthBuffer.writeInt32LE(domainBuffer.byteLength);

    const address = Address.parse(wallet);

    const addressWorkchainBuffer = Buffer.allocUnsafe(4);
    addressWorkchainBuffer.writeInt32BE(address.workChain);

    const addressBuffer = Buffer.concat([addressWorkchainBuffer, address.hash]);

    const messageBuffer = Buffer.concat([
        Buffer.from('ton-proof-item-v2/', 'utf8'),
        addressBuffer,
        domainLengthBuffer,
        domainBuffer,
        timestampBuffer,
        Buffer.from(payload)
    ]);

    const bufferToSign = Buffer.concat([
        Buffer.from('ffff', 'hex'),
        Buffer.from('ton-connect', 'utf8'),
        Buffer.from(sha256_sync(messageBuffer))
    ]);

    return {
        timestamp,
        bufferToSign,
        domainBuffer,
        payload,
        origin
    };
};

const toTonProofItemReplySuccess = (proof: ConnectProofPayload, signature: Buffer) => {
    const result: TonProofItemReplySuccess = {
        name: 'ton_proof',
        proof: {
            timestamp: proof.timestamp, // 64-bit unix epoch time of the signing operation (seconds)
            domain: {
                lengthBytes: proof.domainBuffer.byteLength, // AppDomain Length
                value: proof.domainBuffer.toString('utf8') // app domain name (as url part, without encoding)
            },
            signature: signature.toString('base64'), // base64-encoded signature
            payload: proof.payload // payload from the request
        }
    };

    return result;
};

export const toTonProofItemReply = async (options: {
    storage: IStorage;
    wallet: WalletState;
    password: string;
    proof: ConnectProofPayload;
}): Promise<TonProofItemReplySuccess> => {
    const mnemonic = await getWalletMnemonic(
        options.storage,
        options.wallet.publicKey,
        options.password
    );
    const keyPair = await mnemonicToPrivateKey(mnemonic);

    const signature = nacl.sign.detached(
        Buffer.from(sha256_sync(options.proof.bufferToSign)),
        keyPair.secretKey
    );

    return toTonProofItemReplySuccess(options.proof, Buffer.from(signature));
};

export const tonDisconnectRequest = async (options: { storage: IStorage; webViewUrl: string }) => {
    const wallet = await getCurrentWallet(options.storage);
    await disconnectAccountConnection({ ...options, wallet });
};

export const walletTonConnect = async (options: {
    storage: IStorage;
    wallet: WalletState;
    manifest: DAppManifest;
    params: TonConnectParams;
    replyItems: ConnectItemReply[];
    appVersion: string;
    webViewUrl: string;
}): Promise<ConnectEvent> => {
    await saveAccountConnection(options);
    return {
        id: Date.now(),
        event: 'connect',
        payload: {
            items: options.replyItems,
            device: getDeviceInfo(options.appVersion)
        }
    };
};
