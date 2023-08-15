import { Address, WalletContractV4 } from 'ton';
import { KeyPair, mnemonicToPrivateKey } from 'ton-crypto';
import { IStorage } from '../Storage';
import { Network } from '../entries/network';
import { WalletAddress, WalletState, WalletVersion, WalletVersions } from '../entries/wallet';
import { Configuration, WalletApi } from '../tonApiV1';
import { Configuration as TronConfiguration } from '../tronApi';
import { encrypt } from './cryptoService';
import { getTronWallet } from './tron/tronService';
import { walletContract } from './wallet/contractService';
import { setWalletState } from './wallet/storeService';

export const importWallet = async (
    tonApiConfig: Configuration,
    tronApi: TronConfiguration,
    mnemonic: string[],
    password: string,
    name?: string
): Promise<readonly [string, WalletState]> => {
    const encryptedMnemonic = await encrypt(mnemonic.join(' '), password);
    const keyPair = await mnemonicToPrivateKey(mnemonic);

    const active = await findWalletAddress(tonApiConfig, keyPair);

    const publicKey = keyPair.publicKey.toString('hex');

    const state: WalletState = {
        publicKey,
        active,
        revision: 0,
        name
    };

    state.tron = await getTronWallet(tronApi, mnemonic, state).catch(() => undefined);

    return [encryptedMnemonic, state] as const;
};

const versionMap: Record<string, WalletVersion> = {
    wallet_v3R1: WalletVersion.V3R1,
    wallet_v3R2: WalletVersion.V3R2,
    wallet_v4R2: WalletVersion.V4R2
};

const findWalletVersion = (interfaces: string[]): WalletVersion => {
    for (const value of interfaces) {
        if (versionMap[value] !== undefined) {
            return versionMap[value];
        }
    }
    throw new Error('Unexpected wallet version');
};

const findWalletAddress = async (tonApiConfig: Configuration, keyPair: KeyPair) => {
    const result = await new WalletApi(tonApiConfig).findWalletsByPubKey({
        publicKey: keyPair.publicKey.toString('hex')
    });

    const [activeWallet] = result.wallets
        .filter(wallet => {
            if (wallet.interfaces.some(value => Object.keys(versionMap).includes(value))) {
                return wallet.balance > 0 || wallet.status === 'active';
            }
            return false;
        })
        .sort((one, two) => two.balance - one.balance);

    if (activeWallet) {
        const wallet: WalletAddress = {
            rawAddress: activeWallet.address,
            friendlyAddress: Address.parse(activeWallet.address).toString(),
            version: findWalletVersion(activeWallet.interfaces)
        };

        return wallet;
    }

    const contact = WalletContractV4.create({
        workchain: 0,
        publicKey: keyPair.publicKey
    });
    const wallet: WalletAddress = {
        rawAddress: contact.address.toRawString(),
        friendlyAddress: contact.address.toString(),
        version: WalletVersion.V4R2
    };

    return wallet;
};

export const getWalletAddress = (
    publicKey: Buffer,
    version: WalletVersion,
    network?: Network
): WalletAddress => {
    const { address } = walletContract(publicKey, version);
    return {
        rawAddress: address.toRawString(),
        friendlyAddress: address.toString({
            testOnly: network === Network.TESTNET
        }),
        version
    };
};

export const getWalletsAddresses = (
    publicKey: Buffer | string,
    network?: Network
): Record<(typeof WalletVersions)[number], WalletAddress> => {
    if (typeof publicKey === 'string') {
        publicKey = Buffer.from(publicKey, 'hex');
    }

    return Object.fromEntries(
        WalletVersions.map(version => [
            version,
            getWalletAddress(publicKey as Buffer, version, network)
        ])
    ) as Record<(typeof WalletVersions)[number], WalletAddress>;
};

export const updateWalletVersion = async (
    storage: IStorage,
    wallet: WalletState,
    version: WalletVersion
) => {
    const updated: WalletState = {
        ...wallet,
        revision: wallet.revision + 1,
        active: getWalletAddress(Buffer.from(wallet.publicKey, 'hex'), version, wallet.network)
    };
    await setWalletState(storage, updated);
};

export const updateWalletProperty = async (
    tonApi: Configuration,
    storage: IStorage,
    wallet: WalletState,
    props: Pick<
        WalletState,
        'name' | 'hiddenJettons' | 'shownJettons' | 'orderJettons' | 'lang' | 'fiat' | 'network'
    >
) => {
    const updated: WalletState = {
        ...wallet,
        ...props,
        revision: wallet.revision + 1
    };
    await setWalletState(storage, updated);
};
