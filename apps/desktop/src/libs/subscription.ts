import { SubscriptionSource } from '@tonkeeper/core/dist/pro';
import {
    ICryptoSubscriptionStrategy,
    IDisplayPlan,
    NormalizedProPlans
} from '@tonkeeper/core/dist/entries/pro';
import { getProServiceTiers } from '@tonkeeper/core/dist/service/proService';
import { Language } from '@tonkeeper/core/dist/entries/language';
import { getFormattedProPrice } from '@tonkeeper/uikit/dist/libs/pro';

class CryptoSubscriptionStrategy implements ICryptoSubscriptionStrategy {
    public source = SubscriptionSource.CRYPTO as const;

    async getAllProductsInfo(lang?: Language, promoCode?: string): Promise<NormalizedProPlans> {
        try {
            const verifiedPromoCode = promoCode !== '' ? promoCode : undefined;
            const plans = await getProServiceTiers(lang, verifiedPromoCode);

            const normalizedPlans: IDisplayPlan[] = plans.map(plan => ({
                id: String(plan.id),
                displayName: plan.name,
                displayPrice: plan.amount,
                subscriptionPeriod: 'year',
                formattedDisplayPrice: getFormattedProPrice(plan.amount, true)
            }));

            return { plans: normalizedPlans, verifiedPromoCode };
        } catch (e) {
            console.error('Failed to fetch products info:', e);
            return { plans: undefined, verifiedPromoCode: undefined };
        }
    }
}

export const Subscription = new CryptoSubscriptionStrategy();
