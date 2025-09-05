import {
    IDisplayPlan,
    IExtensionStrategyConfig,
    IExtensionSubscriptionStrategy as IExtensionStrategy,
    isTonWalletStandard,
    ISubscriptionFormData,
    PurchaseErrors,
    PurchaseStatuses
} from './entries/pro';
import { SubscriptionExtension, SubscriptionSource } from './pro';
import { getProExtensionData, getProServiceTiers } from './service/proService';
import { Language } from './entries/language';
import { getFormattedProPrice } from './utils/pro';
import { BaseSubscriptionStrategy as BaseStrategy } from './BaseSubscriptionStrategy';

export class ExtensionSubscriptionStrategy extends BaseStrategy implements IExtensionStrategy {
    public source = SubscriptionSource.EXTENSION as const;

    constructor(private readonly config: IExtensionStrategyConfig) {
        super();
    }

    async subscribe(formData: ISubscriptionFormData): Promise<PurchaseStatuses> {
        const { onProConfirmOpen, lang } = this.config;
        const { wallet, selectedPlan, tempToken } = formData;

        const tierId = Number(selectedPlan.id);

        if (!tierId || !onProConfirmOpen || !wallet) {
            throw new Error(PurchaseErrors.PURCHASE_FAILED);
        }

        if (!isTonWalletStandard(wallet)) {
            throw new Error(PurchaseErrors.INCORRECT_WALLET_TYPE);
        }

        const extension = await getProExtensionData(tempToken, lang, tierId);

        if (!extension.ok) {
            throw new Error(extension.data);
        }

        return new Promise<PurchaseStatuses>(resolve => {
            const onConfirm = async (success?: boolean) => {
                if (!success) return resolve(PurchaseStatuses.CANCELED);

                // const pendingSubscription: ICryptoPendingSubscription = {
                //     source: SubscriptionSource.CRYPTO,
                //     status: CryptoSubscriptionStatuses.PENDING,
                //     valid: false,
                //     displayName,
                //     displayPrice: formattedDisplayPrice,
                //     auth: {
                //         type: AuthTypes.WALLET,
                //         wallet,
                //         tempToken
                //     }
                // };
                //
                // await this.storage.set<ICryptoPendingSubscription>(
                //     AppKey.PRO_PENDING_SUBSCRIPTION,
                //     pendingSubscription
                // );

                resolve(PurchaseStatuses.PENDING);
            };

            onProConfirmOpen({
                extensionData: extension.data,
                onConfirm,
                onCancel: () => {
                    resolve(PurchaseStatuses.CANCELED);
                }
            });
        });
    }

    async cancelSubscription(extensionData: SubscriptionExtension): Promise<PurchaseStatuses> {
        const { onRemoveExtensionConfirmOpen } = this.config;

        return new Promise<PurchaseStatuses>(resolve => {
            onRemoveExtensionConfirmOpen({
                extensionData,
                onConfirm: () => {
                    resolve(PurchaseStatuses.PENDING);
                },
                onCancel: () => {
                    resolve(PurchaseStatuses.CANCELED);
                }
            });
        });
    }

    async getAllProductsInfoCore(lang?: Language): Promise<IDisplayPlan[]> {
        const plans = await getProServiceTiers(lang);

        const filteredPlans = plans.filter(plan => plan.id === 1);

        return filteredPlans.map(plan => ({
            id: String(plan.id),
            displayName: plan.name,
            displayPrice: plan.amount,
            subscriptionPeriod: 'month',
            formattedDisplayPrice: getFormattedProPrice(plan.amount, true)
        }));
    }
}
