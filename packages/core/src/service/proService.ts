import { ProState, ProStateSubscription } from '../entries/pro';
import { WalletState, walletVersionFromText, walletVersionText } from '../entries/wallet';
import { AppKey } from '../Keys';
import { IStorage } from '../Storage';
import { ProjectService, ProServiceService } from '../tonConsoleApi';
import { createTonProofItem, tonConnectProofPayload } from './tonConnect/connectService';
import { walletContract, walletStateInitFromState } from './wallet/contractService';

const getBackupState = async (storage: IStorage) => {
    const backup = await storage.get<ProStateSubscription>(AppKey.PRO_BACKUP);
    return backup ?? toEmptySubscription();
};

export const getProState = async (wallet: WalletState): Promise<ProState> => {
    const hasCookie = await checkAuthCookie();

    if (hasCookie) {
        return await loadProState(wallet);
    } else {
        return {
            subscription: toEmptySubscription(),
            hasCookie: false,
            wallet: {
                publicKey: wallet.publicKey,
                rawAddress: wallet.active.rawAddress
            }
        };
    }
};

const toEmptySubscription = (): ProStateSubscription => {
    return {
        valid: false
    };
};

const createProjectName = (wallet: WalletState) => {
    return `TonkeeperPro|${wallet.publicKey}|${walletVersionText(wallet.active.version)}`;
};

export const maybeCreateProProject = async (wallet: WalletState) => {
    const { items } = await ProjectService.getProjects();
    const project = items.find(item => item.name.startsWith('TonkeeperPro'));
    if (!project) {
        return await ProjectService.createProject({ name: createProjectName(wallet) });
    }
};

export const loadProState = async (wallet: WalletState): Promise<ProState> => {
    const { items } = await ProjectService.getProjects();

    const project = items.find(item => item.name.startsWith('TonkeeperPro'));

    if (!project) {
        const subscription = toEmptySubscription();
        return {
            subscription,
            hasCookie: true,
            wallet: {
                publicKey: wallet.publicKey,
                rawAddress: wallet.active.rawAddress
            }
        };
    }

    const [_, publicKey, version] = project.name.split('|');
    const { address } = walletContract(
        Buffer.from(publicKey, 'hex'),
        walletVersionFromText(version)
    );

    const subscription = await ProServiceService.proServiceVerify();

    return {
        subscription,
        hasCookie: true,
        wallet: {
            publicKey: publicKey,
            rawAddress: address.toRawString()
        }
    };
};

export const checkAuthCookie = async () => {
    try {
        await ProServiceService.proServiceVerify();
        return true;
    } catch (e) {
        return false;
    }
};

export const authViaTonConnect = async (
    wallet: WalletState,
    signProof: (bufferToSing: Buffer) => Promise<Uint8Array>
) => {
    const domain = 'https://tonkeeper.com/';
    const { payload } = await ProServiceService.proServiceAuthGeneratePayload();

    const proofPayload = tonConnectProofPayload(domain, wallet.active.rawAddress, payload);
    const stateInit = walletStateInitFromState(wallet);
    const proof = createTonProofItem(
        await signProof(proofPayload.bufferToSign),
        proofPayload,
        stateInit
    );

    const result = await ProServiceService.proServiceTonConnectAuth({
        address: wallet.active.rawAddress,
        proof: {
            timestamp: proof.timestamp,
            domain: proof.domain.value,
            signature: proof.signature,
            payload,
            state_init: proof.stateInit
        }
    });

    if (!result.ok) {
        throw new Error('Unable to authorize');
    }
};

export const logoutTonConsole = async () => {
    const result = await ProServiceService.proServiceLogout();
    if (!result.ok) {
        throw new Error('Unable to logout');
    }
};
