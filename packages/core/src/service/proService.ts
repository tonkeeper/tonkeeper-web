import { ProState, ProStateSubscription, ProStateWallet } from '../entries/pro';
import { WalletState } from '../entries/wallet';
import { AppKey } from '../Keys';
import { IStorage } from '../Storage';
import { AccountService, AuthService, Project, ProjectService } from '../tonConsoleApi';
import { createTonProofItem, tonConnectProofPayload } from './tonConnect/connectService';
import { walletStateInitFromState } from './wallet/contractService';

const getBackupState = async (storage: IStorage) => {
    const backup = await storage.get<ProStateSubscription>(AppKey.PRO_BACKUP);
    return backup ?? toEmptySubscription();
};

export const getProState = async (storage: IStorage, wallet: WalletState): Promise<ProState> => {
    const [state, hasCookie] = await Promise.all([
        storage.get<ProStateWallet>(AppKey.PRO),
        checkAuthCookie()
    ]);

    const subscription = hasCookie ? await loadProState(storage) : await getBackupState(storage);

    if (!state) {
        return {
            wallet: {
                publicKey: wallet.publicKey,
                rawAddress: wallet.active.rawAddress
            },
            hasCookie,
            subscription
        };
    }

    return { wallet: state, hasCookie, subscription };
};

export const validateProSubscription = async (publicKey: string) => {
    AuthService.authGeneratePayload();
};

const toEmptySubscription = (): ProStateSubscription => {
    return {
        valid: false,
        validUntil: Date.now()
    };
};

export const loadProState = async (storage: IStorage, force: boolean = false) => {
    let items: Project[] = [];
    try {
        const projects = await ProjectService.getProjects();
        items = projects.items;
    } catch (e) {
        if (force) {
            throw e;
        }
    }

    const project = items.find(item => item.name.startsWith('TonkeeperPro')); // TODO: Add wallet address to project name

    if (!project) {
        return toEmptySubscription();
    }

    const subscription: ProStateSubscription = { valid: true, validUntil: Date.now() }; //await ProjectService.validatePro( project.id;) // TODO: Implement api

    await storage.set(AppKey.PRO_BACKUP, subscription);

    return subscription;
};

export const checkAuthCookie = async () => {
    try {
        await ProjectService.getProjects();
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
    const { payload } = await AuthService.authGeneratePayload();

    const proofPayload = tonConnectProofPayload(domain, wallet.active.rawAddress, payload);
    const stateInit = walletStateInitFromState(wallet);
    const proof = createTonProofItem(
        await signProof(proofPayload.bufferToSign),
        proofPayload,
        stateInit
    );

    const result = await AuthService.authViaTonConnect({
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
    const result = await AccountService.accountLogout();
    if (!result.ok) {
        throw new Error('Unable to logout');
    }
};
