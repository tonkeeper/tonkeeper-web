import { Address, beginCell, storeStateInit } from '@ton/core';
import { getSecureRandomBytes, keyPairFromSeed, sha256_sync } from '@ton/crypto';
import queryString from 'query-string';
import { IStorage } from '../../Storage';
import { TonConnectError } from '../../entries/exception';
import { Network } from '../../entries/network';
import {
    CONNECT_EVENT_ERROR_CODES,
    ConnectEvent,
    ConnectItemReply,
    ConnectRequest,
    DAppManifest,
    DeviceInfo,
    DisconnectEvent,
    SEND_TRANSACTION_ERROR_CODES,
    SendTransactionRpcResponseError,
    SendTransactionRpcResponseSuccess,
    TonAddressItemReply,
    TonConnectAccount,
    TonProofItemReplySuccess
} from '../../entries/tonConnect';
import { isStandardTonWallet, TonContract, WalletId } from '../../entries/wallet';
import { TonWalletStandard, WalletVersion } from '../../entries/wallet';
import { accountsStorage } from '../accountsStorage';
import { walletContractFromState } from '../wallet/contractService';
import {
    AccountConnection,
    TonConnectParams,
    disconnectAccountConnection,
    getTonWalletConnections,
    saveAccountConnection
} from './connectionService';
import { SessionCrypto } from './protocol';
import { Account, isAccountSupportTonConnect } from '../../entries/account';

export function parseTonConnect(options: { url: string }): TonConnectParams | string {
    try {
        const { query } = queryString.parseUrl(options.url);

        if (query.v !== '2') {
            throw Error(`Unknown protocol version: ${query.v}`);
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
        const sessionCrypto = new SessionCrypto();

        return {
            protocolVersion,
            request,
            clientSessionId,
            sessionKeyPair: sessionCrypto.stringifyKeypair()
        };
    } catch (e) {
        if (e instanceof Error) {
            return e.message;
        }
        return 'Unknown Error';
    }
}

export const getTonConnectParams = async (
    request: ConnectRequest,
    protocolVersion?: number,
    clientSessionId?: string
): Promise<TonConnectParams> => {
    const randomBytes: Buffer = await getSecureRandomBytes(32);
    const keyPair = keyPairFromSeed(randomBytes);

    return {
        protocolVersion: protocolVersion ?? 2,
        request,
        clientSessionId: clientSessionId ?? (await getSecureRandomBytes(32)).toString('hex'),
        sessionKeyPair: {
            secretKey: keyPair.secretKey.toString('hex'),
            publicKey: keyPair.publicKey.toString('hex')
        }
    };
};

const getManifestResponse = async (manifestUrl: string) => {
    try {
        return await fetch(manifestUrl);
    } catch (e) {
        /**
         * Request file with CORS header;
         */
        return await fetch(`https://c.tonapi.io/json?url=${btoa(manifestUrl)}`);
    }
};

export const getManifest = async (request: ConnectRequest) => {
    // TODO: get fetch from context
    const response = await getManifestResponse(request.manifestUrl);

    if (response.status !== 200) {
        throw new Error(`Failed to load Manifest: ${response.status}`);
    }

    const manifest: DAppManifest = await response.json();

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

export function getBrowserPlatform(): DeviceInfo['platform'] {
    const platform =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window?.navigator as any)?.userAgentData?.platform || window?.navigator.platform;

    const userAgent = window?.navigator.userAgent;

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

export const getDeviceInfo = (
    platform: DeviceInfo['platform'],
    appVersion: string,
    maxMessages: number
): DeviceInfo => {
    return {
        platform: platform,
        appName: 'Tonkeeper',
        appVersion: appVersion,
        maxProtocolVersion: 2,
        features: [
            'SendTransaction',
            {
                name: 'SendTransaction',
                maxMessages: maxMessages,
                extraCurrencySupported: true
            }
        ]
    };
};

export const getDappConnection = async (
    storage: IStorage,
    origin: string,
    account?: TonConnectAccount
): Promise<{ wallet: TonContract; connection: AccountConnection } | undefined> => {
    const appConnections = await getAppConnections(storage);
    if (account) {
        const walletState = appConnections.find(c => c.wallet.rawAddress === account?.address);
        const connection = walletState?.connections.find(item => item.webViewUrl === origin);
        if (walletState && connection) {
            return { wallet: walletState.wallet, connection };
        }
    }

    return (
        appConnections
            .map(item => {
                const connection = item.connections.find(ac => ac.webViewUrl === origin);
                if (connection) {
                    return { wallet: item.wallet, connection };
                }
                return null;
            })
            .filter(Boolean)[0] ?? undefined
    );
};

export const getAppConnections = async (
    storage: IStorage
): Promise<{ wallet: TonContract; connections: AccountConnection[] }[]> => {
    const accounts = (await accountsStorage(storage).getAccounts()).filter(
        isAccountSupportTonConnect
    );
    if (!accounts.length) {
        throw new TonConnectError(
            'Missing active wallet',
            CONNECT_EVENT_ERROR_CODES.UNKNOWN_APP_ERROR
        );
    }

    return Promise.all(
        accounts
            .flatMap(a => a.allTonWallets)
            .map(async wallet => {
                const walletConnections = await getTonWalletConnections(storage, wallet);
                return { wallet, connections: walletConnections };
            })
    );
};

export const checkWalletConnectionOrDie = async (options: {
    storage: IStorage;
    wallet: TonWalletStandard;
    webViewUrl: string;
}) => {
    const connections = await getTonWalletConnections(options.storage, options.wallet);

    console.log(connections);

    const connection = connections.find(item => item.webViewUrl === options.webViewUrl);
    if (connection === undefined) {
        throw new TonConnectError(
            'Missing connection',
            CONNECT_EVENT_ERROR_CODES.BAD_REQUEST_ERROR
        );
    }
};

export interface ReConnectPayload {
    items: ConnectItemReply[];
    maxMessages: number;
}

export const tonReConnectRequest = async (
    storage: IStorage,
    webViewUrl: string
): Promise<ReConnectPayload> => {
    const connection = await getDappConnection(storage, webViewUrl);
    if (!connection) {
        throw new TonConnectError(
            'Missing connection',
            CONNECT_EVENT_ERROR_CODES.BAD_REQUEST_ERROR
        );
    }

    const maxMessages =
        isStandardTonWallet(connection.wallet) && connection.wallet.version === WalletVersion.V5R1
            ? 255
            : 4;

    return {
        items: [
            toTonAddressItemReply(
                connection.wallet,
                'network' in connection.wallet
                    ? (connection.wallet.network as Network)
                    : Network.MAINNET
            )
        ],
        maxMessages
    };
};

export const toTonAddressItemReply = (
    wallet: TonContract,
    network: Network
): TonAddressItemReply => {
    /**
     * for multisig wallets
     */
    if (!isStandardTonWallet(wallet)) {
        return {
            name: 'ton_addr',
            address: wallet.rawAddress,
            network: network.toString(),
            walletStateInit: ''
        };
    }
    const contract = walletContractFromState(wallet);
    return {
        name: 'ton_addr',
        address: contract.address.toRawString(),
        network: network.toString(),
        walletStateInit: beginCell()
            .storeWritable(storeStateInit(contract.init))
            .endCell()
            .toBoc()
            .toString('base64'),
        publicKey: wallet.publicKey
    };
};

export interface ConnectProofPayload {
    timestamp: number;
    bufferToSign: Buffer;
    domainBuffer: Buffer;
    payload: string;
    origin: string;
    messageBuffer: Buffer;
}

export const tonConnectProofPayload = (
    timestamp: number,
    origin: string,
    wallet: string,
    payload: string
): ConnectProofPayload & { domain: string } => {
    const timestampBuffer = Buffer.allocUnsafe(8);
    timestampBuffer.writeBigInt64LE(BigInt(timestamp));

    const domain = origin.includes('://') ? new URL(origin).host : origin;
    const domainBuffer = Buffer.from(domain);

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
        origin,
        messageBuffer,
        domain
    };
};

export const toTonProofItemReply = async (options: {
    storage: IStorage;
    account: Account;
    signTonConnect: (bufferToSign: Buffer) => Promise<Uint8Array>;
    proof: ConnectProofPayload;
}): Promise<TonProofItemReplySuccess> => {
    const signHash = options.account.type !== 'keystone';
    return {
        name: 'ton_proof',
        proof: await toTonProofItem(options.signTonConnect, options.proof, signHash)
    };
};

export const createTonProofItem = (
    signature: Uint8Array,
    proof: ConnectProofPayload,
    stateInit?: string
) => {
    return {
        timestamp: proof.timestamp, // 64-bit unix epoch time of the signing operation (seconds)
        domain: {
            lengthBytes: proof.domainBuffer.byteLength, // AppDomain Length
            value: proof.domainBuffer.toString('utf8') // app domain name (as url part, without encoding)
        },
        signature: Buffer.from(signature).toString('base64'), // base64-encoded signature
        payload: proof.payload, // payload from the request,
        stateInit: stateInit // state init for a wallet
    };
};

export const toTonProofItem = async (
    signTonConnect: (bufferToSign: Buffer) => Promise<Uint8Array>,
    proof: ConnectProofPayload,
    signHash = true,
    stateInit?: string
) => {
    const signature = await signTonConnect(signHash ? proof.bufferToSign : proof.messageBuffer);
    return createTonProofItem(signature, proof, stateInit);
};

export const tonDisconnectRequest = async (options: { storage: IStorage; webViewUrl: string }) => {
    const connection = await getDappConnection(options.storage, options.webViewUrl);
    if (!connection) {
        throw new TonConnectError(
            'Missing connection',
            CONNECT_EVENT_ERROR_CODES.BAD_REQUEST_ERROR
        );
    }
    await disconnectAccountConnection({ ...options, wallet: connection.wallet });
};

const getMaxMessages = (account: Account) => {
    if (account.type === 'ledger') {
        return 4;
    }

    const wallet = account.activeTonWallet;

    return isStandardTonWallet(wallet) && wallet.version === WalletVersion.V5R1 ? 255 : 4;
};

export const saveWalletTonConnect = async (options: {
    storage: IStorage;
    account: Account;
    manifest: DAppManifest;
    params: TonConnectParams;
    replyItems: ConnectItemReply[];
    appVersion: string;
    webViewUrl?: string;
    walletId?: WalletId;
}): Promise<ConnectEvent> => {
    const wallet =
        options.walletId !== undefined
            ? options.account.getTonWallet(options.walletId)
            : options.account.activeTonWallet;

    if (!wallet) {
        throw new Error('Missing wallet');
    }

    await saveAccountConnection({
        storage: options.storage,
        wallet,
        manifest: options.manifest,
        params: options.params,
        webViewUrl: options.webViewUrl
    });

    const maxMessages = getMaxMessages(options.account);

    return {
        id: Date.now(),
        event: 'connect',
        payload: {
            items: options.replyItems,
            device: getDeviceInfo(getBrowserPlatform(), options.appVersion, maxMessages)
        }
    };
};

export const connectRejectResponse = (): ConnectEvent => {
    return {
        id: Date.now(),
        event: 'connect_error',
        payload: {
            code: CONNECT_EVENT_ERROR_CODES.USER_REJECTS_ERROR,
            message: 'Reject Request'
        }
    };
};

export const disconnectResponse = (id: string): DisconnectEvent => {
    return {
        event: 'disconnect',
        id,
        payload: {}
    };
};

export const sendTransactionErrorResponse = (id: string): SendTransactionRpcResponseError => {
    return {
        id,
        error: {
            code: SEND_TRANSACTION_ERROR_CODES.USER_REJECTS_ERROR,
            message: 'Reject Request'
        }
    };
};

export const sendTransactionSuccessResponse = (
    id: string,
    boc: string
): SendTransactionRpcResponseSuccess => {
    return {
        id,
        result: boc
    };
};

export const sendBadRequestResponse = (
    id: string,
    name: string
): SendTransactionRpcResponseError => {
    return {
        error: {
            code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
            message: `Method "${name}" does not supported by the wallet app`
        },
        id
    };
};
