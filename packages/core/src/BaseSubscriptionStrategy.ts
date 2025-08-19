import {
    IBaseSubscriptionStrategy,
    ISubscriptionFormData,
    NormalizedProPlans,
    ProSubscription,
    PurchaseStatuses
} from './entries/pro';
import { AppKey } from './Keys';
import { IStorage } from './Storage';
import { Language } from './entries/language';
import { AuthService, SubscriptionSource } from './pro';
import { IProAuthTokenService } from './service/proService';
import { ProAuthTokenService } from './ProAuthTokenService';

export abstract class BaseSubscriptionStrategy implements IBaseSubscriptionStrategy {
    public abstract readonly source: SubscriptionSource;

    protected readonly authTokenService: IProAuthTokenService;

    protected constructor(protected readonly storage: IStorage) {
        this.authTokenService = new ProAuthTokenService(storage);
    }

    async getToken(): Promise<string | null> {
        return this.authTokenService.getToken();
    }

    async activateTrial(token: string) {
        await this.authTokenService.setToken(token);
        await this.storage.set<boolean>(AppKey.PRO_USED_TRIAL, true);
    }

    async logout() {
        try {
            const mainToken = await this.authTokenService.getToken();

            if (mainToken) {
                await AuthService.logout(`Bearer ${mainToken}`);
                await this.authTokenService.deleteToken();
            }
        } finally {
            await this.authTokenService.deleteToken();
        }
    }

    async getAllProductsInfo(lang?: Language, promoCode?: string): Promise<NormalizedProPlans> {
        try {
            return await this.getAllProductsInfoCore(lang, promoCode);
        } catch (e) {
            console.error('Failed to fetch products info:', e);
            return { plans: undefined, verifiedPromoCode: undefined };
        }
    }

    protected abstract getAllProductsInfoCore(
        lang?: Language,
        promoCode?: string
    ): Promise<NormalizedProPlans>;

    public abstract subscribe(formData: ISubscriptionFormData): Promise<PurchaseStatuses>;
    public abstract getSubscription(tempToken: string | null): Promise<ProSubscription>;
}
