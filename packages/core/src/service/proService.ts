import BigNumber from 'bignumber.js';
import { AppKey } from '../Keys';
import { IStorage } from '../Storage';
import { APIConfig } from '../entries/apis';
import { BLOCKCHAIN_NAME } from '../entries/crypto';
import { AssetAmount } from '../entries/crypto/asset/asset-amount';
import { TON_ASSET } from '../entries/crypto/asset/constants';
import { Language, localizationText } from '../entries/language';
import { ProState, ProStateSubscription } from '../entries/pro';
import { TonRecipientData } from '../entries/send';
import { WalletState } from '../entries/wallet';
import { AccountsApi, MessageConsequences } from '../tonApiV2';
import { InvoiceStatus, InvoicesInvoice, Lang, ProServiceService } from '../tonConsoleApi';
import { delay } from '../utils/common';
import { createTonProofItem, tonConnectProofPayload } from './tonConnect/connectService';
import { estimateTonTransfer, sendTonTransfer } from './transfer/tonService';
import { walletStateInitFromState } from './wallet/contractService';
import { getWalletState } from './wallet/storeService';

const getBackupState = async (storage: IStorage) => {
    const backup = await storage.get<ProStateSubscription>(AppKey.PRO_BACKUP);
    return backup ?? toEmptySubscription();
};

export const getProState = async (storage: IStorage, wallet: WalletState): Promise<ProState> => {
    try {
        return await loadProState(storage);
    } catch (e) {
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
        valid: false,
        is_trial: false,
        used_trial: false
    };
};

export const loadProState = async (storage: IStorage): Promise<ProState> => {
    const user = await ProServiceService.proServiceGetUserInfo();

    const wallet = await getWalletState(storage, user.pub_key);
    if (!wallet) {
        throw new Error('Unknown wallet');
    }

    const subscription = await ProServiceService.proServiceVerify();
    return {
        subscription,
        hasCookie: true,
        wallet: {
            publicKey: wallet.publicKey,
            rawAddress: wallet.active.rawAddress
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

export const getProServiceTiers = async (lang?: Language | undefined, promoCode?: string) => {
    const { items } = await ProServiceService.getProServiceTiers(
        localizationText(lang) as Lang,
        promoCode
    );
    return items;
};

export const createProServiceInvoice = async (tierId: number, promoCode?: string) => {
    return await ProServiceService.createProServiceInvoice({
        tier_id: tierId,
        promo_code: promoCode
    });
};

const createRecipient = async (api: APIConfig, invoice: InvoicesInvoice) => {
    const toAccount = await new AccountsApi(api.tonApiV2).getAccount({
        accountId: invoice.pay_to_address
    });

    const recipient: TonRecipientData = {
        address: { address: invoice.pay_to_address, blockchain: BLOCKCHAIN_NAME.TON },
        comment: invoice.id,
        done: true,
        toAccount: toAccount
    };
    return recipient;
};

export const estimateProServiceInvoice = async (
    api: APIConfig,
    walletState: WalletState,
    invoice: InvoicesInvoice
) => {
    const recipient = await createRecipient(api, invoice);
    const estimate = await estimateTonTransfer(
        api,
        walletState,
        recipient,
        new BigNumber(invoice.amount),
        false
    );
    return estimate;
};

export const publishAndWaitProServiceInvoice = async (
    api: APIConfig,
    walletState: WalletState,
    invoice: InvoicesInvoice,
    estimate: MessageConsequences,
    mnemonic: string[]
) => {
    const recipient = await createRecipient(api, invoice);

    await sendTonTransfer(
        api,
        walletState,
        recipient,
        new AssetAmount({
            asset: TON_ASSET,
            weiAmount: new BigNumber(invoice.amount)
        }),
        false,
        estimate,
        mnemonic
    );

    let updated = invoice;

    do {
        await delay(4000);
        try {
            updated = await ProServiceService.getProServiceInvoice(invoice.id);
        } catch (e) {
            console.warn(e);
        }
    } while (updated.status === InvoiceStatus.PENDING);
};
