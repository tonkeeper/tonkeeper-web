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
import { ISupportData, ProStateWallet, ProSubscription, PurchaseErrors } from '../entries/pro';
import { RecipientData, TonRecipientData } from '../entries/send';
import {
    backwardCompatibilityOnlyWalletVersions,
    TonWalletStandard,
    WalletVersion
} from '../entries/wallet';
import { AccountsApi } from '../tonApiV2';
import { Flatten } from '../utils/types';
import { loginViaTG } from './telegramOauth';
import { createTonProofItem, tonConnectProofPayload } from './tonConnect/connectService';
import { getServerTime } from './ton-blockchain/utils';
import { walletStateInitFromState } from './wallet/contractService';
import {
    ApiError,
    AuthService,
    Currencies as CurrenciesGenerated,
    DashboardCellAddress,
    DashboardCellNumericCrypto,
    DashboardCellNumericFiat,
    DashboardCellString,
    DashboardColumnType,
    DashboardsService,
    IapService,
    Invoice,
    InvoicesService,
    SupportService,
    TiersService,
    UsersService
} from '../pro';
import { findAuthorizedWallet, normalizeSubscription } from '../utils/pro';

export const setBackupState = async (storage: IStorage, state: ProSubscription) => {
    await storage.set(AppKey.PRO_BACKUP, state);
};

export const getBackupState = async (storage: IStorage) => {
    const backup = await storage.get<ProSubscription>(AppKey.PRO_BACKUP);
    return backup ?? null;
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

export interface IProAuthTokenService {
    setToken(token: string): Promise<void>;
    getToken(): Promise<string | null>;
    deleteToken(): Promise<void>;
}

export const getNormalizedSubscription = async (storage: IStorage, token: string | null) => {
    if (!token) return null;

    try {
        const user = await UsersService.getUserInfo(`Bearer ${token}`);
        const authorizedWallet: ProStateWallet | null = await findAuthorizedWallet(user, storage);
        const currentSubscriptionDTO = await UsersService.verifySubscription(`Bearer ${token}`);

        return normalizeSubscription(currentSubscriptionDTO, authorizedWallet);
    } catch {
        return null;
    }
};

export const authViaTonConnect = async (
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

    return result.auth_token;
};

export interface ProAuthViaSeedPhraseParams {
    wallet: TonWalletStandard;
    signer: (b: Buffer) => Promise<Uint8Array | Buffer>;
}

export const authViaSeedPhrase = async (api: APIConfig, authData: ProAuthViaSeedPhraseParams) => {
    const domain = 'tonkeeper';
    const { wallet, signer } = authData;
    const { payload } = await AuthService.authGeneratePayload();

    const timestamp = await getServerTime(api);

    const proofPayload = tonConnectProofPayload(timestamp, domain, wallet.rawAddress, payload);

    const signature = await signer(proofPayload.bufferToSign);

    const stateInit = walletStateInitFromState(wallet);

    const proof = createTonProofItem(signature, proofPayload, stateInit);

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

    return result.auth_token;
};

export const logoutTonConsole = async (authService: IProAuthTokenService) => {
    try {
        const mainToken = await authService.getToken();

        if (mainToken) {
            await AuthService.logout(`Bearer ${mainToken}`);
            await authService.deleteToken();
        }
    } finally {
        await authService.deleteToken();
    }
};

export const getProServiceTiers = async (lang?: Language | undefined, promoCode?: string) => {
    const { items } = await TiersService.getTiers(localizationText(lang) as Lang, promoCode);

    return items;
};

type ProServiceInvoiceResponse = { ok: true; data: Invoice } | { ok: false; data: PurchaseErrors };

export const createProServiceInvoice = async (
    tempToken: string,
    tierId: number,
    promoCode?: string
): Promise<ProServiceInvoiceResponse> => {
    try {
        const invoice = await InvoicesService.createInvoice(`Bearer ${tempToken}`, {
            tier_id: tierId,
            promo_code: promoCode
        });

        return {
            ok: true,
            data: invoice
        };
    } catch (e) {
        if (e instanceof ApiError && e.status === 400) {
            return {
                ok: false,
                data: PurchaseErrors.PROMOCODE_ALREADY_USED
            };
        }

        return {
            ok: false,
            data: PurchaseErrors.PURCHASE_FAILED
        };
    }
};

export const createRecipient = async (
    api: APIConfig,
    invoice: Invoice
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

export const saveIapPurchase = async (
    originalTransactionId: string,
    token: string
): Promise<{ ok: boolean }> => {
    try {
        return await IapService.activateIapPurchase(
            {
                original_transaction_id: originalTransactionId
            },
            `Bearer ${token}`
        );
    } catch (e) {
        return {
            ok: false
        };
    }
};

export async function startProServiceTrial(botId: string, lang?: string): Promise<string> {
    const tgData = await loginViaTG(botId, lang);

    if (!tgData) {
        throw new Error('Unable to activate Trial');
    }

    const result = await TiersService.activateTrial(tgData);

    if (!result.ok || !result.auth_token) {
        throw new Error('Unable to activate Trial');
    }

    return result.auth_token;
}

export async function getDashboardColumns(lang?: string): Promise<DashboardColumn[]> {
    if (!Object.values(Lang).includes(lang as Lang)) {
        lang = Lang.EN;
    }

    const result = await DashboardsService.getDashboardColumns(lang as Lang);
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

    let currency = CurrenciesGenerated.USD;
    if (
        Object.values(CurrenciesGenerated).includes(
            options?.currency as unknown as CurrenciesGenerated
        )
    ) {
        currency = options?.currency as unknown as CurrenciesGenerated;
    }

    const result = await DashboardsService.getDashboardData(lang, currency, query);

    return result.items.map((row, index) => ({
        id: query.accounts[index],
        cells: row.map(mapDtoCellToCell)
    }));
}

type DTOCell = Flatten<
    Flatten<Awaited<ReturnType<typeof DashboardsService.getDashboardData>>['items']>
>;

function mapDtoCellToCell(dtoCell: DTOCell): DashboardCell {
    switch (dtoCell.type) {
        case DashboardColumnType.STRING: {
            const cell = dtoCell as DashboardCellString;

            return {
                columnId: cell.column_id,
                type: 'string',
                value: cell.value
            };
        }
        case DashboardColumnType.ADDRESS: {
            const cell = dtoCell as DashboardCellAddress;
            return {
                columnId: cell.column_id,
                type: 'address',
                raw: cell.raw
            };
        }
        case DashboardColumnType.NUMERIC_CRYPTO: {
            const cell = dtoCell as DashboardCellNumericCrypto;
            return {
                columnId: cell.column_id,
                type: 'numeric_crypto',
                value: new BigNumber(cell.value),
                decimals: cell.decimals,
                symbol: cell.symbol
            };
        }

        case DashboardColumnType.NUMERIC_FIAT: {
            const cell = dtoCell as DashboardCellNumericFiat;
            return {
                columnId: cell.column_id,
                type: 'numeric_fiat',
                value: new BigNumber(cell.value),
                fiat: cell.fiat as unknown as FiatCurrencies
            };
        }
        default:
            throw new Error('Unsupported cell type');
    }
}

export const getProSupportUrl = async (mainToken: string | null): Promise<ISupportData> => {
    const falsyResponse = {
        url: '',
        isPriority: false
    };

    if (!mainToken) return falsyResponse;

    try {
        const { url, is_priority } = await SupportService.getProSupport(`Bearer ${mainToken}`);

        return {
            url,
            isPriority: is_priority
        };
    } catch {
        return falsyResponse;
    }
};

export const backwardCompatibilityFilter = (wallets: ReadonlyArray<TonWalletStandard>) =>
    wallets.filter(
        (w: TonWalletStandard) => !backwardCompatibilityOnlyWalletVersions.includes(w?.version)
    );
