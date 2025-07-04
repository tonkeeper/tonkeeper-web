import { Address } from '@ton/core';
import BigNumber from 'bignumber.js';
import { AppKey } from '../Keys';
import { IStorage } from '../Storage';
import { APIConfig } from '../entries/apis';
import { BLOCKCHAIN_NAME } from '../entries/crypto';
import { AssetAmount } from '../entries/crypto/asset/asset-amount';
import { TON_ASSET } from '../entries/crypto/asset/constants';
import { DashboardCell, DashboardColumn, DashboardRow } from '../entries/dashboard';
import { FiatCurrencies } from '../entries/fiat';
import { Language, localizationText } from '../entries/language';
import {
    hasSubscriptionSource,
    isPendingSubscription,
    isProSubscription,
    isValidSubscription,
    ProState,
    ProStateWallet,
    ProSubscription
} from '../entries/pro';
import { RecipientData, TonRecipientData } from '../entries/send';
import { TonWalletStandard, WalletVersion } from '../entries/wallet';
import { AccountsApi } from '../tonApiV2';
import {
    FiatCurrencies as FiatCurrenciesGenerated,
    InvoicesInvoice,
    InvoiceStatus,
    ProServiceDashboardCellAddress,
    ProServiceDashboardCellNumericCrypto,
    ProServiceDashboardCellNumericFiat,
    ProServiceDashboardCellString,
    ProServiceDashboardColumnType,
    ProServiceService
} from '../tonConsoleApi';
import { delay } from '../utils/common';
import { Flatten } from '../utils/types';
import { loginViaTG } from './telegramOauth';
import { createTonProofItem, tonConnectProofPayload } from './tonConnect/connectService';
import { getServerTime } from './ton-blockchain/utils';
import { walletStateInitFromState } from './wallet/contractService';
import { AuthService, TiersService, UsersService, IapService } from '../pro';
import { findAuthorizedWallet, normalizeSubscription } from '../utils/pro';

export const setBackupState = async (storage: IStorage, state: ProSubscription) => {
    await storage.set(AppKey.PRO_BACKUP, state);
};

export const getBackupState = async (storage: IStorage) => {
    const backup = await storage.get<ProSubscription>(AppKey.PRO_BACKUP);
    return backup ?? null;
};

export const getProState = async (
    authTokenService: ProAuthTokenService,
    storage: IStorage
): Promise<ProState> => {
    try {
        return await loadProState(authTokenService, storage);
    } catch (e) {
        console.error(e);
        return {
            subscription: null,
            authorizedWallet: null
        };
    }
};

export const walletVersionFromProServiceDTO = (value: string) => {
    switch (value.toUpperCase()) {
        case 'V3R1':
            return WalletVersion.V3R1;
        case 'V3R2':
            return WalletVersion.V3R2;
        case 'V4R2':
            return WalletVersion.V4R2;
        case 'V5_BETA':
            return WalletVersion.V5_BETA;
        case 'V5R1':
            return WalletVersion.V5R1;
        default:
            throw new Error('Unsupported version');
    }
};

export type ProAuthTokenService = {
    attachToken: () => Promise<void>;
    onTokenUpdated: (token: string | null) => Promise<void>;
};

const loadProState = async (
    authService: ProAuthTokenService,
    storage: IStorage
): Promise<ProState> => {
    await authService.attachToken();
    const user = await UsersService.getUserInfo();

    const authorizedWallet: ProStateWallet | null = await findAuthorizedWallet(user, storage);

    if (!authorizedWallet) {
        return {
            authorizedWallet: null,
            subscription: null
        };
    }

    const subscriptionDTO = await UsersService.verifySubscription();
    const subscription = normalizeSubscription(subscriptionDTO, user);

    if (isValidSubscription(subscription)) {
        await storage.delete(AppKey.PRO_PENDING_STATE);

        return {
            subscription,
            authorizedWallet
        };
    }

    const processingState: ProSubscription | undefined = await storage.get(
        AppKey.PRO_PENDING_STATE
    );

    if (
        isProSubscription(processingState) &&
        hasSubscriptionSource(processingState) &&
        isPendingSubscription(processingState)
    ) {
        // TODO Start polling backend
        return {
            authorizedWallet,
            subscription: processingState
        };
    }

    return {
        authorizedWallet,
        subscription: null
    };
};

export const authViaTonConnect = async (
    authService: ProAuthTokenService,
    api: APIConfig,
    wallet: TonWalletStandard,
    signProof: (bufferToSing: Buffer) => Promise<Uint8Array>
) => {
    const domain = 'tonkeeper';
    const { payload } = await AuthService.authGeneratePayload();

    const timestamp = await getServerTime(api);
    const proofPayload = tonConnectProofPayload(timestamp, domain, wallet.rawAddress, payload);
    const stateInit = walletStateInitFromState(wallet);
    const proof = createTonProofItem(
        await signProof(proofPayload.bufferToSign),
        proofPayload,
        stateInit
    );

    const result = await AuthService.tonConnectAuth({
        address: wallet.rawAddress,
        proof: {
            timestamp: proof.timestamp,
            domain: proof.domain.value,
            signature: proof.signature,
            payload,
            state_init: proof.stateInit
        }
    });

    if (!result.ok || !result.auth_token) {
        throw new Error('Unable to authorize');
    }

    await authService.onTokenUpdated(result.auth_token);
};

export const logoutTonConsole = async (authService: ProAuthTokenService) => {
    const result = await AuthService.logout();
    if (!result.ok) {
        throw new Error('Unable to logout');
    }

    await authService.onTokenUpdated(null);
};

export const getProServiceTiers = async (lang?: Language | undefined, promoCode?: string) => {
    const { items } = await TiersService.getTiers(localizationText(lang) as Lang, promoCode);

    return items;
};

export const createProServiceInvoice = async (tierId: number, promoCode?: string) => {
    return ProServiceService.createProServiceInvoice({
        tier_id: tierId,
        promo_code: promoCode
    });
};

export const createRecipient = async (
    api: APIConfig,
    invoice: InvoicesInvoice
): Promise<[RecipientData, AssetAmount]> => {
    const toAccount = await new AccountsApi(api.tonApiV2).getAccount({
        accountId: invoice.pay_to_address
    });

    const recipient: TonRecipientData = {
        address: {
            address: Address.parse(invoice.pay_to_address).toString({ bounceable: false }),
            blockchain: BLOCKCHAIN_NAME.TON
        },
        comment: invoice.id,
        done: true,
        toAccount: toAccount
    };

    const asset = new AssetAmount({
        asset: TON_ASSET,
        weiAmount: new BigNumber(invoice.amount)
    });

    return [recipient, asset];
};

export const retryProService = async (authService: ProAuthTokenService, storage: IStorage) => {
    for (let i = 0; i < 10; i++) {
        const state = await getProState(authService, storage);
        if (isValidSubscription(state.subscription)) {
            return;
        }
        await delay(5000);
    }
};

export const waitProServiceInvoice = async (invoice: InvoicesInvoice) => {
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

export const saveIapPurchase = async (
    originalTransactionId: string,
    sandbox: boolean
): Promise<{ ok: boolean }> => {
    try {
        return await IapService.activateIapPurchase({
            original_transaction_id: originalTransactionId,
            sandbox
        });
    } catch (e) {
        return {
            ok: false
        };
    }
};

export async function startProServiceTrial(
    authService: ProAuthTokenService,
    botId: string,
    lang?: string
) {
    const tgData = await loginViaTG(botId, lang);
    if (!tgData) {
        return false;
    }
    const result = await ProServiceService.proServiceTrial(tgData);

    await authService.onTokenUpdated(result.auth_token);

    return result.ok;
}

export async function getDashboardColumns(lang?: string): Promise<DashboardColumn[]> {
    if (!Object.values(Lang).includes(lang as Lang)) {
        lang = Lang.EN;
    }

    const result = await ProServiceService.proServiceDashboardColumns(lang as Lang);
    return result.items.map(item => ({
        id: item.id,
        name: item.name,
        type: item.column_type,
        defaultIsChecked: item.checked_default,
        onlyPro: item.only_pro
    }));
}

enum Lang {
    EN = 'en',
    RU = 'ru'
}

export async function getDashboardData(
    query: {
        accounts: string[];
        columns: string[];
    },
    options?: { lang?: string; currency?: FiatCurrencies }
): Promise<DashboardRow[]> {
    let lang = Lang.EN;
    if (Object.values(Lang).includes(options?.lang as Lang)) {
        lang = options?.lang as Lang;
    }

    let currency = FiatCurrenciesGenerated.USD;
    if (
        Object.values(FiatCurrenciesGenerated).includes(
            options?.currency as FiatCurrenciesGenerated
        )
    ) {
        currency = options?.currency as FiatCurrenciesGenerated;
    }

    const result = await ProServiceService.proServiceDashboardData(lang, currency, query);
    return result.items.map((row, index) => ({
        id: query.accounts[index],
        cells: row.map(mapDtoCellToCell)
    }));
}

type DTOCell = Flatten<
    Flatten<Awaited<ReturnType<typeof ProServiceService.proServiceDashboardData>>['items']>
>;

function mapDtoCellToCell(dtoCell: DTOCell): DashboardCell {
    switch (dtoCell.type) {
        case ProServiceDashboardColumnType.STRING: {
            const cell = dtoCell as ProServiceDashboardCellString;

            return {
                columnId: cell.column_id,
                type: 'string',
                value: cell.value
            };
        }
        case ProServiceDashboardColumnType.ADDRESS: {
            const cell = dtoCell as ProServiceDashboardCellAddress;
            return {
                columnId: cell.column_id,
                type: 'address',
                raw: cell.raw
            };
        }
        case ProServiceDashboardColumnType.NUMERIC_CRYPTO: {
            const cell = dtoCell as ProServiceDashboardCellNumericCrypto;
            return {
                columnId: cell.column_id,
                type: 'numeric_crypto',
                value: new BigNumber(cell.value),
                decimals: cell.decimals,
                symbol: cell.symbol
            };
        }

        case ProServiceDashboardColumnType.NUMERIC_FIAT: {
            const cell = dtoCell as ProServiceDashboardCellNumericFiat;
            return {
                columnId: cell.column_id,
                type: 'numeric_fiat',
                value: new BigNumber(cell.value),
                fiat: cell.fiat
            };
        }
        default:
            throw new Error('Unsupported cell type');
    }
}
