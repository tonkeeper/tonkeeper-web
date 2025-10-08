import {
    ICryptoSubscriptionStrategy as ICryptoStrategy,
    IDisplayPlan,
    ISubscriptionFormData,
    PurchaseStatuses
} from './entries/pro';
import { SubscriptionSource } from './pro';
import { getProServiceTiers } from './service/proService';
import { Language } from './entries/language';
import { getFormattedProPrice } from './utils/pro';
import { BaseSubscriptionStrategy as BaseStrategy } from './BaseSubscriptionStrategy';

export class CryptoSubscriptionStrategy extends BaseStrategy implements ICryptoStrategy {
    public source = SubscriptionSource.CRYPTO as const;

    async subscribe(formData: ISubscriptionFormData): Promise<PurchaseStatuses> {
        // TODO Develop it after backend side
        if (!formData) {
            return PurchaseStatuses.CANCELED;
        }

        return PurchaseStatuses.SUCCESS;
    }

    async getAllProductsInfoCore(lang?: Language): Promise<IDisplayPlan[]> {
        const plans = await getProServiceTiers(lang);

        return plans.map(plan => ({
            id: String(plan.id),
            displayName: plan.name,
            displayPrice: plan.amount,
            subscriptionPeriod: 'month',
            formattedDisplayPrice: getFormattedProPrice(plan.amount, true)
        }));
    }
}
