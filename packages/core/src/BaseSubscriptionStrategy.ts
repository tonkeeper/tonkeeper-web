import {
    IBaseSubscriptionStrategy,
    ISubscriptionFormData,
    IDisplayPlan,
    PurchaseStatuses,
    IProductsInfoPayload
} from './entries/pro';
import { SubscriptionSource } from './pro';

export abstract class BaseSubscriptionStrategy implements IBaseSubscriptionStrategy {
    public abstract readonly source: SubscriptionSource;

    public abstract subscribe(formData: ISubscriptionFormData): Promise<PurchaseStatuses>;
    public abstract getAllProductsInfoCore(payload?: IProductsInfoPayload): Promise<IDisplayPlan[]>;
}
