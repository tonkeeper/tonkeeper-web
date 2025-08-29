import {
    IBaseSubscriptionStrategy,
    ISubscriptionFormData,
    IDisplayPlan,
    PurchaseStatuses
} from './entries/pro';
import { Language } from './entries/language';
import { SubscriptionSource } from './pro';

export abstract class BaseSubscriptionStrategy implements IBaseSubscriptionStrategy {
    public abstract readonly source: SubscriptionSource;

    public abstract subscribe(formData: ISubscriptionFormData): Promise<PurchaseStatuses>;
    public abstract getAllProductsInfoCore(lang?: Language): Promise<IDisplayPlan[]>;
}
